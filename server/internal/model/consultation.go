package model

import "time"

// ConsultationRequest represents a user's reverse-auction consultation request.
type ConsultationRequest struct {
	ID              int64      `json:"id"`
	UserID          int64      `json:"user_id"`
	CategoryID      int        `json:"category_id"`
	Description     string     `json:"description"`
	PreferredPeriod *string    `json:"preferred_period,omitempty"`
	PhotoPublic     bool       `json:"photo_public"`
	Status          string     `json:"status"` // active, expired, completed, cancelled
	ExpiresAt       time.Time  `json:"expires_at"`
	CreatedAt       time.Time  `json:"created_at"`
}

// CreateConsultationRequest is the input model for creating a consultation request via API.
type CreateConsultationRequest struct {
	CategoryID      int    `json:"category_id"`
	DetailIDs       []int  `json:"detail_ids"`
	Description     string `json:"description"`
	PreferredPeriod string `json:"preferred_period"`
	PhotoPublic     bool   `json:"photo_public"`
	ImageIDs        []int64 `json:"image_ids"`
}

// ConsultationRequestDetail is a many-to-many join between requests and procedure_details.
type ConsultationRequestDetail struct {
	RequestID int64 `json:"request_id"`
	DetailID  int   `json:"detail_id"`
}

// ConsultationResponse is a hospital's response to a consultation request.
type ConsultationResponse struct {
	ID             int64     `json:"id"`
	RequestID      int64     `json:"request_id"`
	HospitalID     int64     `json:"hospital_id"`
	Intro          *string   `json:"intro,omitempty"`
	Experience     *string   `json:"experience,omitempty"`
	Message        string    `json:"message"`
	ConsultMethods *string   `json:"consult_methods,omitempty"`
	ConsultHours   *string   `json:"consult_hours,omitempty"`
	Status         string    `json:"status"` // sent, selected, rejected, expired
	CreatedAt      time.Time `json:"created_at"`

	// Joined fields (not always populated)
	HospitalName         *string `json:"hospital_name,omitempty"`
	HospitalProfileImage *string `json:"hospital_profile_image,omitempty"`
	HospitalAddress      *string `json:"hospital_address,omitempty"`
}

// ConsultationRequestWithDetails is the enriched view used in API responses.
type ConsultationRequestWithDetails struct {
	ID              int64                  `json:"id"`
	UserID          int64                  `json:"user_id"`
	CategoryID      int                    `json:"category_id"`
	CategoryName    string                 `json:"category_name"`
	Description     string                 `json:"description"`
	PreferredPeriod *string                `json:"preferred_period,omitempty"`
	PhotoPublic     bool                   `json:"photo_public"`
	Status          string                 `json:"status"`
	ExpiresAt       time.Time              `json:"expires_at"`
	CreatedAt       time.Time              `json:"created_at"`
	Details         []ProcedureDetail      `json:"details"`
	Images          []*Image               `json:"images,omitempty"`
	Responses       []ConsultationResponse `json:"responses,omitempty"`
	ResponseCount   int                    `json:"response_count"`
}
