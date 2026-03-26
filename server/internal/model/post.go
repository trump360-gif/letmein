package model

import "time"

// Post is the full post record (DB row).
type Post struct {
	ID            int64      `json:"id"`
	UserID        int64      `json:"user_id"`
	BoardType     string     `json:"board_type"`
	CategoryID    *int       `json:"category_id,omitempty"`
	Title         *string    `json:"title,omitempty"`
	Content       string     `json:"content"`
	HospitalID    *int64     `json:"hospital_id,omitempty"`
	ProcedureDate *string    `json:"procedure_date,omitempty"`
	IsAnonymous   bool       `json:"is_anonymous"`
	Status        string     `json:"status"`
	LikeCount     int        `json:"like_count"`
	CommentCount  int        `json:"comment_count"`
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at"`
}

// PostListItem is a lightweight struct used in paginated list responses.
type PostListItem struct {
	ID            int64     `json:"id"`
	BoardType     string    `json:"board_type"`
	CategoryID    *int      `json:"category_id,omitempty"`
	CategoryName  *string   `json:"category_name,omitempty"`
	Title         *string   `json:"title,omitempty"`
	Content       string    `json:"content"`
	IsAnonymous   bool      `json:"is_anonymous"`
	AuthorNickname string   `json:"author_nickname"`
	HospitalID    *int64    `json:"hospital_id,omitempty"`
	HospitalName  *string   `json:"hospital_name,omitempty"`
	LikeCount     int       `json:"like_count"`
	CommentCount  int       `json:"comment_count"`
	ImageURLs     []string  `json:"image_urls"`
	CreatedAt     time.Time `json:"created_at"`
}

// PostDetail is the full post response including joined data.
type PostDetail struct {
	ID            int64     `json:"id"`
	BoardType     string    `json:"board_type"`
	CategoryID    *int      `json:"category_id,omitempty"`
	CategoryName  *string   `json:"category_name,omitempty"`
	Title         *string   `json:"title,omitempty"`
	Content       string    `json:"content"`
	IsAnonymous   bool      `json:"is_anonymous"`
	AuthorID      int64     `json:"author_id"`
	AuthorNickname string   `json:"author_nickname"`
	HospitalID    *int64    `json:"hospital_id,omitempty"`
	HospitalName  *string   `json:"hospital_name,omitempty"`
	LikeCount     int       `json:"like_count"`
	CommentCount  int       `json:"comment_count"`
	ImageURLs     []string  `json:"image_urls"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

// Comment is a community comment (supports threading via ParentID).
type Comment struct {
	ID             int64      `json:"id"`
	PostID         int64      `json:"post_id"`
	UserID         int64      `json:"user_id"`
	ParentID       *int64     `json:"parent_id,omitempty"`
	Content        string     `json:"content"`
	IsAnonymous    bool       `json:"is_anonymous"`
	Status         string     `json:"status"`
	AuthorNickname string     `json:"author_nickname"`
	Replies        []*Comment `json:"replies,omitempty"`
	CreatedAt      time.Time  `json:"created_at"`
}

// Report is a user-submitted content report.
type Report struct {
	ID          int64      `json:"id"`
	ReporterID  int64      `json:"reporter_id"`
	TargetType  string     `json:"target_type"`
	TargetID    int64      `json:"target_id"`
	Reason      string     `json:"reason"`
	Description *string    `json:"description,omitempty"`
	Status      string     `json:"status"`
	ResolvedAt  *time.Time `json:"resolved_at,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
}
