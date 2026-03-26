package repository

import (
	"database/sql"
	"fmt"

	"github.com/letmein/server/internal/model"
)

// PollRepository defines persistence operations for polls.
type PollRepository interface {
	Create(poll *model.Poll, options []model.PollOption) (*model.Poll, error)
	GetByID(id int64, currentUserID int64) (*model.PollDetail, error)
	List(page, limit int) ([]*model.PollListItem, int, error)
	Vote(pollID, optionID, userID int64) error
	HasVoted(pollID, userID int64) (bool, *int64, error)
	Close(pollID int64) error
	GetAuthorID(pollID int64) (int64, error)
}

type pollRepository struct {
	db *sql.DB
}

// NewPollRepository creates a new PollRepository backed by db.
func NewPollRepository(db *sql.DB) PollRepository {
	return &pollRepository{db: db}
}

// ──────────────────────────────────────────────
// Create
// ──────────────────────────────────────────────

func (r *pollRepository) Create(poll *model.Poll, options []model.PollOption) (*model.Poll, error) {
	tx, err := r.db.Begin()
	if err != nil {
		return nil, fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback() //nolint:errcheck

	const pollQ = `
		INSERT INTO polls (user_id, title, description, poll_type, status, ends_at)
		VALUES ($1, $2, $3, $4, 'active', $5)
		RETURNING id, user_id, title, description, poll_type, status, ends_at, vote_count, created_at`

	p := &model.Poll{}
	err = tx.QueryRow(pollQ,
		poll.UserID,
		poll.Title,
		poll.Description,
		poll.PollType,
		poll.EndsAt,
	).Scan(
		&p.ID, &p.UserID, &p.Title, &p.Description,
		&p.PollType, &p.Status, &p.EndsAt, &p.VoteCount, &p.CreatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("insert poll: %w", err)
	}

	const optQ = `
		INSERT INTO poll_options (poll_id, text, image_url, sort_order)
		VALUES ($1, $2, $3, $4)`

	for i, opt := range options {
		imageURL := ""
		if opt.ImageURL != "" {
			imageURL = opt.ImageURL
		}
		if _, err := tx.Exec(optQ, p.ID, opt.Text, imageURL, i); err != nil {
			return nil, fmt.Errorf("insert poll option %d: %w", i, err)
		}
	}

	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("commit tx: %w", err)
	}
	return p, nil
}

// ──────────────────────────────────────────────
// GetByID
// ──────────────────────────────────────────────

func (r *pollRepository) GetByID(id int64, currentUserID int64) (*model.PollDetail, error) {
	const pollQ = `
		SELECT
			p.id, p.user_id,
			COALESCE(u.nickname, '알 수 없음') AS author_nickname,
			p.title, COALESCE(p.description, ''),
			p.poll_type, p.status, p.ends_at, p.vote_count, p.created_at
		FROM polls p
		LEFT JOIN users u ON u.id = p.user_id
		WHERE p.id = $1`

	pd := &model.PollDetail{}
	err := r.db.QueryRow(pollQ, id).Scan(
		&pd.ID, &pd.UserID, &pd.AuthorNickname,
		&pd.Title, &pd.Description,
		&pd.PollType, &pd.Status, &pd.EndsAt, &pd.VoteCount, &pd.CreatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get poll: %w", err)
	}

	// Fetch options.
	opts, err := r.getOptions(id)
	if err != nil {
		return nil, err
	}
	pd.Options = opts

	// Check if current user has voted.
	hasVoted, votedOptionID, err := r.HasVoted(id, currentUserID)
	if err != nil {
		return nil, err
	}
	pd.HasVoted = hasVoted
	pd.VotedOptionID = votedOptionID

	return pd, nil
}

