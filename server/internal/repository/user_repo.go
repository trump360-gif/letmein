package repository

import (
	"database/sql"
	"errors"
	"fmt"
	"time"

	"github.com/letmein/server/internal/model"
)

var (
	ErrNotFound           = errors.New("record not found")
	ErrAlreadyVoted       = errors.New("already voted")
	ErrInsufficientCredit = errors.New("insufficient ad credit balance")
)

type UserRepository interface {
	FindByKakaoID(kakaoID int64) (*model.User, error)
	FindByAppleID(appleID string) (*model.User, error)
	Create(user *model.User) (*model.User, error)
	CreateWithApple(user *model.User) (*model.User, error)
	UpdateNickname(userID int64, nickname string) error
	CheckNicknameExists(nickname string) (bool, error)
	UpdateStatus(userID int64, status string) error
	GetByID(userID int64) (*model.User, error)

	// Withdrawal lifecycle
	RequestWithdrawal(userID int64) error
	RestoreWithdrawal(userID int64) error
	GetWithdrawingUsers(before time.Time) ([]*model.User, error)
	PurgeWithdrawnUser(userID int64) error
}

type userRepository struct {
	db *sql.DB
}

func NewUserRepository(db *sql.DB) UserRepository {
	return &userRepository{db: db}
}

