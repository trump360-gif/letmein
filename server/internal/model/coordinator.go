package model

import "time"

// CoordinatorMatch represents a single hospital assignment made by a coordinator.
type CoordinatorMatch struct {
	ID         int64     `json:"id"`
	RequestID  int64     `json:"request_id"`
	HospitalID int64     `json:"hospital_id"`
	MatchedBy  int64     `json:"matched_by"`
	Note       *string   `json:"note,omitempty"`
	Status     string    `json:"status"` // matched, chat_active, completed, cancelled
	CreatedAt  time.Time `json:"created_at"`
}

// CoordinatorMatchRequest is the API request body for POST /admin/consultations/:id/match.
type CoordinatorMatchRequest struct {
	HospitalIDs []int64 `json:"hospital_ids" binding:"required,min=2,max=3,dive,min=1"`
	Note        string  `json:"note"`
}

// CoordinatorMatchWithHospital enriches a CoordinatorMatch with hospital info and chat room ID.
type CoordinatorMatchWithHospital struct {
	ID           int64     `json:"id"`
	RequestID    int64     `json:"request_id"`
	HospitalID   int64     `json:"hospital_id"`
	HospitalName string    `json:"hospital_name"`
	HospitalProfileImage *string `json:"hospital_profile_image,omitempty"`
	HospitalAddress      *string `json:"hospital_address,omitempty"`
	Note         *string   `json:"note,omitempty"`
	Status       string    `json:"status"`
	ChatRoomID   *int64    `json:"chat_room_id,omitempty"`
	CreatedAt    time.Time `json:"created_at"`
}

// CoordinatorMatchResult is the full response body returned after a successful match operation.
type CoordinatorMatchResult struct {
	RequestID int64                          `json:"request_id"`
	Matches   []CoordinatorMatchWithHospital `json:"matches"`
	ChatRoomIDs []int64                      `json:"chat_room_ids"`
}
