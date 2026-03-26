package model

import "time"

type Hospital struct {
	ID             int64      `json:"id"`
	UserID         int64      `json:"user_id"`
	Name           string     `json:"name"`
	BusinessNumber *string    `json:"business_number,omitempty"`
	LicenseImage   *string    `json:"license_image,omitempty"`
	Description    *string    `json:"description,omitempty"`
	Address        *string    `json:"address,omitempty"`
	Phone          *string    `json:"phone,omitempty"`
	OperatingHours *string    `json:"operating_hours,omitempty"`
	ProfileImage   *string    `json:"profile_image,omitempty"`
	Status         string     `json:"status"`
	ApprovedAt     *time.Time `json:"approved_at,omitempty"`
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`

	// Joined data (not always populated)
	Specialties []ProcedureCategory `json:"specialties,omitempty"`
}

type HospitalSpecialty struct {
	ID         int64 `json:"id"`
	HospitalID int64 `json:"hospital_id"`
	CategoryID int   `json:"category_id"`
}

// HospitalListItem is a lightweight struct used in paginated search results.
type HospitalListItem struct {
	ID             int64    `json:"id"`
	Name           string   `json:"name"`
	Address        *string  `json:"address,omitempty"`
	ProfileImage   *string  `json:"profile_image,omitempty"`
	Description    *string  `json:"description,omitempty"`
	ReviewCount    int      `json:"review_count"`
	IsPremium      bool     `json:"is_premium"`
	SpecialtyNames []string `json:"specialty_names,omitempty"`
}

// HospitalDetail is the full hospital response including tagged community posts.
type HospitalDetail struct {
	*Hospital
	TaggedPosts []*PostListItem `json:"tagged_posts"`
}

type ProcedureCategory struct {
	ID        int                `json:"id"`
	Name      string             `json:"name"`
	Icon      *string            `json:"icon,omitempty"`
	SortOrder int                `json:"sort_order"`
	Details   []ProcedureDetail  `json:"details,omitempty"`
}

type ProcedureDetail struct {
	ID         int    `json:"id"`
	CategoryID int    `json:"category_id"`
	Name       string `json:"name"`
	SortOrder  int    `json:"sort_order"`
}
