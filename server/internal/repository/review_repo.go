package repository

import (
	"database/sql"
	"errors"
	"fmt"
	"time"

	"github.com/letmein/server/internal/model"
)

// ReviewRepository defines persistence operations for hospital reviews.
type ReviewRepository interface {
	CreateReview(review *model.Review) (*model.Review, error)
	GetByID(id int64) (*model.Review, error)
	UpdateReview(id int64, rating int, content string) error
	DeleteReview(id int64) error
	ListByHospital(hospitalID int64, cursor int64, limit int) ([]*model.ReviewListItem, error)
	CheckDuplicate(userID, hospitalID, requestID int64) (bool, error)
	UpdateHospitalStats(hospitalID int64) error
	AddImages(reviewID int64, urls []string) error
	DeleteImages(reviewID int64) error
}

type reviewRepository struct {
	db *sql.DB
}

func NewReviewRepository(db *sql.DB) ReviewRepository {
	return &reviewRepository{db: db}
}

// ──────────────────────────────────────────────
// Reviews
// ──────────────────────────────────────────────

func (r *reviewRepository) CreateReview(review *model.Review) (*model.Review, error) {
	tx, err := r.db.Begin()
	if err != nil {
		return nil, fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback() //nolint:errcheck

	const q = `
		INSERT INTO reviews (user_id, hospital_id, request_id, rating, content, status)
		VALUES ($1, $2, $3, $4, $5, 'active')
		RETURNING id, user_id, hospital_id, request_id, rating, content, status, created_at, updated_at`

	rev := &model.Review{}
	err = tx.QueryRow(q,
		review.UserID,
		review.HospitalID,
		review.RequestID,
		review.Rating,
		review.Content,
	).Scan(
		&rev.ID, &rev.UserID, &rev.HospitalID, &rev.RequestID,
		&rev.Rating, &rev.Content, &rev.Status,
		&rev.CreatedAt, &rev.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("insert review: %w", err)
	}

	if len(review.ImageURLs) > 0 {
		for i, url := range review.ImageURLs {
			const imgQ = `INSERT INTO review_images (review_id, url, sort_order) VALUES ($1, $2, $3)`
			if _, err := tx.Exec(imgQ, rev.ID, url, i); err != nil {
				return nil, fmt.Errorf("insert review image %d: %w", i, err)
			}
		}
	}

	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("commit tx: %w", err)
	}

	rev.ImageURLs = review.ImageURLs
	if rev.ImageURLs == nil {
		rev.ImageURLs = []string{}
	}
	return rev, nil
}

func (r *reviewRepository) GetByID(id int64) (*model.Review, error) {
	const q = `
		SELECT
			rv.id, rv.user_id, rv.hospital_id, rv.request_id,
			rv.rating, rv.content, rv.status,
			COALESCE(u.nickname, '알 수 없음') AS author_nickname,
			rv.created_at, rv.updated_at
		FROM reviews rv
		LEFT JOIN users u ON u.id = rv.user_id
		WHERE rv.id = $1 AND rv.status = 'active'`

	rev := &model.Review{}
	err := r.db.QueryRow(q, id).Scan(
		&rev.ID, &rev.UserID, &rev.HospitalID, &rev.RequestID,
		&rev.Rating, &rev.Content, &rev.Status,
		&rev.AuthorNickname,
		&rev.CreatedAt, &rev.UpdatedAt,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get review: %w", err)
	}

	urls, err := r.getImageURLs(id)
	if err != nil {
		return nil, err
	}
	rev.ImageURLs = urls

	return rev, nil
}

