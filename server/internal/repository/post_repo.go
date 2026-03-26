package repository

import (
	"database/sql"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/letmein/server/internal/model"
)

// PostListParams holds filter/sort/pagination parameters for listing posts.
type PostListParams struct {
	BoardType  string
	CategoryID *int
	HospitalID *int64
	SortBy     string // "latest" | "likes" | "comments"
	Page       int
	Limit      int
}

// PostRepository defines persistence operations for community posts.
type PostRepository interface {
	Create(post *model.Post, imageIDs []int64) (*model.Post, error)
	GetByID(id int64) (*model.PostDetail, error)
	List(params PostListParams) ([]*model.PostListItem, int, error)
	Delete(id int64) error

	CreateComment(comment *model.Comment) (*model.Comment, error)
	GetComments(postID int64) ([]*model.Comment, error)

	ToggleLike(userID, postID int64) (liked bool, count int, err error)

	CreateReport(report *model.Report) (*model.Report, error)
}

type postRepository struct {
	db *sql.DB
}

func NewPostRepository(db *sql.DB) PostRepository {
	return &postRepository{db: db}
}

// ──────────────────────────────────────────────
// Posts
// ──────────────────────────────────────────────

func (r *postRepository) Create(post *model.Post, imageIDs []int64) (*model.Post, error) {
	tx, err := r.db.Begin()
	if err != nil {
		return nil, fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback() //nolint:errcheck

	const q = `
		INSERT INTO posts (user_id, board_type, category_id, title, content, hospital_id, procedure_date, is_anonymous, status)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active')
		RETURNING id, user_id, board_type, category_id, title, content, hospital_id, procedure_date, is_anonymous, status, like_count, comment_count, created_at, updated_at`

	p := &model.Post{}
	err = tx.QueryRow(q,
		post.UserID,
		post.BoardType,
		post.CategoryID,
		post.Title,
		post.Content,
		post.HospitalID,
		post.ProcedureDate,
		post.IsAnonymous,
	).Scan(
		&p.ID, &p.UserID, &p.BoardType, &p.CategoryID, &p.Title, &p.Content,
		&p.HospitalID, &p.ProcedureDate, &p.IsAnonymous, &p.Status,
		&p.LikeCount, &p.CommentCount, &p.CreatedAt, &p.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("insert post: %w", err)
	}

	// Associate uploaded images with this post.
	if len(imageIDs) > 0 {
		for _, imgID := range imageIDs {
			const uq = `UPDATE images SET entity_type = 'community', entity_id = $1 WHERE id = $2`
			if _, err := tx.Exec(uq, p.ID, imgID); err != nil {
				return nil, fmt.Errorf("link image %d: %w", imgID, err)
			}
		}
	}

	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("commit tx: %w", err)
	}
	return p, nil
}

func (r *postRepository) GetByID(id int64) (*model.PostDetail, error) {
	const q = `
		SELECT
			p.id, p.board_type, p.category_id, pc.name AS category_name,
			p.title, p.content, p.is_anonymous, p.user_id,
			CASE WHEN p.is_anonymous THEN '익명' ELSE COALESCE(u.nickname, '알 수 없음') END AS author_nickname,
			p.hospital_id, h.name AS hospital_name,
			p.like_count, p.comment_count, p.created_at, p.updated_at
		FROM posts p
		LEFT JOIN users u ON u.id = p.user_id
		LEFT JOIN procedure_categories pc ON pc.id = p.category_id
		LEFT JOIN hospitals h ON h.id = p.hospital_id
		WHERE p.id = $1 AND p.status != 'deleted'`

	pd := &model.PostDetail{}
	err := r.db.QueryRow(q, id).Scan(
		&pd.ID, &pd.BoardType, &pd.CategoryID, &pd.CategoryName,
		&pd.Title, &pd.Content, &pd.IsAnonymous, &pd.AuthorID,
		&pd.AuthorNickname,
		&pd.HospitalID, &pd.HospitalName,
		&pd.LikeCount, &pd.CommentCount, &pd.CreatedAt, &pd.UpdatedAt,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get post: %w", err)
	}

	// Fetch associated image URLs.
	imageURLs, err := r.getImageURLs(id)
	if err != nil {
		return nil, err
	}
	pd.ImageURLs = imageURLs

	return pd, nil
}

