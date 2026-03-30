package service

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/letmein/server/internal/model"
	"github.com/letmein/server/internal/repository"
	pkgauth "github.com/letmein/server/pkg/auth"
	"github.com/redis/go-redis/v9"
)

var (
	ErrInvalidRefreshToken = errors.New("invalid or expired refresh token")
	ErrUserNotFound        = errors.New("user not found")
	ErrUserWithdrawn       = errors.New("withdrawn user")
	ErrNotWithdrawing      = errors.New("account is not in withdrawing state")
)

const refreshTokenTTL = 14 * 24 * time.Hour

type LoginResult struct {
	AccessToken  string      `json:"access_token"`
	RefreshToken string      `json:"refresh_token"`
	IsNewUser    bool        `json:"is_new_user"`
	User         *model.User `json:"user"`
}

type AuthService interface {
	KakaoLogin(kakaoAccessToken string) (*LoginResult, error)
	AppleLogin(appleUserID string, email string, fullName string) (*LoginResult, error)
	DevLogin(userID int64) (*LoginResult, error)
	RefreshToken(refreshToken string) (string, error)
	Logout(userID int64) error
	DeleteAccount(userID int64) error
	RestoreAccount(userID int64) error
}

type authService struct {
	userRepo   repository.UserRepository
	jwtManager *pkgauth.JWTManager
	rdb        *redis.Client
}

func NewAuthService(
	userRepo repository.UserRepository,
	jwtManager *pkgauth.JWTManager,
	rdb *redis.Client,
) AuthService {
	return &authService{
		userRepo:   userRepo,
		jwtManager: jwtManager,
		rdb:        rdb,
	}
}

func (s *authService) KakaoLogin(kakaoAccessToken string) (*LoginResult, error) {
	kakaoUser, err := pkgauth.VerifyKakaoToken(kakaoAccessToken)
	if err != nil {
		return nil, fmt.Errorf("kakao verification failed: %w", err)
	}

	isNewUser := false
	user, err := s.userRepo.FindByKakaoID(kakaoUser.ID)
	if errors.Is(err, repository.ErrNotFound) {
		// New user: create record
		isNewUser = true
		newUser := &model.User{
			KakaoID: kakaoUser.ID,
			Role:    "user",
			Status:  "active",
		}
		if kakaoUser.ProfileImage != "" {
			newUser.ProfileImage = &kakaoUser.ProfileImage
		}
		user, err = s.userRepo.Create(newUser)
		if err != nil {
			return nil, fmt.Errorf("create user: %w", err)
		}
	} else if err != nil {
		return nil, fmt.Errorf("find user: %w", err)
	}

	if user.Status == "withdrawn" {
		return nil, ErrUserWithdrawn
	}

	accessToken, err := s.jwtManager.GenerateAccessToken(user.ID, user.Role)
	if err != nil {
		return nil, fmt.Errorf("generate access token: %w", err)
	}

	refreshToken, err := s.jwtManager.GenerateRefreshToken(user.ID)
	if err != nil {
		return nil, fmt.Errorf("generate refresh token: %w", err)
	}

	key := fmt.Sprintf("refresh:%d", user.ID)
	if err := s.rdb.Set(context.Background(), key, refreshToken, refreshTokenTTL).Err(); err != nil {
		return nil, fmt.Errorf("store refresh token: %w", err)
	}

	return &LoginResult{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		IsNewUser:    isNewUser,
		User:         user,
	}, nil
}

