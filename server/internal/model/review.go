package model

import "time"

// Review is the full review record (DB row).
type Review struct {
	ID         int64     `json:"id"`
	UserID     int64     `json:"user_id"`
	HospitalID int64     `json:"hospital_id"`
	RequestID  int64     `json:"request_id"`
	Rating     int       `json:"rating"`
	Content    string    `json:"content"`
	Status     string    `json:"status"`
	ImageURLs  []string  `json:"image_urls"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`

	// Joined display field (not always populated)
	AuthorNickname string `json:"author_nickname,omitempty"`
}

// ReviewListItem is a lightweight struct used in paginated list responses.
type ReviewListItem struct {
	ID             int64     `json:"id"`
	UserID         int64     `json:"user_id"`
	HospitalID     int64     `json:"hospital_id"`
	RequestID      int64     `json:"request_id"`
	Rating         int       `json:"rating"`
	Content        string    `json:"content"`
	AuthorNickname string    `json:"author_nickname"`
	ImageURLs      []string  `json:"image_urls"`
	CreatedAt      time.Time `json:"created_at"`
}