func (r *pollRepository) getOptions(pollID int64) ([]model.PollOption, error) {
	const q = `
		SELECT id, poll_id, text, COALESCE(image_url, ''), vote_count, sort_order
		FROM poll_options
		WHERE poll_id = $1
		ORDER BY sort_order ASC, id ASC`

	rows, err := r.db.Query(q, pollID)
	if err != nil {
		return nil, fmt.Errorf("get poll options: %w", err)
	}
	defer rows.Close()

	var opts []model.PollOption
	for rows.Next() {
		var opt model.PollOption
		if err := rows.Scan(
			&opt.ID, &opt.PollID, &opt.Text, &opt.ImageURL,
			&opt.VoteCount, &opt.SortOrder,
		); err != nil {
			return nil, err
		}
		opts = append(opts, opt)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	if opts == nil {
		opts = []model.PollOption{}
	}
	return opts, nil
}

// ──────────────────────────────────────────────
// List
// ──────────────────────────────────────────────

func (r *pollRepository) List(page, limit int) ([]*model.PollListItem, int, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	var total int
	if err := r.db.QueryRow(`SELECT COUNT(*) FROM polls`).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("count polls: %w", err)
	}

	offset := (page - 1) * limit
	const dataQ = `
		SELECT
			p.id, p.user_id,
			COALESCE(u.nickname, '알 수 없음') AS author_nickname,
			p.title, p.poll_type, p.status, p.ends_at, p.vote_count, p.created_at
		FROM polls p
		LEFT JOIN users u ON u.id = p.user_id
		ORDER BY p.created_at DESC
		LIMIT $1 OFFSET $2`

	rows, err := r.db.Query(dataQ, limit, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("list polls: %w", err)
	}
	defer rows.Close()

	var items []*model.PollListItem
	for rows.Next() {
		item := &model.PollListItem{}
		if err := rows.Scan(
			&item.ID, &item.UserID, &item.AuthorNickname,
			&item.Title, &item.PollType, &item.Status, &item.EndsAt,
			&item.VoteCount, &item.CreatedAt,
		); err != nil {
			return nil, 0, err
		}
		item.TopOptions = []model.PollOption{}
		items = append(items, item)
	}
	if err := rows.Err(); err != nil {
		return nil, 0, err
	}

	if len(items) == 0 {
		return []*model.PollListItem{}, total, nil
	}

	// Batch-fetch top 2 options per poll to avoid N+1.
	pollIDs := make([]interface{}, len(items))
	idxMap := make(map[int64]int, len(items))
	for i, item := range items {
		pollIDs[i] = item.ID
		idxMap[item.ID] = i
	}

	placeholders := ""
	for i := range pollIDs {
		if i > 0 {
			placeholders += ","
		}
		placeholders += fmt.Sprintf("$%d", i+1)
	}

	optQ := fmt.Sprintf(`
		SELECT DISTINCT ON (poll_id) poll_id, id, text, COALESCE(image_url, ''), vote_count, sort_order
		FROM poll_options
		WHERE poll_id IN (%s)
		ORDER BY poll_id, sort_order ASC, id ASC`, placeholders)

	optRows, err := r.db.Query(optQ, pollIDs...)
	if err != nil {
		return nil, 0, fmt.Errorf("batch options: %w", err)
	}
	defer optRows.Close()

	// Collect first option per poll, then second pass for second option.
	firstOpts := make(map[int64]model.PollOption)
	for optRows.Next() {
		var pollID int64
		var opt model.PollOption
		if err := optRows.Scan(
			&pollID, &opt.ID, &opt.Text, &opt.ImageURL, &opt.VoteCount, &opt.SortOrder,
		); err != nil {
			return nil, 0, err
		}
		opt.PollID = pollID
		firstOpts[pollID] = opt
	}
	if err := optRows.Err(); err != nil {
		return nil, 0, err
	}

	// Now fetch top 2 options per poll in a second query.
	top2Q := fmt.Sprintf(`
		SELECT poll_id, id, text, COALESCE(image_url, ''), vote_count, sort_order
		FROM (
			SELECT poll_id, id, text, image_url, vote_count, sort_order,
			       ROW_NUMBER() OVER (PARTITION BY poll_id ORDER BY sort_order ASC, id ASC) AS rn
			FROM poll_options
			WHERE poll_id IN (%s)
		) ranked
		WHERE rn <= 2
		ORDER BY poll_id, sort_order ASC, id ASC`, placeholders)

	top2Rows, err := r.db.Query(top2Q, pollIDs...)
	if err != nil {
		return nil, 0, fmt.Errorf("batch top2 options: %w", err)
	}
	defer top2Rows.Close()

	for top2Rows.Next() {
		var pollID int64
		var opt model.PollOption
		if err := top2Rows.Scan(
			&pollID, &opt.ID, &opt.Text, &opt.ImageURL, &opt.VoteCount, &opt.SortOrder,
		); err != nil {
			return nil, 0, err
		}
		opt.PollID = pollID
		if i, ok := idxMap[pollID]; ok {
			items[i].TopOptions = append(items[i].TopOptions, opt)
		}
	}
	if err := top2Rows.Err(); err != nil {
		return nil, 0, err
	}

	return items, total, nil
}

