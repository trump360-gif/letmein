package repository

import (
	"database/sql"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/letmein/server/internal/model"
)

// ──────────────────────────────────────────────
// CastMemberRepository
// ──────────────────────────────────────────────

// CastMemberRepository defines persistence operations for cast members.
type CastMemberRepository interface {
	CreateCastMember(userID int64, req model.CastVerificationRequest) (int64, error)
	GetByID(id int64) (*model.CastMember, error)
	GetByUserID(userID int64) (*model.CastMember, error)
	UpdateVerification(id int64, status string, verifiedBy int64, reason string) error
	ListApproved(limit, offset int) ([]model.CastMemberListItem, int, error)
	ListPending(limit, offset int) ([]model.CastMember, int, error)
}

type castMemberRepository struct {
	db *sql.DB
}

func NewCastMemberRepository(db *sql.DB) CastMemberRepository {
	return &castMemberRepository{db: db}
}

func (r *castMemberRepository) CreateCastMember(userID int64, req model.CastVerificationRequest) (int64, error) {
	const q = `
		INSERT INTO cast_members (user_id, display_name, bio, youtube_channel_url, verification_status, badge_type)
		VALUES ($1, $2, $3, $4, 'pending', 'verified')
		RETURNING id`

	var id int64
	err := r.db.QueryRow(q, userID, req.DisplayName, req.Bio, req.YoutubeChannelURL).Scan(&id)
	if err != nil {
		return 0, fmt.Errorf("insert cast_member: %w", err)
	}
	return id, nil
}

func (r *castMemberRepository) GetByID(id int64) (*model.CastMember, error) {
	const q = `
		SELECT id, user_id, display_name, bio, profile_image, badge_type, verification_status,
		       verified_at, verified_by, rejection_reason, youtube_channel_url,
		       follower_count, story_count, created_at, updated_at
		FROM cast_members
		WHERE id = $1`

	m := &model.CastMember{}
	err := r.db.QueryRow(q, id).Scan(
		&m.ID, &m.UserID, &m.DisplayName, &m.Bio, &m.ProfileImage,
		&m.BadgeType, &m.VerificationStatus,
		&m.VerifiedAt, &m.VerifiedBy, &m.RejectionReason, &m.YoutubeChannelURL,
		&m.FollowerCount, &m.StoryCount, &m.CreatedAt, &m.UpdatedAt,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get cast_member by id: %w", err)
	}
	return m, nil
}

func (r *castMemberRepository) GetByUserID(userID int64) (*model.CastMember, error) {
	const q = `
		SELECT id, user_id, display_name, bio, profile_image, badge_type, verification_status,
		       verified_at, verified_by, rejection_reason, youtube_channel_url,
		       follower_count, story_count, created_at, updated_at
		FROM cast_members
		WHERE user_id = $1`

	m := &model.CastMember{}
	err := r.db.QueryRow(q, userID).Scan(
		&m.ID, &m.UserID, &m.DisplayName, &m.Bio, &m.ProfileImage,
		&m.BadgeType, &m.VerificationStatus,
		&m.VerifiedAt, &m.VerifiedBy, &m.RejectionReason, &m.YoutubeChannelURL,
		&m.FollowerCount, &m.StoryCount, &m.CreatedAt, &m.UpdatedAt,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get cast_member by user_id: %w", err)
	}
	return m, nil
}

