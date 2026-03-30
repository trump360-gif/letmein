package repository

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/letmein/server/internal/model"
)

// NotificationRepository defines persistence operations for notifications.
type NotificationRepository interface {
	Create(notif *model.Notification) (*model.Notification, error)
	ListByUser(userID int64, cursor int64, limit int) ([]*model.NotificationListItem, error)
	MarkRead(id, userID int64) error
	GetUnreadCount(userID int64) (int, error)
	GetSettings(userID int64) (*model.NotificationSettings, error)
	UpdateSettings(userID int64, settings *model.NotificationSettings) error
}

type notificationRepository struct {
	db *sql.DB
}

func NewNotificationRepository(db *sql.DB) NotificationRepository {
	return &notificationRepository{db: db}
}

// ──────────────────────────────────────────────
// Notifications
// ──────────────────────────────────────────────

func (r *notificationRepository) Create(notif *model.Notification) (*model.Notification, error) {
	const q = `
		INSERT INTO notifications (user_id, type, title, body, data, deep_link)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, user_id, type, title, body, data, deep_link, read_at, created_at`

	n := &model.Notification{}
	var rawData []byte
	var deepLink sql.NullString

	err := r.db.QueryRow(q,
		notif.UserID,
		notif.Type,
		notif.Title,
		notif.Body,
		notif.Data,
		notif.DeepLink,
	).Scan(
		&n.ID, &n.UserID, &n.Type, &n.Title, &n.Body,
		&rawData, &deepLink, &n.ReadAt, &n.CreatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("insert notification: %w", err)
	}

	if len(rawData) > 0 {
		n.Data = json.RawMessage(rawData)
	}
	if deepLink.Valid {
		n.DeepLink = &deepLink.String
	}

	return n, nil
}

// ListByUser returns notifications for a user in reverse-chronological order
// using cursor-based pagination (cursor = last seen notification id; 0 means first page).
func (r *notificationRepository) ListByUser(userID int64, cursor int64, limit int) ([]*model.NotificationListItem, error) {
	if limit < 1 || limit > 100 {
		limit = 20
	}

	var (
		rows *sql.Rows
		err  error
	)

	if cursor == 0 {
		const q = `
			SELECT id, type, title, body, data, deep_link, read_at, created_at
			FROM notifications
			WHERE user_id = $1
			ORDER BY created_at DESC, id DESC
			LIMIT $2`
		rows, err = r.db.Query(q, userID, limit)
	} else {
		const q = `
			SELECT id, type, title, body, data, deep_link, read_at, created_at
			FROM notifications
			WHERE user_id = $1 AND id < $2
			ORDER BY created_at DESC, id DESC
			LIMIT $3`
		rows, err = r.db.Query(q, userID, cursor, limit)
	}

	if err != nil {
		return nil, fmt.Errorf("list notifications: %w", err)
	}
	defer rows.Close()

	var items []*model.NotificationListItem
	for rows.Next() {
		item := &model.NotificationListItem{}
		var rawData []byte
		var deepLink sql.NullString

		if err := rows.Scan(
			&item.ID, &item.Type, &item.Title, &item.Body,
			&rawData, &deepLink, &item.ReadAt, &item.CreatedAt,
		); err != nil {
			return nil, err
		}

		if len(rawData) > 0 {
			item.Data = json.RawMessage(rawData)
		}
		if deepLink.Valid {
			item.DeepLink = &deepLink.String
		}

		items = append(items, item)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	if items == nil {
		items = []*model.NotificationListItem{}
	}
	return items, nil
}

func (r *notificationRepository) MarkRead(id, userID int64) error {
	const q = `
		UPDATE notifications
		SET read_at = $1
		WHERE id = $2 AND user_id = $3 AND read_at IS NULL`

	result, err := r.db.Exec(q, time.Now(), id, userID)
	if err != nil {
		return fmt.Errorf("mark notification read: %w", err)
	}
	n, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if n == 0 {
		// Either not found or already read — treat as not found.
		return ErrNotFound
	}
	return nil
}

func (r *notificationRepository) GetUnreadCount(userID int64) (int, error) {
	const q = `SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND read_at IS NULL`

	var count int
	if err := r.db.QueryRow(q, userID).Scan(&count); err != nil {
		return 0, fmt.Errorf("get unread count: %w", err)
	}
	return count, nil
}

// ──────────────────────────────────────────────
// Settings
// ──────────────────────────────────────────────

func (r *notificationRepository) GetSettings(userID int64) (*model.NotificationSettings, error) {
	const q = `
		SELECT user_id, consultation_arrived, chat_message, chat_expiry,
		       community_activity, event_notice, marketing, updated_at
		FROM notification_settings
		WHERE user_id = $1`

	s := &model.NotificationSettings{}
	err := r.db.QueryRow(q, userID).Scan(
		&s.UserID, &s.ConsultationArrived, &s.ChatMessage, &s.ChatExpiry,
		&s.CommunityActivity, &s.EventNotice, &s.Marketing, &s.UpdatedAt,
	)
	if errors.Is(err, sql.ErrNoRows) {
		// Return default settings if none exist yet.
		return &model.NotificationSettings{
			UserID:              userID,
			ConsultationArrived: true,
			ChatMessage:         true,
			ChatExpiry:          true,
			CommunityActivity:   true,
			EventNotice:         true,
			Marketing:           false,
			UpdatedAt:           time.Now(),
		}, nil
	}
	if err != nil {
		return nil, fmt.Errorf("get notification settings: %w", err)
	}
	return s, nil
}

func (r *notificationRepository) UpdateSettings(userID int64, settings *model.NotificationSettings) error {
	const q = `
		INSERT INTO notification_settings
			(user_id, consultation_arrived, chat_message, chat_expiry,
			 community_activity, event_notice, marketing, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		ON CONFLICT (user_id) DO UPDATE SET
			consultation_arrived = EXCLUDED.consultation_arrived,
			chat_message         = EXCLUDED.chat_message,
			chat_expiry          = EXCLUDED.chat_expiry,
			community_activity   = EXCLUDED.community_activity,
			event_notice         = EXCLUDED.event_notice,
			marketing            = EXCLUDED.marketing,
			updated_at           = EXCLUDED.updated_at`

	_, err := r.db.Exec(q,
		userID,
		settings.ConsultationArrived,
		settings.ChatMessage,
		settings.ChatExpiry,
		settings.CommunityActivity,
		settings.EventNotice,
		settings.Marketing,
		time.Now(),
	)
	if err != nil {
		return fmt.Errorf("upsert notification settings: %w", err)
	}
	return nil
}
