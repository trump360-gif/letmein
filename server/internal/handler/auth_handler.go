package handler

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/letmein/server/internal/middleware"
	"github.com/letmein/server/internal/repository"
	"github.com/letmein/server/internal/service"
	pkgauth "github.com/letmein/server/pkg/auth"
)

type AuthHandler struct {
	authSvc       service.AuthService
	userRepo      repository.UserRepository
	appleVerifier *pkgauth.AppleTokenVerifier
}

func NewAuthHandler(authSvc service.AuthService, userRepo repository.UserRepository) *AuthHandler {
	return &AuthHandler{
		authSvc:       authSvc,
		userRepo:      userRepo,
		appleVerifier: pkgauth.NewAppleTokenVerifier(""),
	}
}

// POST /api/v1/auth/kakao
func (h *AuthHandler) KakaoLogin(c *gin.Context) {
	var req struct {
		KakaoAccessToken string `json:"kakaoAccessToken" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "kakaoAccessToken is required"})
		return
	}

	result, err := h.authSvc.KakaoLogin(req.KakaoAccessToken)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrUserWithdrawn):
			c.JSON(http.StatusForbidden, gin.H{"error": "withdrawn user"})
		default:
			c.JSON(http.StatusUnauthorized, gin.H{"error": "kakao authentication failed"})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": gin.H{
			"accessToken":  result.AccessToken,
			"refreshToken": result.RefreshToken,
			"isNewUser":    result.IsNewUser,
			"user":         result.User,
		},
	})
}

// POST /api/v1/auth/apple
func (h *AuthHandler) AppleLogin(c *gin.Context) {
	var req struct {
		IdentityToken string `json:"identityToken" binding:"required"`
		FullName      string `json:"fullName"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "identityToken is required"})
		return
	}

	claims, err := h.appleVerifier.VerifyIdentityToken(req.IdentityToken)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "apple authentication failed"})
		return
	}

	result, err := h.authSvc.AppleLogin(claims.Sub, claims.Email, req.FullName)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrUserWithdrawn):
			c.JSON(http.StatusForbidden, gin.H{"error": "withdrawn user"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "apple login failed"})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": gin.H{
			"accessToken":  result.AccessToken,
			"refreshToken": result.RefreshToken,
			"isNewUser":    result.IsNewUser,
			"user":         result.User,
		},
	})
}

// POST /api/v1/auth/dev-login — DEV ONLY: skip Kakao, login as test user
func (h *AuthHandler) DevLogin(c *gin.Context) {
	var req struct {
		UserID int64 `json:"userId"`
	}
	if err := c.ShouldBindJSON(&req); err != nil || req.UserID == 0 {
		req.UserID = 1 // default to test user 1
	}

	result, err := h.authSvc.DevLogin(req.UserID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": gin.H{
			"accessToken":  result.AccessToken,
			"refreshToken": result.RefreshToken,
			"isNewUser":    result.IsNewUser,
			"user":         result.User,
		},
	})
}

// POST /api/v1/auth/refresh
func (h *AuthHandler) RefreshToken(c *gin.Context) {
	var req struct {
		RefreshToken string `json:"refreshToken" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "refreshToken is required"})
		return
	}

	accessToken, err := h.authSvc.RefreshToken(req.RefreshToken)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrUserWithdrawn):
			c.JSON(http.StatusForbidden, gin.H{"error": "withdrawn user"})
		case errors.Is(err, service.ErrUserNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		default:
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid or expired refresh token"})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": gin.H{"accessToken": accessToken},
	})
}

// GET /api/v1/auth/me  (authenticated)
func (h *AuthHandler) GetMe(c *gin.Context) {
	userID, _ := c.Get(middleware.ContextKeyUserID)
	uid, ok := userID.(int64)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	user, err := h.userRepo.GetByID(uid)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get user info"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": user})
}

// POST /api/v1/auth/logout  (authenticated)
func (h *AuthHandler) Logout(c *gin.Context) {
	userID, _ := c.Get(middleware.ContextKeyUserID)
	uid, ok := userID.(int64)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	if err := h.authSvc.Logout(uid); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "logout failed"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": gin.H{"message": "logged out successfully"}})
}

// POST /api/v1/auth/nickname  (authenticated)
func (h *AuthHandler) UpdateNickname(c *gin.Context) {
	userID, _ := c.Get(middleware.ContextKeyUserID)
	uid, ok := userID.(int64)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var req struct {
		Nickname string `json:"nickname" binding:"required,min=1,max=20"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "nickname must be 1–20 characters"})
		return
	}

	exists, err := h.userRepo.CheckNicknameExists(req.Nickname)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to check nickname"})
		return
	}
	if exists {
		c.JSON(http.StatusConflict, gin.H{"error": "nickname already taken"})
		return
	}

	if err := h.userRepo.UpdateNickname(uid, req.Nickname); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update nickname"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": gin.H{"nickname": req.Nickname}})
}

// GET /api/v1/auth/nickname/check?nickname=xxx
func (h *AuthHandler) CheckNickname(c *gin.Context) {
	nickname := c.Query("nickname")
	if nickname == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "nickname query parameter is required"})
		return
	}

	exists, err := h.userRepo.CheckNicknameExists(nickname)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to check nickname"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": gin.H{"available": !exists}})
}

// DELETE /api/v1/auth/account  (authenticated)
// Initiates 7-day withdrawal grace period. Actual data deletion happens via scheduler.
func (h *AuthHandler) DeleteAccount(c *gin.Context) {
	userID, _ := c.Get(middleware.ContextKeyUserID)
	uid, ok := userID.(int64)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	if err := h.authSvc.DeleteAccount(uid); err != nil {
		switch {
		case errors.Is(err, service.ErrUserNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to initiate withdrawal"})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": gin.H{
		"message": "withdrawal initiated — account will be deleted after 7 days",
	}})
}

// POST /api/v1/auth/restore  (authenticated)
// Cancels a pending withdrawal if still within the 7-day grace period.
func (h *AuthHandler) RestoreAccount(c *gin.Context) {
	userID, _ := c.Get(middleware.ContextKeyUserID)
	uid, ok := userID.(int64)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	if err := h.authSvc.RestoreAccount(uid); err != nil {
		switch {
		case errors.Is(err, service.ErrNotWithdrawing):
			c.JSON(http.StatusConflict, gin.H{"error": "account is not in withdrawing state"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to restore account"})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": gin.H{"message": "account restored successfully"}})
}