func (r *castMemberRepository) UpdateVerification(id int64, status string, verifiedBy int64, reason string) error {
	var q string
	var args []interface{}

	if status == "approved" {
		q = `UPDATE cast_members
		     SET verification_status = $1, verified_by = $2, verified_at = $3, rejection_reason = NULL, updated_at = $3
		     WHERE id = $4`
		args = []interface{}{status, verifiedBy, time.Now(), id}
	} else {
		q = `UPDATE cast_members
		     SET verification_status = $1, verified_by = $2, rejection_reason = $3, updated_at = $4
		     WHERE id = $5`
		args = []interface{}{status, verifiedBy, reason, time.Now(), id}
	}

	result, err := r.db.Exec(q, args...)
	if err != nil {
		return fmt.Errorf("update verification: %w", err)
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

func (r *castMemberRepository) ListApproved(limit, offset int) ([]model.CastMemberListItem, int, error) {
	if limit < 1 || limit > 100 {
		limit = 20
	}

	var total int
	const countQ = `SELECT COUNT(*) FROM cast_members WHERE verification_status = 'approved'`
	if err := r.db.QueryRow(countQ).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("count approved cast_members: %w", err)
	}

	const q = `
		SELECT id, display_name, profile_image, badge_type, youtube_channel_url, follower_count, story_count
		FROM cast_members
		WHERE verification_status = 'approved'
		ORDER BY follower_count DESC, created_at DESC
		LIMIT $1 OFFSET $2`

	rows, err := r.db.Query(q, limit, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("list approved cast_members: %w", err)
	}
	defer rows.Close()

	var items []model.CastMemberListItem
	for rows.Next() {
		item := model.CastMemberListItem{}
		if err := rows.Scan(
			&item.ID, &item.DisplayName, &item.ProfileImage,
			&item.BadgeType, &item.YoutubeChannelURL,
			&item.FollowerCount, &item.StoryCount,
		); err != nil {
			return nil, 0, err
		}
		items = append(items, item)
	}
	if err := rows.Err(); err != nil {
		return nil, 0, err
	}
	if items == nil {
		items = []model.CastMemberListItem{}
	}
	return items, total, nil
}

func (r *castMemberRepository) ListPending(limit, offset int) ([]model.CastMember, int, error) {
	if limit < 1 || limit > 100 {
		limit = 20
	}

	var total int
	const countQ = `SELECT COUNT(*) FROM cast_members WHERE verification_status = 'pending'`
	if err := r.db.QueryRow(countQ).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("count pending cast_members: %w", err)
	}

	const q = `
		SELECT id, user_id, display_name, bio, profile_image, badge_type, verification_status,
		       verified_at, verified_by, rejection_reason, youtube_channel_url,
		       follower_count, story_count, created_at, updated_at
		FROM cast_members
		WHERE verification_status = 'pending'
		ORDER BY created_at ASC
		LIMIT $1 OFFSET $2`

	rows, err := r.db.Query(q, limit, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("list pending cast_members: %w", err)
	}
	defer rows.Close()

	var items []model.CastMember
	for rows.Next() {
		m := model.CastMember{}
		if err := rows.Scan(
			&m.ID, &m.UserID, &m.DisplayName, &m.Bio, &m.ProfileImage,
			&m.BadgeType, &m.VerificationStatus,
			&m.VerifiedAt, &m.VerifiedBy, &m.RejectionReason, &m.YoutubeChannelURL,
			&m.FollowerCount, &m.StoryCount, &m.CreatedAt, &m.UpdatedAt,
		); err != nil {
			return nil, 0, err
		}
		items = append(items, m)
	}
	if err := rows.Err(); err != nil {
		return nil, 0, err
	}
	if items == nil {
		items = []model.CastMember{}
	}
	return items, total, nil
}

// ──────────────────────────────────────────────
// CastStoryRepository
// ──────────────────────────────────────────────

// CastStoryRepository defines persistence operations for cast stories.
type CastStoryRepository interface {
	CreateStory(castMemberID int64, req model.CastStoryCreateRequest) (int64, error)
	GetStoryByID(id int64) (*model.CastStory, error)
	ListStories(castMemberID int64, limit, offset int) ([]model.CastStoryListItem, int, error)
	ListFeedStories(limit, offset int) ([]model.CastStoryListItem, int, error)
}

type castStoryRepository struct {
	db *sql.DB
}