func (r *postRepository) getImageURLs(postID int64) ([]string, error) {
	const q = `
		SELECT COALESCE(medium_path, original_path) AS url
		FROM images
		WHERE entity_type = 'community' AND entity_id = $1
		ORDER BY created_at ASC`

	rows, err := r.db.Query(q, postID)
	if err != nil {
		return nil, fmt.Errorf("get images: %w", err)
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

func (r *postRepository) List(params PostListParams) ([]*model.PostListItem, int, error) {
	if params.Page < 1 {
		params.Page = 1
	}
	if params.Limit < 1 || params.Limit > 100 {
		params.Limit = 20
	}

	conditions := []string{"p.status = 'active'"}
	args := []interface{}{}
	argIdx := 1

	if params.BoardType != "" {
		conditions = append(conditions, fmt.Sprintf("p.board_type = $%d", argIdx))
		args = append(args, params.BoardType)
		argIdx++
	}

	if params.CategoryID != nil {
		conditions = append(conditions, fmt.Sprintf("p.category_id = $%d", argIdx))
		args = append(args, *params.CategoryID)
		argIdx++
	}

	if params.HospitalID != nil {
		conditions = append(conditions, fmt.Sprintf("p.hospital_id = $%d", argIdx))
		args = append(args, *params.HospitalID)
		argIdx++
	}

	where := strings.Join(conditions, " AND ")

	// Count.
	countQ := fmt.Sprintf(`SELECT COUNT(*) FROM posts p WHERE %s`, where)
	var total int
	if err := r.db.QueryRow(countQ, args...).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("count posts: %w", err)
	}

	orderBy := "p.created_at DESC"
	switch params.SortBy {
	case "likes":
		orderBy = "p.like_count DESC, p.created_at DESC"
	case "comments":
		orderBy = "p.comment_count DESC, p.created_at DESC"
	}

	offset := (params.Page - 1) * params.Limit
	dataQ := fmt.Sprintf(`
		SELECT
			p.id, p.board_type, p.category_id, pc.name,
			p.title, p.content, p.is_anonymous,
			CASE WHEN p.is_anonymous THEN '익명' ELSE COALESCE(u.nickname, '알 수 없음') END,
			p.hospital_id, h.name,
			p.like_count, p.comment_count, p.created_at
		FROM posts p
		LEFT JOIN users u ON u.id = p.user_id
		LEFT JOIN procedure_categories pc ON pc.id = p.category_id
		LEFT JOIN hospitals h ON h.id = p.hospital_id
		WHERE %s
		ORDER BY %s
		LIMIT $%d OFFSET $%d`, where, orderBy, argIdx, argIdx+1)

	args = append(args, params.Limit, offset)

	rows, err := r.db.Query(dataQ, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("list posts: %w", err)
	}
	defer rows.Close()

	var items []*model.PostListItem
	for rows.Next() {
		item := &model.PostListItem{}
		if err := rows.Scan(
			&item.ID, &item.BoardType, &item.CategoryID, &item.CategoryName,
			&item.Title, &item.Content, &item.IsAnonymous,
			&item.AuthorNickname,
			&item.HospitalID, &item.HospitalName,
			&item.LikeCount, &item.CommentCount, &item.CreatedAt,
		); err != nil {
			return nil, 0, err
		}
		item.ImageURLs = []string{}
		items = append(items, item)
	}
	if err := rows.Err(); err != nil {
		return nil, 0, err
	}

	if len(items) == 0 {
		return []*model.PostListItem{}, total, nil
	}

	// Batch-fetch first image per post to avoid N+1.
	postIDs := make([]interface{}, len(items))
	idxMap := make(map[int64]int, len(items))
	for i, item := range items {
		postIDs[i] = item.ID
		idxMap[item.ID] = i
	}

	placeholders := make([]string, len(postIDs))
	for i := range postIDs {
		placeholders[i] = fmt.Sprintf("$%d", i+1)
	}

	imgQ := fmt.Sprintf(`
		SELECT DISTINCT ON (entity_id) entity_id, COALESCE(thumb_path, original_path) AS url
		FROM images
		WHERE entity_type = 'community' AND entity_id IN (%s)
		ORDER BY entity_id, created_at ASC`, strings.Join(placeholders, ","))

	imgRows, err := r.db.Query(imgQ, postIDs...)
	if err != nil {
		return nil, 0, fmt.Errorf("batch images: %w", err)
	}
	defer imgRows.Close()

	for imgRows.Next() {
		var entityID int64
		var url string
		if err := imgRows.Scan(&entityID, &url); err != nil {
			return nil, 0, err
		}
		if i, ok := idxMap[entityID]; ok {
			items[i].ImageURLs = []string{url}
		}
	}
	if err := imgRows.Err(); err != nil {
		return nil, 0, err
	}

	return items, total, nil
}

func (r *postRepository) Delete(id int64) error {
	const q = `UPDATE posts SET status = 'deleted', updated_at = $1 WHERE id = $2 AND status != 'deleted'`
	result, err := r.db.Exec(q, time.Now(), id)
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

// ──────────────────────────────────────────────
// Comments
// ──────────────────────────────────────────────

func (r *postRepository) CreateComment(comment *model.Comment) (*model.Comment, error) {
	tx, err := r.db.Begin()
	if err != nil {
		return nil, fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback() //nolint:errcheck

	const q = `
		INSERT INTO comments (post_id, user_id, parent_id, content, is_anonymous, status)
		VALUES ($1, $2, $3, $4, $5, 'active')
		RETURNING id, post_id, user_id, parent_id, content, is_anonymous, status, created_at`

	c := &model.Comment{}
	err = tx.QueryRow(q,
		comment.PostID,
		comment.UserID,
		comment.ParentID,
		comment.Content,
		comment.IsAnonymous,
	).Scan(
		&c.ID, &c.PostID, &c.UserID, &c.ParentID,
		&c.Content, &c.IsAnonymous, &c.Status, &c.CreatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("insert comment: %w", err)
	}

	// Increment post comment_count.
	const uq = `UPDATE posts SET comment_count = comment_count + 1, updated_at = $1 WHERE id = $2`
	if _, err := tx.Exec(uq, time.Now(), comment.PostID); err != nil {
		return nil, fmt.Errorf("increment comment_count: %w", err)
	}

	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("commit tx: %w", err)
	}

	// Populate author nickname.
	c.AuthorNickname = "익명"
	if !c.IsAnonymous {
		const nq = `SELECT COALESCE(nickname, '알 수 없음') FROM users WHERE id = $1`
		_ = r.db.QueryRow(nq, c.UserID).Scan(&c.AuthorNickname)
	}
	c.Replies = []*model.Comment{}

	return c, nil
}

func (r *postRepository) GetComments(postID int64) ([]*model.Comment, error) {
	const q = `
		SELECT
			c.id, c.post_id, c.user_id, c.parent_id, c.content, c.is_anonymous, c.status,
			CASE WHEN c.is_anonymous THEN '익명' ELSE COALESCE(u.nickname, '알 수 없음') END AS author_nickname,
			c.created_at
		FROM comments c
		LEFT JOIN users u ON u.id = c.user_id
		WHERE c.post_id = $1 AND c.status = 'active'
		ORDER BY c.created_at ASC`

	rows, err := r.db.Query(q, postID)
	if err != nil {
		return nil, fmt.Errorf("get comments: %w", err)
	}
	defer rows.Close()

	commentMap := make(map[int64]*model.Comment)
	var roots []*model.Comment

	for rows.Next() {
		c := &model.Comment{Replies: []*model.Comment{}}
		if err := rows.Scan(
			&c.ID, &c.PostID, &c.UserID, &c.ParentID,
			&c.Content, &c.IsAnonymous, &c.Status,
			&c.AuthorNickname, &c.CreatedAt,
		); err != nil {
			return nil, err
		}
		commentMap[c.ID] = c
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	// Build tree.
	for _, c := range commentMap {
		if c.ParentID == nil {
			roots = append(roots, c)
		} else {
			parent, ok := commentMap[*c.ParentID]
			if ok {
				parent.Replies = append(parent.Replies, c)
			} else {
				roots = append(roots, c)
			}
		}
	}

	if roots == nil {
		roots = []*model.Comment{}
	}
	return roots, nil
}

// ──────────────────────────────────────────────
// Likes
// ──────────────────────────────────────────────

func (r *postRepository) ToggleLike(userID, postID int64) (bool, int, error) {
	tx, err := r.db.Begin()
	if err != nil {
		return false, 0, fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback() //nolint:errcheck

	// Check existing like.
	var exists bool
	const checkQ = `SELECT EXISTS(SELECT 1 FROM likes WHERE user_id = $1 AND post_id = $2)`
	if err := tx.QueryRow(checkQ, userID, postID).Scan(&exists); err != nil {
		return false, 0, fmt.Errorf("check like: %w", err)
	}

	var liked bool
	if exists {
		// Remove like.
		if _, err := tx.Exec(`DELETE FROM likes WHERE user_id = $1 AND post_id = $2`, userID, postID); err != nil {
			return false, 0, fmt.Errorf("delete like: %w", err)
		}
		if _, err := tx.Exec(`UPDATE posts SET like_count = GREATEST(like_count - 1, 0), updated_at = $1 WHERE id = $2`, time.Now(), postID); err != nil {
			return false, 0, fmt.Errorf("decrement like_count: %w", err)
		}
		liked = false
	} else {
		// Add like.
		if _, err := tx.Exec(`INSERT INTO likes (user_id, post_id) VALUES ($1, $2)`, userID, postID); err != nil {
			return false, 0, fmt.Errorf("insert like: %w", err)
		}
		if _, err := tx.Exec(`UPDATE posts SET like_count = like_count + 1, updated_at = $1 WHERE id = $2`, time.Now(), postID); err != nil {
			return false, 0, fmt.Errorf("increment like_count: %w", err)
		}
		liked = true
	}

	if err := tx.Commit(); err != nil {
		return false, 0, fmt.Errorf("commit tx: %w", err)
	}

	// Fetch updated count.
	var count int
	if err := r.db.QueryRow(`SELECT like_count FROM posts WHERE id = $1`, postID).Scan(&count); err != nil {
		return liked, 0, fmt.Errorf("fetch like_count: %w", err)
	}

	return liked, count, nil
}

// ──────────────────────────────────────────────
// Reports
// ──────────────────────────────────────────────

func (r *postRepository) CreateReport(report *model.Report) (*model.Report, error) {
	const q = `
		INSERT INTO reports (reporter_id, target_type, target_id, reason, description, status)
		VALUES ($1, $2, $3, $4, $5, 'pending')
		RETURNING id, reporter_id, target_type, target_id, reason, description, status, resolved_at, created_at`

	rep := &model.Report{}
	err := r.db.QueryRow(q,
		report.ReporterID,
		report.TargetType,
		report.TargetID,
		report.Reason,
		report.Description,
	).Scan(
		&rep.ID, &rep.ReporterID, &rep.TargetType, &rep.TargetID,
		&rep.Reason, &rep.Description, &rep.Status,
		&rep.ResolvedAt, &rep.CreatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("insert report: %w", err)
	}
	return rep, nil
}