func (s *authService) AppleLogin(appleUserID string, email string, fullName string) (*LoginResult, error) {
	isNewUser := false
	user, err := s.userRepo.FindByAppleID(appleUserID)
	if errors.Is(err, repository.ErrNotFound) {
		// New user: create record.
		isNewUser = true
		newUser := &model.User{
			AppleID: &appleUserID,
			Role:    "user",
			Status:  "active",
		}
		// Seed nickname from fullName when provided on first sign-in.
		// The user can always update it later via POST /auth/nickname.
		if fullName != "" {
			newUser.Nickname = &fullName
		}
		user, err = s.userRepo.CreateWithApple(newUser)
		if err != nil {
			return nil, fmt.Errorf("create apple user: %w", err)
		}
	} else if err != nil {
		return nil, fmt.Errorf("find apple user: %w", err)
	}

	if user.Status == "withdrawn" {
		return nil, ErrUserWithdrawn
	}

	accessToken, err := s.jwtManager.GenerateAccessToken(user.ID, user.Role)
	if err != nil {
		return nil, fmt.Errorf("generate access token: %w", err)
	}

	refreshToken, err := s.jwtManager.GenerateRefreshToken(user.ID)
	if err != nil {
		return nil, fmt.Errorf("generate refresh token: %w", err)
	}

	key := fmt.Sprintf("refresh:%d", user.ID)
	if err := s.rdb.Set(context.Background(), key, refreshToken, refreshTokenTTL).Err(); err != nil {
		return nil, fmt.Errorf("store refresh token: %w", err)
	}

	return &LoginResult{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		IsNewUser:    isNewUser,
		User:         user,
	}, nil
}

func (s *authService) DevLogin(userID int64) (*LoginResult, error) {
	user, err := s.userRepo.GetByID(userID)
	if err != nil {
		return nil, fmt.Errorf("user not found: %w", err)
	}

	isNewUser := user.Nickname == nil || *user.Nickname == ""

	accessToken, err := s.jwtManager.GenerateAccessToken(user.ID, user.Role)
	if err != nil {
		return nil, fmt.Errorf("generate access token: %w", err)
	}

	refreshToken, err := s.jwtManager.GenerateRefreshToken(user.ID)
	if err != nil {
		return nil, fmt.Errorf("generate refresh token: %w", err)
	}

	key := fmt.Sprintf("refresh:%d", user.ID)
	if err := s.rdb.Set(context.Background(), key, refreshToken, refreshTokenTTL).Err(); err != nil {
		return nil, fmt.Errorf("store refresh token: %w", err)
	}

	return &LoginResult{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		IsNewUser:    isNewUser,
		User:         user,
	}, nil
}

func (s *authService) RefreshToken(refreshToken string) (string, error) {
	claims, err := s.jwtManager.ValidateToken(refreshToken)
	if err != nil {
		return "", ErrInvalidRefreshToken
	}

	key := fmt.Sprintf("refresh:%d", claims.UserID)
	stored, err := s.rdb.Get(context.Background(), key).Result()
	if errors.Is(err, redis.Nil) || stored != refreshToken {
		return "", ErrInvalidRefreshToken
	}
	if err != nil {
		return "", fmt.Errorf("redis get: %w", err)
	}

	user, err := s.userRepo.GetByID(claims.UserID)
	if errors.Is(err, repository.ErrNotFound) {
		return "", ErrUserNotFound
	}
	if err != nil {
		return "", fmt.Errorf("get user: %w", err)
	}

	if user.Status == "withdrawn" {
		return "", ErrUserWithdrawn
	}

	newAccessToken, err := s.jwtManager.GenerateAccessToken(user.ID, user.Role)
	if err != nil {
		return "", fmt.Errorf("generate access token: %w", err)
	}
	return newAccessToken, nil
}

func (s *authService) Logout(userID int64) error {
	key := fmt.Sprintf("refresh:%d", userID)
	return s.rdb.Del(context.Background(), key).Err()
}

// DeleteAccount initiates the 7-day withdrawal grace period.
// The user's status becomes 'withdrawing'; actual data deletion is handled
// by the withdrawal scheduler after 7 days.
func (s *authService) DeleteAccount(userID int64) error {
	if err := s.userRepo.RequestWithdrawal(userID); err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return ErrUserNotFound
		}
		return fmt.Errorf("request withdrawal: %w", err)
	}
	// Invalidate session immediately.
	_ = s.Logout(userID)
	return nil
}

// RestoreAccount cancels a pending withdrawal if still within the grace period.
func (s *authService) RestoreAccount(userID int64) error {
	if err := s.userRepo.RestoreWithdrawal(userID); err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return ErrNotWithdrawing
		}
		return fmt.Errorf("restore withdrawal: %w", err)
	}
	return nil
}
