package model

import "time"

// VisitCard represents a visit-booking proposal sent by a hospital inside a chat room.
// The hospital proposes a date/time and the user either accepts or declines it.
type VisitCard struct {
	ID           int64      `json:"id"`
	RoomID       int64      `json:"room_id"`
	HospitalID   int64      `json:"hospital_id"`
	ProposedDate string     `json:"proposed_date"` // ISO 8601 date: "2026-04-15"
	ProposedTime string     `json:"proposed_time"` // e.g. "14:30"
	Note         *string    `json:"note,omitempty"`
	Status       string     `json:"status"` // proposed | accepted | declined
	CreatedAt    time.Time  `json:"created_at"`
	RespondedAt  *time.Time `json:"responded_at,omitempty"`
}

// Visit card status constants.
const (
	VisitCardStatusProposed = "proposed"
	VisitCardStatusAccepted = "accepted"
	VisitCardStatusDeclined = "declined"
)
