package model

import (
	"encoding/json"
	"time"
)

// Notification is the full notification record (DB row).
type Notification struct {
	ID        int64           `json:"id"`
	UserID    int64           `json:"user_id"`
	Type      string          `json:"type"`
	Title     string          `json:"title"`
	Body      string          `json:"body"`
	Data      json.RawMessage `json:"data,omitempty"`
	DeepLink  *string         `json:"deep_link,omitempty"`
	ReadAt    *time.Time      `json:"read_at,omitempty"`
	CreatedAt time.Time       `json:"created_at"`
}

// NotificationListItem is a lightweight struct used in paginated list responses.
type NotificationListItem struct {
	ID        int64           `json:"id"`
	Type      string          `json:"type"`
	Title     string          `json:"title"`
	Body      string          `json:"body"`
	Data      json.RawMessage `json:"data,omitempty"`
	DeepLink  *string         `json:"deep_link,omitempty"`
	ReadAt    *time.Time      `json:"read_at,omitempty"`
	CreatedAt time.Time       `json:"created_at"`
}

// NotificationSettings holds per-user notification preferences.
type NotificationSettings struct {
	UserID               int64     `json:"user_id"`
	ConsultationArrived  bool      `json:"consultation_arrived"`
	ChatMessage          bool      `json:"chat_message"`
	ChatExpiry           bool      `json:"chat_expiry"`
	CommunityActivity    bool      `json:"community_activity"`
	EventNotice          bool      `json:"event_notice"`
	Marketing            bool      `json:"marketing"`
	UpdatedAt            time.Time `json:"updated_at"`
}