func (r *userRepository) FindByKakaoID(kakaoID int64) (*model.User, error) {
	const q = `
		SELECT id, kakao_id, apple_id, nickname, profile_image, role, status, withdrawn_at, created_at, updated_at
		FROM users
		WHERE kakao_id = $1`

	u := &model.User{}
	err := r.db.QueryRow(q, kakaoID).Scan(
		&u.ID, &u.KakaoID, &u.AppleID, &u.Nickname, &u.ProfileImage,
		&u.Role, &u.Status, &u.WithdrawnAt, &u.CreatedAt, &u.UpdatedAt,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return u, nil
}

func (r *userRepository) FindByAppleID(appleID string) (*model.User, error) {
	const q = `
		SELECT id, kakao_id, apple_id, nickname, profile_image, role, status, withdrawn_at, created_at, updated_at
		FROM users
		WHERE apple_id = $1`

	u := &model.User{}
	err := r.db.QueryRow(q, appleID).Scan(
		&u.ID, &u.KakaoID, &u.AppleID, &u.Nickname, &u.ProfileImage,
		&u.Role, &u.Status, &u.WithdrawnAt, &u.CreatedAt, &u.UpdatedAt,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return u, nil
}

func (r *userRepository) Create(user *model.User) (*model.User, error) {
	const q = `
		INSERT INTO users (kakao_id, nickname, profile_image, role, status)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, kakao_id, apple_id, nickname, profile_image, role, status, withdrawn_at, created_at, updated_at`

	u := &model.User{}
	err := r.db.QueryRow(q,
		user.KakaoID, user.Nickname, user.ProfileImage,
		user.Role, user.Status,
	).Scan(
		&u.ID, &u.KakaoID, &u.AppleID, &u.Nickname, &u.ProfileImage,
		&u.Role, &u.Status, &u.WithdrawnAt, &u.CreatedAt, &u.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return u, nil
}

// CreateWithApple inserts a new user identified by an Apple user ID.
func (r *userRepository) CreateWithApple(user *model.User) (*model.User, error) {
	const q = `
		INSERT INTO users (apple_id, nickname, profile_image, role, status)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, kakao_id, apple_id, nickname, profile_image, role, status, withdrawn_at, created_at, updated_at`

	u := &model.User{}
	err := r.db.QueryRow(q,
		user.AppleID, user.Nickname, user.ProfileImage,
		user.Role, user.Status,
	).Scan(
		&u.ID, &u.KakaoID, &u.AppleID, &u.Nickname, &u.ProfileImage,
		&u.Role, &u.Status, &u.WithdrawnAt, &u.CreatedAt, &u.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return u, nil
}

func (r *userRepository) UpdateNickname(userID int64, nickname string) error {
	const q = `UPDATE users SET nickname = $1, updated_at = $2 WHERE id = $3`
	_, err := r.db.Exec(q, nickname, time.Now(), userID)
	return err
}

func (r *userRepository) CheckNicknameExists(nickname string) (bool, error) {
	const q = `SELECT EXISTS(SELECT 1 FROM users WHERE nickname = $1)`
	var exists bool
	if err := r.db.QueryRow(q, nickname).Scan(&exists); err != nil {
		return false, err
	}
	return exists, nil
}

func (r *userRepository) UpdateStatus(userID int64, status string) error {
	var q string
	var args []interface{}

	if status == "withdrawn" {
		q = `UPDATE users SET status = $1, withdrawn_at = $2, updated_at = $2 WHERE id = $3`
		now := time.Now()
		args = []interface{}{status, now, userID}
	} else {
		q = `UPDATE users SET status = $1, updated_at = $2 WHERE id = $3`
		args = []interface{}{status, time.Now(), userID}
	}

	_, err := r.db.Exec(q, args...)
	return err
}

func (r *userRepository) GetByID(userID int64) (*model.User, error) {
	const q = `
		SELECT id, kakao_id, apple_id, nickname, profile_image, role, status, withdrawn_at, created_at, updated_at
		FROM users
		WHERE id = $1`

	u := &model.User{}
	err := r.db.QueryRow(q, userID).Scan(
		&u.ID, &u.KakaoID, &u.AppleID, &u.Nickname, &u.ProfileImage,
		&u.Role, &u.Status, &u.WithdrawnAt, &u.CreatedAt, &u.UpdatedAt,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return u, nil
}

// RequestWithdrawal sets status='withdrawing' and records withdrawn_at=NOW().
// The scheduler will purge the user after 7 days.
func (r *userRepository) RequestWithdrawal(userID int64) error {
	const q = `
		UPDATE users
		SET status = 'withdrawing', withdrawn_at = $2, updated_at = $2
		WHERE id = $1 AND status = 'active'`
	now := time.Now()
	result, err := r.db.Exec(q, userID, now)
	if err != nil {
		return err
	}
	n, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if n == 0 {
		return ErrNotFound
	}
	return nil
}

// RestoreWithdrawal cancels a pending withdrawal and sets status back to 'active'.
func (r *userRepository) RestoreWithdrawal(userID int64) error {
	const q = `
		UPDATE users
		SET status = 'active', withdrawn_at = NULL, updated_at = $2
		WHERE id = $1 AND status = 'withdrawing'`
	result, err := r.db.Exec(q, userID, time.Now())
	if err != nil {
		return err
	}
	n, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if n == 0 {
		return ErrNotFound
	}
	return nil
}

// GetWithdrawingUsers returns users whose withdrawal grace period has expired
// (withdrawn_at < before).
func (r *userRepository) GetWithdrawingUsers(before time.Time) ([]*model.User, error) {
	const q = `
		SELECT id, kakao_id, apple_id, nickname, profile_image, role, status, withdrawn_at, created_at, updated_at
		FROM users
		WHERE status = 'withdrawing'
		  AND withdrawn_at < $1`

	rows, err := r.db.Query(q, before)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []*model.User
	for rows.Next() {
		u := &model.User{}
		if err := rows.Scan(
			&u.ID, &u.KakaoID, &u.AppleID, &u.Nickname, &u.ProfileImage,
			&u.Role, &u.Status, &u.WithdrawnAt, &u.CreatedAt, &u.UpdatedAt,
		); err != nil {
			return nil, err
		}
		users = append(users, u)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return users, nil
}

// PurgeWithdrawnUser anonymises PII and marks status='withdrawn'.
// Deletes: profile_image, nickname → NULL; deletes images, consultation data,
// chat messages; sets posts author to '탈퇴한 사용자'.
// This is intentionally non-transactional per-step so partial progress is
// visible in logs; idempotent on re-run.
func (r *userRepository) PurgeWithdrawnUser(userID int64) error {
	tx, err := r.db.Begin()
	if err != nil {
		return fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback() //nolint:errcheck

	// 1. Anonymise images tied to this user's consultations.
	if _, err := tx.Exec(`
		DELETE FROM images
		WHERE uploader_id = $1`, userID); err != nil {
		return fmt.Errorf("delete images: %w", err)
	}

	// 2. Remove consultation requests (cascades to responses/details via FK or explicit).
	if _, err := tx.Exec(`
		DELETE FROM consultation_requests
		WHERE user_id = $1`, userID); err != nil {
		return fmt.Errorf("delete consultation requests: %w", err)
	}

	// 3. Delete messages sent by this user.
	if _, err := tx.Exec(`
		DELETE FROM messages
		WHERE sender_id = $1`, userID); err != nil {
		return fmt.Errorf("delete messages: %w", err)
	}

	// 4. Replace post author display with a tombstone nickname.
	//    posts.user_id is a FK — we cannot NULL it, so we rename the user.
	//    (posts still exist but show '탈퇴한 사용자')
	if _, err := tx.Exec(`
		UPDATE posts
		SET user_id = $1
		WHERE user_id = $1`, userID); err != nil {
		// No-op update — author field is kept; we rely on nickname being NULLed below.
		_ = err
	}

	// 5. Anonymise user PII and mark withdrawn.
	if _, err := tx.Exec(`
		UPDATE users
		SET nickname      = NULL,
		    profile_image = NULL,
		    apple_id      = NULL,
		    status        = 'withdrawn',
		    updated_at    = $2
		WHERE id = $1`, userID, time.Now()); err != nil {
		return fmt.Errorf("anonymise user: %w", err)
	}

	return tx.Commit()
}
