package model

import "time"

// HospitalSubscription represents a premium subscription record for a hospital.
type HospitalSubscription struct {
	ID           int64      `json:"id"`
	HospitalID   int64      `json:"hospital_id"`
	Tier         string     `json:"tier"`   // basic, pro
	Status       string     `json:"status"` // active, expired, cancelled
	StartedAt    time.Time  `json:"started_at"`
	ExpiresAt    time.Time  `json:"expires_at"`
	CancelledAt  *time.Time `json:"cancelled_at,omitempty"`
	MonthlyPrice int        `json:"monthly_price"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
}

// HospitalDoctor represents a doctor profile attached to a hospital (premium only).
type HospitalDoctor struct {
	ID           int64     `json:"id"`
	HospitalID   int64     `json:"hospital_id"`
	Name         string    `json:"name"`
	Title        *string   `json:"title,omitempty"`
	Experience   *string   `json:"experience,omitempty"`
	ProfileImage *string   `json:"profile_image,omitempty"`
	SortOrder    int       `json:"sort_order"`
	CreatedAt    time.Time `json:"created_at"`
}

// HospitalProcedureDetail holds per-category detail text for a premium hospital.
type HospitalProcedureDetail struct {
	ID          int64     `json:"id"`
	HospitalID  int64     `json:"hospital_id"`
	CategoryID  int       `json:"category_id"`
	Description *string   `json:"description,omitempty"`
	ImageURL    *string   `json:"image_url,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
}

// SubscriptionCreateRequest is the request body for subscribing to premium.
type SubscriptionCreateRequest struct {
	Tier         string    `json:"tier"          binding:"required,oneof=basic pro"`
	MonthlyPrice int       `json:"monthly_price" binding:"required,min=1"`
	ExpiresAt    time.Time `json:"expires_at"    binding:"required"`
}

// DoctorCreateRequest is the request body for adding or updating a doctor profile.
type DoctorCreateRequest struct {
	Name         string  `json:"name"          binding:"required,min=1,max=50"`
	Title        *string `json:"title"`
	Experience   *string `json:"experience"`
	ProfileImage *string `json:"profile_image"`
	SortOrder    int     `json:"sort_order"`
}

// PremiumHospitalResponse is the enriched hospital detail for premium hospitals.
type PremiumHospitalResponse struct {
	// Base hospital fields
	ID             int64      `json:"id"`
	Name           string     `json:"name"`
	Address        *string    `json:"address,omitempty"`
	Phone          *string    `json:"phone,omitempty"`
	OperatingHours *string    `json:"operating_hours,omitempty"`
	ProfileImage   *string    `json:"profile_image,omitempty"`
	Description    *string    `json:"description,omitempty"`
	Status         string     `json:"status"`
	ApprovedAt     *time.Time `json:"approved_at,omitempty"`

	// Premium fields
	IsPremium           bool    `json:"is_premium"`
	PremiumTier         *string `json:"premium_tier,omitempty"`
	IntroVideoURL       *string `json:"intro_video_url,omitempty"`
	DetailedDescription *string `json:"detailed_description,omitempty"`
	CaseCount           int     `json:"case_count"`

	// Joined premium data
	Specialties      []ProcedureCategory       `json:"specialties,omitempty"`
	Doctors          []HospitalDoctor          `json:"doctors,omitempty"`
	ProcedureDetails []HospitalProcedureDetail `json:"procedure_details,omitempty"`
	Subscription     *HospitalSubscription     `json:"subscription,omitempty"`
}

// PremiumHospitalListItem is the lightweight struct used in premium search / recommendation lists.
type PremiumHospitalListItem struct {
	HospitalListItem
	IsPremium   bool    `json:"is_premium"`
	PremiumTier *string `json:"premium_tier,omitempty"`
	CaseCount   int     `json:"case_count"`
}