func (r *reviewRepository) getImageURLs(reviewID int64) ([]string, error) {
	const q = `SELECT url FROM review_images WHERE review_id = $1 ORDER BY sort_order ASC`

	rows, err := r.db.Query(q, reviewID)
	if err != nil {
		return nil, fmt.Errorf("get review images: %w", err)
	}
	defer rows.Close()

	var urls []string
	for rows.Next() {
		var url string
		if err := rows.Scan(&url); err != nil {
			return nil, err
		}
		urls = append(urls, url)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	if urls == nil {
		urls = []string{}
	}
	return urls, nil
}

func (r *reviewRepository) UpdateReview(id int64, rating int, content string) error {
	const q = `
		UPDATE reviews
		SET rating = $1, content = $2, updated_at = $3
		WHERE id = $4 AND status = 'active'`

	result, err := r.db.Exec(q, rating, content, time.Now(), id)
	if err != nil {
		return fmt.Errorf("update review: %w", err)
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

func (r *reviewRepository) DeleteReview(id int64) error {
	const q = `UPDATE reviews SET status = 'deleted', updated_at = $1 WHERE id = $2 AND status != 'deleted'`

	result, err := r.db.Exec(q, time.Now(), id)
	if err != nil {
		return fmt.Errorf("delete review: %w", err)
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

func (r *reviewRepository) ListByHospital(hospitalID int64, cursor int64, limit int) ([]*model.ReviewListItem, error) {
	if limit < 1 || limit > 100 {
		limit = 20
	}

	var (
		rows *sql.Rows
		err  error
	)

	if cursor > 0 {
		const q = `
			SELECT
				rv.id, rv.user_id, rv.hospital_id, rv.request_id,
				rv.rating, rv.content,
				COALESCE(u.nickname, '알 수 없음') AS author_nickname,
				rv.created_at
			FROM reviews rv
			LEFT JOIN users u ON u.id = rv.user_id
			WHERE rv.hospital_id = $1 AND rv.status = 'active' AND rv.id < $2
			ORDER BY rv.created_at DESC, rv.id DESC
			LIMIT $3`
		rows, err = r.db.Query(q, hospitalID, cursor, limit)
	} else {
		const q = `
			SELECT
				rv.id, rv.user_id, rv.hospital_id, rv.request_id,
				rv.rating, rv.content,
				COALESCE(u.nickname, '알 수 없음') AS author_nickname,
				rv.created_at
			FROM reviews rv
			LEFT JOIN users u ON u.id = rv.user_id
			WHERE rv.hospital_id = $1 AND rv.status = 'active'
			ORDER BY rv.created_at DESC, rv.id DESC
			LIMIT $2`
		rows, err = r.db.Query(q, hospitalID, limit)
	}
	if err != nil {
		return nil, fmt.Errorf("list reviews: %w", err)
	}
	defer rows.Close()

	var items []*model.ReviewListItem
	for rows.Next() {
		item := &model.ReviewListItem{}
		if err := rows.Scan(
			&item.ID, &item.UserID, &item.HospitalID, &item.RequestID,
			&item.Rating, &item.Content,
			&item.AuthorNickname,
			&item.CreatedAt,
		); err != nil {
			return nil, err
		}
		item.ImageURLs = []string{}
		items = append(items, item)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	if len(items) == 0 {
		return []*model.ReviewListItem{}, nil
	}

	// Batch-fetch images to avoid N+1.
	reviewIDs := make([]interface{}, len(items))
	idxMap := make(map[int64]int, len(items))
	for i, item := range items {
		reviewIDs[i] = item.ID
		idxMap[item.ID] = i
	}

	placeholders := make([]string, len(reviewIDs))
	for i := range reviewIDs {
		placeholders[i] = fmt.Sprintf("$%d", i+1)
	}

	imgQ := fmt.Sprintf(`
		SELECT review_id, url
		FROM review_images
		WHERE review_id IN (%s)
		ORDER BY review_id, sort_order ASC`,
		joinStrings(placeholders, ","),
	)

	imgRows, err := r.db.Query(imgQ, reviewIDs...)
	if err != nil {
		return nil, fmt.Errorf("batch review images: %w", err)
	}
	defer imgRows.Close()

	for imgRows.Next() {
		var reviewID int64
		var url string
		if err := imgRows.Scan(&reviewID, &url); err != nil {
			return nil, err
		}
		if i, ok := idxMap[reviewID]; ok {
			items[i].ImageURLs = append(items[i].ImageURLs, url)
		}
	}
	if err := imgRows.Err(); err != nil {
		return nil, err
	}

	return items, nil
}

// joinStrings joins a slice of strings with a separator.
func joinStrings(ss []string, sep string) string {
	result := ""
	for i, s := range ss {
		if i > 0 {
			result += sep
		}
		result += s
	}
	return result
}

func (r *reviewRepository) CheckDuplicate(userID, hospitalID, requestID int64) (bool, error) {
	const q = `
		SELECT EXISTS(
			SELECT 1 FROM reviews
			WHERE user_id = $1 AND hospital_id = $2 AND request_id = $3
			  AND status != 'deleted'
		)`

	var exists bool
	if err := r.db.QueryRow(q, userID, hospitalID, requestID).Scan(&exists); err != nil {
		return false, fmt.Errorf("check duplicate review: %w", err)
	}
	return exists, nil
}

// UpdateHospitalStats recalculates avg_rating and review_count for the given hospital.
func (r *reviewRepository) UpdateHospitalStats(hospitalID int64) error {
	const q = `
		UPDATE hospitals
		SET
			avg_rating  = COALESCE((SELECT ROUND(AVG(rating)::NUMERIC, 1) FROM reviews WHERE hospital_id = $1 AND status = 'active'), 0),
			review_count = (SELECT COUNT(*) FROM reviews WHERE hospital_id = $1 AND status = 'active'),
			updated_at  = $2
		WHERE id = $1`

	if _, err := r.db.Exec(q, hospitalID, time.Now()); err != nil {
		return fmt.Errorf("update hospital stats: %w", err)
	}
	return nil
}

func (r *reviewRepository) AddImages(reviewID int64, urls []string) error {
	for i, url := range urls {
		const q = `INSERT INTO review_images (review_id, url, sort_order) VALUES ($1, $2, $3)`
		if _, err := r.db.Exec(q, reviewID, url, i); err != nil {
			return fmt.Errorf("add review image %d: %w", i, err)
		}
	}
	return nil
}

func (r *reviewRepository) DeleteImages(reviewID int64) error {
	const q = `DELETE FROM review_images WHERE review_id = $1`
	if _, err := r.db.Exec(q, reviewID); err != nil {
		return fmt.Errorf("delete review images: %w", err)
	}
	return nil
}