// ──────────────────────────────────────────────
// Vote
// ──────────────────────────────────────────────

func (r *pollRepository) Vote(pollID, optionID, userID int64) error {
	tx, err := r.db.Begin()
	if err != nil {
		return fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback() //nolint:errcheck

	// Verify option belongs to poll.
	var exists bool
	if err := tx.QueryRow(
		`SELECT EXISTS(SELECT 1 FROM poll_options WHERE id = $1 AND poll_id = $2)`,
		optionID, pollID,
	).Scan(&exists); err != nil {
		return fmt.Errorf("verify option: %w", err)
	}
	if !exists {
		return ErrNotFound
	}

	// Insert vote.
	const voteQ = `
		INSERT INTO poll_votes (poll_id, option_id, user_id)
		VALUES ($1, $2, $3)
		ON CONFLICT (poll_id, user_id) DO NOTHING`
	result, err := tx.Exec(voteQ, pollID, optionID, userID)
	if err != nil {
		return fmt.Errorf("insert vote: %w", err)
	}
	affected, _ := result.RowsAffected()
	if affected == 0 {
		// Already voted — treat as no-op (conflict).
		return ErrAlreadyVoted
	}

	// Increment option vote_count.
	if _, err := tx.Exec(
		`UPDATE poll_options SET vote_count = vote_count + 1 WHERE id = $1`,
		optionID,
	); err != nil {
		return fmt.Errorf("increment option vote_count: %w", err)
	}

	// Increment poll vote_count.
	if _, err := tx.Exec(
		`UPDATE polls SET vote_count = vote_count + 1 WHERE id = $1`,
		pollID,
	); err != nil {
		return fmt.Errorf("increment poll vote_count: %w", err)
	}

	return tx.Commit()
}

// ──────────────────────────────────────────────
// HasVoted
// ──────────────────────────────────────────────

func (r *pollRepository) HasVoted(pollID, userID int64) (bool, *int64, error) {
	if userID == 0 {
		return false, nil, nil
	}
	var optionID int64
	err := r.db.QueryRow(
		`SELECT option_id FROM poll_votes WHERE poll_id = $1 AND user_id = $2`,
		pollID, userID,
	).Scan(&optionID)
	if err == sql.ErrNoRows {
		return false, nil, nil
	}
	if err != nil {
		return false, nil, fmt.Errorf("has voted: %w", err)
	}
	return true, &optionID, nil
}

// ──────────────────────────────────────────────
// Close
// ──────────────────────────────────────────────

func (r *pollRepository) Close(pollID int64) error {
	result, err := r.db.Exec(
		`UPDATE polls SET status = 'closed' WHERE id = $1 AND status = 'active'`,
		pollID,
	)
	if err != nil {
		return fmt.Errorf("close poll: %w", err)
	}
	n, _ := result.RowsAffected()
	if n == 0 {
		return ErrNotFound
	}
	return nil
}

// ──────────────────────────────────────────────
// GetAuthorID
// ──────────────────────────────────────────────

func (r *pollRepository) GetAuthorID(pollID int64) (int64, error) {
	var userID int64
	err := r.db.QueryRow(`SELECT user_id FROM polls WHERE id = $1`, pollID).Scan(&userID)
	if err == sql.ErrNoRows {
		return 0, ErrNotFound
	}
	if err != nil {
		return 0, fmt.Errorf("get author: %w", err)
	}
	return userID, nil
}
