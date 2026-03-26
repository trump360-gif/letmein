package model

import "time"

// ChatRoom represents a 1:1 chat room between a user and a hospital.
type ChatRoom struct {
	ID            int64      `json:"id"`
	RequestID     int64      `json:"request_id"`
	UserID        int64      `json:"user_id"`
	HospitalID    int64      `json:"hospital_id"`
	Status        string     `json:"status"` // active, closed, auto_closed
	ClosedAt      *time.Time `json:"closed_at,omitempty"`
	LastMessageAt *time.Time `json:"last_message_at,omitempty"`
	CreatedAt     time.Time  `json:"created_at"`

	// Joined display fields (not always populated)
	UserNickname *string `json:"user_nickname,omitempty"`
	HospitalName *string `json:"hospital_name,omitempty"`
}

// Message represents a single chat message in a room.
type Message struct {
	ID          int64      `json:"id"`
	RoomID      int64      `json:"room_id"`
	SenderID    int64      `json:"sender_id"`
	MessageType string     `json:"message_type"` // text, image, system
	Content     string     `json:"content"`
	ReadAt      *time.Time `json:"read_at,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
}

// ChatRoomListItem is the lightweight view used in room list responses.
// It includes the last message preview and unread message count.
type ChatRoomListItem struct {
	ID              int64      `json:"id"`
	RequestID       int64      `json:"request_id"`
	UserID          int64      `json:"user_id"`
	HospitalID      int64      `json:"hospital_id"`
	Status          string     `json:"status"`
	LastMessageAt   *time.Time `json:"last_message_at,omitempty"`
	CreatedAt       time.Time  `json:"created_at"`
	UserNickname    *string    `json:"user_nickname,omitempty"`
	HospitalName    *string    `json:"hospital_name,omitempty"`
	LastMessage     *string    `json:"last_message,omitempty"`
	LastMessageType *string    `json:"last_message_type,omitempty"`
	UnreadCount     int        `json:"unread_count"`
}