func NewCastStoryRepository(db *sql.DB) CastStoryRepository {
	return &castStoryRepository{db: db}
}

func (r *castStoryRepository) CreateStory(castMemberID int64, req model.CastStoryCreateRequest) (int64, error) {
	tx, err := r.db.Begin()
	if err != nil {
		return 0, fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback() //nolint:errcheck

	storyType := req.StoryType
	if storyType == "" {
		storyType = "general"
	}

	const q = `
		INSERT INTO cast_stories (cast_member_id, episode_id, content, story_type, status)
		VALUES ($1, $2, $3, $4, 'active')
		RETURNING id`

	var id int64
	err = tx.QueryRow(q, castMemberID, req.EpisodeID, req.Content, storyType).Scan(&id)
	if err != nil {
		return 0, fmt.Errorf("insert cast_story: %w", err)
	}

	// Associate images with story.
	if len(req.ImageIDs) > 0 {
		for i, imgID := range req.ImageIDs {
			const imgQ = `INSERT INTO cast_story_images (story_id, image_id, sort_order) VALUES ($1, $2, $3)`
			if _, err := tx.Exec(imgQ, id, imgID, i); err != nil {
				return 0, fmt.Errorf("link image %d: %w", imgID, err)
			}
		}
	}

	// Increment story_count on cast_member.
	const uq = `UPDATE cast_members SET story_count = story_count + 1, updated_at = $1 WHERE id = $2`
	if _, err := tx.Exec(uq, time.Now(), castMemberID); err != nil {
		return 0, fmt.Errorf("increment story_count: %w", err)
	}

	if err := tx.Commit(); err != nil {
		return 0, fmt.Errorf("commit tx: %w", err)
	}
	return id, nil
}

func (r *castStoryRepository) GetStoryByID(id int64) (*model.CastStory, error) {
	const q = `
		SELECT id, cast_member_id, episode_id, content, story_type, status, like_count, comment_count, created_at, updated_at
		FROM cast_stories
		WHERE id = $1 AND status = 'active'`

	s := &model.CastStory{}
	err := r.db.QueryRow(q, id).Scan(
		&s.ID, &s.CastMemberID, &s.EpisodeID, &s.Content,
		&s.StoryType, &s.Status, &s.LikeCount, &s.CommentCount,
		&s.CreatedAt, &s.UpdatedAt,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get cast_story: %w", err)
	}

	imageURLs, err := r.getStoryImageURLs(id)
	if err != nil {
		return nil, err
	}
	s.ImageURLs = imageURLs
	return s, nil
}

func (r *castStoryRepository) getStoryImageURLs(storyID int64) ([]string, error) {
	const q = `
		SELECT COALESCE(i.medium_path, i.original_path) AS url
		FROM cast_story_images csi
		JOIN images i ON i.id = csi.image_id
		WHERE csi.story_id = $1
		ORDER BY csi.sort_order ASC`

	rows, err := r.db.Query(q, storyID)
	if err != nil {
		return nil, fmt.Errorf("get story images: %w", err)
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

func (r *castStoryRepository) ListStories(castMemberID int64, limit, offset int) ([]model.CastStoryListItem, int, error) {
	if limit < 1 || limit > 100 {
		limit = 20
	}

	var total int
	const countQ = `SELECT COUNT(*) FROM cast_stories WHERE cast_member_id = $1 AND status = 'active'`
	if err := r.db.QueryRow(countQ, castMemberID).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("count cast_stories: %w", err)
	}

	const q = `
		SELECT cs.id, cs.cast_member_id, cm.display_name, cm.profile_image,
		       cs.episode_id, cs.content, cs.story_type, cs.like_count, cs.comment_count, cs.created_at
		FROM cast_stories cs
		JOIN cast_members cm ON cm.id = cs.cast_member_id
		WHERE cs.cast_member_id = $1 AND cs.status = 'active'
		ORDER BY cs.created_at DESC
		LIMIT $2 OFFSET $3`

	return r.scanStoryListItems(q, total, castMemberID, limit, offset)
}

func (r *castStoryRepository) ListFeedStories(limit, offset int) ([]model.CastStoryListItem, int, error) {
	if limit < 1 || limit > 100 {
		limit = 20
	}

	var total int
	const countQ = `
		SELECT COUNT(*)
		FROM cast_stories cs
		JOIN cast_members cm ON cm.id = cs.cast_member_id
		WHERE cs.status = 'active' AND cm.verification_status = 'approved'`
	if err := r.db.QueryRow(countQ).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("count feed stories: %w", err)
	}

	const q = `
		SELECT cs.id, cs.cast_member_id, cm.display_name, cm.profile_image,
		       cs.episode_id, cs.content, cs.story_type, cs.like_count, cs.comment_count, cs.created_at
		FROM cast_stories cs
		JOIN cast_members cm ON cm.id = cs.cast_member_id
		WHERE cs.status = 'active' AND cm.verification_status = 'approved'
		ORDER BY cs.created_at DESC
		LIMIT $1 OFFSET $2`

	return r.scanStoryListItems(q, total, limit, offset)
}

// scanStoryListItems executes query with args, scans into CastStoryListItem slice,
// and batch-fetches the first image per story to avoid N+1.
func (r *castStoryRepository) scanStoryListItems(q string, total int, args ...interface{}) ([]model.CastStoryListItem, int, error) {
	rows, err := r.db.Query(q, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("list cast_stories: %w", err)
	}
	defer rows.Close()

	var items []model.CastStoryListItem
	for rows.Next() {
		item := model.CastStoryListItem{}
		if err := rows.Scan(
			&item.ID, &item.CastMemberID, &item.CastDisplayName, &item.CastProfileImage,
			&item.EpisodeID, &item.Content, &item.StoryType,
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
		return []model.CastStoryListItem{}, total, nil
	}

	// Batch-fetch first image per story to avoid N+1.
	storyIDs := make([]interface{}, len(items))
	idxMap := make(map[int64]int, len(items))
	for i, item := range items {
		storyIDs[i] = item.ID
		idxMap[item.ID] = i
	}

	placeholders := make([]string, len(storyIDs))
	for i := range storyIDs {
		placeholders[i] = fmt.Sprintf("$%d", i+1)
	}

	imgQ := fmt.Sprintf(`
		SELECT DISTINCT ON (csi.story_id) csi.story_id, COALESCE(i.medium_path, i.original_path) AS url
		FROM cast_story_images csi
		JOIN images i ON i.id = csi.image_id
		WHERE csi.story_id IN (%s)
		ORDER BY csi.story_id, csi.sort_order ASC`, strings.Join(placeholders, ","))

	imgRows, err := r.db.Query(imgQ, storyIDs...)
	if err != nil {
		return nil, 0, fmt.Errorf("batch story images: %w", err)
	}
	defer imgRows.Close()

	for imgRows.Next() {
		var storyID int64
		var url string
		if err := imgRows.Scan(&storyID, &url); err != nil {
			return nil, 0, err
		}
		if i, ok := idxMap[storyID]; ok {
			items[i].ImageURLs = []string{url}
		}
	}
	if err := imgRows.Err(); err != nil {
		return nil, 0, err
	}

	return items, total, nil
}

// ──────────────────────────────────────────────
// CastFollowRepository
// ──────────────────────────────────────────────

// CastFollowRepository defines persistence operations for cast member follows.
type CastFollowRepository interface {
	Follow(userID, castMemberID int64) error
	Unfollow(userID, castMemberID int64) error
	IsFollowing(userID, castMemberID int64) (bool, error)
	GetFollowersCount(castMemberID int64) (int, error)
	GetFollowingList(userID int64) ([]model.CastMemberListItem, error)
}

type castFollowRepository struct {
	db *sql.DB
}

func NewCastFollowRepository(db *sql.DB) CastFollowRepository {
	return &castFollowRepository{db: db}
}

func (r *castFollowRepository) Follow(userID, castMemberID int64) error {
	tx, err := r.db.Begin()
	if err != nil {
		return fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback() //nolint:errcheck

	const q = `INSERT INTO cast_follows (user_id, cast_member_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`
	result, err := tx.Exec(q, userID, castMemberID)
	if err != nil {
		return fmt.Errorf("insert follow: %w", err)
	}
	n, _ := result.RowsAffected()
	if n > 0 {
		const uq = `UPDATE cast_members SET follower_count = follower_count + 1, updated_at = $1 WHERE id = $2`
		if _, err := tx.Exec(uq, time.Now(), castMemberID); err != nil {
			return fmt.Errorf("increment follower_count: %w", err)
		}
	}

	return tx.Commit()
}

func (r *castFollowRepository) Unfollow(userID, castMemberID int64) error {
	tx, err := r.db.Begin()
	if err != nil {
		return fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback() //nolint:errcheck

	const q = `DELETE FROM cast_follows WHERE user_id = $1 AND cast_member_id = $2`
	result, err := tx.Exec(q, userID, castMemberID)
	if err != nil {
		return fmt.Errorf("delete follow: %w", err)
	}
	n, _ := result.RowsAffected()
	if n > 0 {
		const uq = `UPDATE cast_members SET follower_count = GREATEST(follower_count - 1, 0), updated_at = $1 WHERE id = $2`
		if _, err := tx.Exec(uq, time.Now(), castMemberID); err != nil {
			return fmt.Errorf("decrement follower_count: %w", err)
		}
	}

	return tx.Commit()
}

func (r *castFollowRepository) IsFollowing(userID, castMemberID int64) (bool, error) {
	const q = `SELECT EXISTS(SELECT 1 FROM cast_follows WHERE user_id = $1 AND cast_member_id = $2)`
	var exists bool
	if err := r.db.QueryRow(q, userID, castMemberID).Scan(&exists); err != nil {
		return false, fmt.Errorf("check follow: %w", err)
	}
	return exists, nil
}

func (r *castFollowRepository) GetFollowersCount(castMemberID int64) (int, error) {
	const q = `SELECT follower_count FROM cast_members WHERE id = $1`
	var count int
	err := r.db.QueryRow(q, castMemberID).Scan(&count)
	if errors.Is(err, sql.ErrNoRows) {
		return 0, ErrNotFound
	}
	if err != nil {
		return 0, fmt.Errorf("get follower_count: %w", err)
	}
	return count, nil
}

func (r *castFollowRepository) GetFollowingList(userID int64) ([]model.CastMemberListItem, error) {
	const q = `
		SELECT cm.id, cm.display_name, cm.profile_image, cm.badge_type,
		       cm.youtube_channel_url, cm.follower_count, cm.story_count
		FROM cast_follows cf
		JOIN cast_members cm ON cm.id = cf.cast_member_id
		WHERE cf.user_id = $1 AND cm.verification_status = 'approved'
		ORDER BY cf.created_at DESC`

	rows, err := r.db.Query(q, userID)
	if err != nil {
		return nil, fmt.Errorf("get following list: %w", err)
	}
	defer rows.Close()

	var items []model.CastMemberListItem
	for rows.Next() {
		item := model.CastMemberListItem{}
		if err := rows.Scan(
			&item.ID, &item.DisplayName, &item.ProfileImage,
			&item.BadgeType, &item.YoutubeChannelURL,
			&item.FollowerCount, &item.StoryCount,
		); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	if items == nil {
		items = []model.CastMemberListItem{}
	}
	return items, nil
}

// ──────────────────────────────────────────────
// YouTubeEpisodeRepository
// ──────────────────────────────────────────────

// YouTubeEpisodeRepository defines persistence operations for YouTube episodes.
type YouTubeEpisodeRepository interface {
	Create(episode model.YouTubeEpisodeCreateRequest) (int64, error)
	GetByID(id int64) (*model.YouTubeEpisode, error)
	ListHero() ([]model.YouTubeEpisode, error)
	ListAll(limit, offset int) ([]model.YouTubeEpisode, int, error)
	LinkCastMember(episodeID, castMemberID int64) error
}

type youtubeEpisodeRepository struct {
	db *sql.DB
}

func NewYouTubeEpisodeRepository(db *sql.DB) YouTubeEpisodeRepository {
	return &youtubeEpisodeRepository{db: db}
}

func (r *youtubeEpisodeRepository) Create(req model.YouTubeEpisodeCreateRequest) (int64, error) {
	const q = `
		INSERT INTO youtube_episodes (youtube_url, youtube_video_id, title, thumbnail_url, air_date, is_hero, sort_order)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id`

	var id int64
	err := r.db.QueryRow(q,
		req.YoutubeURL, req.YoutubeVideoID, req.Title,
		req.ThumbnailURL, req.AirDate, req.IsHero, req.SortOrder,
	).Scan(&id)
	if err != nil {
		return 0, fmt.Errorf("insert youtube_episode: %w", err)
	}
	return id, nil
}

func (r *youtubeEpisodeRepository) GetByID(id int64) (*model.YouTubeEpisode, error) {
	const q = `
		SELECT id, youtube_url, youtube_video_id, title, thumbnail_url,
		       TO_CHAR(air_date, 'YYYY-MM-DD'), is_hero, sort_order, created_at, updated_at
		FROM youtube_episodes
		WHERE id = $1`

	ep := &model.YouTubeEpisode{}
	err := r.db.QueryRow(q, id).Scan(
		&ep.ID, &ep.YoutubeURL, &ep.YoutubeVideoID, &ep.Title, &ep.ThumbnailURL,
		&ep.AirDate, &ep.IsHero, &ep.SortOrder, &ep.CreatedAt, &ep.UpdatedAt,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get youtube_episode: %w", err)
	}

	castMembers, err := r.getCastMembers(id)
	if err != nil {
		return nil, err
	}
	ep.CastMembers = castMembers
	return ep, nil
}

func (r *youtubeEpisodeRepository) getCastMembers(episodeID int64) ([]model.CastMemberListItem, error) {
	const q = `
		SELECT cm.id, cm.display_name, cm.profile_image, cm.badge_type,
		       cm.youtube_channel_url, cm.follower_count, cm.story_count
		FROM episode_cast_members ecm
		JOIN cast_members cm ON cm.id = ecm.cast_member_id
		WHERE ecm.episode_id = $1`

	rows, err := r.db.Query(q, episodeID)
	if err != nil {
		return nil, fmt.Errorf("get episode cast_members: %w", err)
	}
	defer rows.Close()

	var items []model.CastMemberListItem
	for rows.Next() {
		item := model.CastMemberListItem{}
		if err := rows.Scan(
			&item.ID, &item.DisplayName, &item.ProfileImage,
			&item.BadgeType, &item.YoutubeChannelURL,
			&item.FollowerCount, &item.StoryCount,
		); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	if items == nil {
		items = []model.CastMemberListItem{}
	}
	return items, nil
}

func (r *youtubeEpisodeRepository) ListHero() ([]model.YouTubeEpisode, error) {
	const q = `
		SELECT id, youtube_url, youtube_video_id, title, thumbnail_url,
		       TO_CHAR(air_date, 'YYYY-MM-DD'), is_hero, sort_order, created_at, updated_at
		FROM youtube_episodes
		WHERE is_hero = TRUE
		ORDER BY sort_order ASC, created_at DESC`

	rows, err := r.db.Query(q)
	if err != nil {
		return nil, fmt.Errorf("list hero episodes: %w", err)
	}
	defer rows.Close()

	return r.scanEpisodes(rows)
}

func (r *youtubeEpisodeRepository) ListAll(limit, offset int) ([]model.YouTubeEpisode, int, error) {
	if limit < 1 || limit > 100 {
		limit = 20
	}

	var total int
	const countQ = `SELECT COUNT(*) FROM youtube_episodes`
	if err := r.db.QueryRow(countQ).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("count youtube_episodes: %w", err)
	}

	const q = `
		SELECT id, youtube_url, youtube_video_id, title, thumbnail_url,
		       TO_CHAR(air_date, 'YYYY-MM-DD'), is_hero, sort_order, created_at, updated_at
		FROM youtube_episodes
		ORDER BY sort_order ASC, created_at DESC
		LIMIT $1 OFFSET $2`

	rows, err := r.db.Query(q, limit, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("list youtube_episodes: %w", err)
	}
	defer rows.Close()

	episodes, err := r.scanEpisodes(rows)
	if err != nil {
		return nil, 0, err
	}
	return episodes, total, nil
}

func (r *youtubeEpisodeRepository) scanEpisodes(rows *sql.Rows) ([]model.YouTubeEpisode, error) {
	var episodes []model.YouTubeEpisode
	for rows.Next() {
		ep := model.YouTubeEpisode{}
		if err := rows.Scan(
			&ep.ID, &ep.YoutubeURL, &ep.YoutubeVideoID, &ep.Title, &ep.ThumbnailURL,
			&ep.AirDate, &ep.IsHero, &ep.SortOrder, &ep.CreatedAt, &ep.UpdatedAt,
		); err != nil {
			return nil, err
		}
		ep.CastMembers = []model.CastMemberListItem{}
		episodes = append(episodes, ep)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	if episodes == nil {
		return []model.YouTubeEpisode{}, nil
	}

	// Batch-fetch cast members per episode to avoid N+1.
	epIDs := make([]interface{}, len(episodes))
	idxMap := make(map[int64]int, len(episodes))
	for i, ep := range episodes {
		epIDs[i] = ep.ID
		idxMap[ep.ID] = i
	}

	placeholders := make([]string, len(epIDs))
	for i := range epIDs {
		placeholders[i] = fmt.Sprintf("$%d", i+1)
	}

	castQ := fmt.Sprintf(`
		SELECT ecm.episode_id, cm.id, cm.display_name, cm.profile_image, cm.badge_type,
		       cm.youtube_channel_url, cm.follower_count, cm.story_count
		FROM episode_cast_members ecm
		JOIN cast_members cm ON cm.id = ecm.cast_member_id
		WHERE ecm.episode_id IN (%s)`, strings.Join(placeholders, ","))

	castRows, err := r.db.Query(castQ, epIDs...)
	if err != nil {
		return nil, fmt.Errorf("batch episode cast_members: %w", err)
	}
	defer castRows.Close()

	for castRows.Next() {
		var epID int64
		item := model.CastMemberListItem{}
		if err := castRows.Scan(
			&epID,
			&item.ID, &item.DisplayName, &item.ProfileImage,
			&item.BadgeType, &item.YoutubeChannelURL,
			&item.FollowerCount, &item.StoryCount,
		); err != nil {
			return nil, err
		}
		if i, ok := idxMap[epID]; ok {
			episodes[i].CastMembers = append(episodes[i].CastMembers, item)
		}
	}
	if err := castRows.Err(); err != nil {
		return nil, err
	}

	return episodes, nil
}

func (r *youtubeEpisodeRepository) LinkCastMember(episodeID, castMemberID int64) error {
	const q = `INSERT INTO episode_cast_members (episode_id, cast_member_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`
	if _, err := r.db.Exec(q, episodeID, castMemberID); err != nil {
		return fmt.Errorf("link cast_member to episode: %w", err)
	}
	return nil
}
