package model

import "time"

// AdCredit holds the current credit balance for a hospital.
type AdCredit struct {
	ID         int64     `json:"id"`
	HospitalID int64     `json:"hospital_id"`
	Balance    int       `json:"balance"`
	UpdatedAt  time.Time `json:"updated_at"`
}

// AdCreditTransaction records a single credit change event.
type AdCreditTransaction struct {
	ID          int64     `json:"id"`
	HospitalID  int64     `json:"hospital_id"`
	Amount      int       `json:"amount"`      // positive: charge, negative: spend/refund
	Type        string    `json:"type"`        // charge, spend, refund
	Description *string   `json:"description,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
}

// AdCreative is an ad image + headline registered by a hospital.
type AdCreative struct {
	ID              int64      `json:"id"`
	HospitalID      int64      `json:"hospital_id"`
	ImageURL        string     `json:"image_url"`
	Headline        string     `json:"headline"`
	ReviewStatus    string     `json:"review_status"` // pending, approved, rejected
	RejectionReason *string    `json:"rejection_reason,omitempty"`
	ReviewedAt      *time.Time `json:"reviewed_at,omitempty"`
	ReviewedBy      *int64     `json:"reviewed_by,omitempty"`
	CreatedAt       time.Time  `json:"created_at"`
}

// AdCreativeCreateRequest is the request body for registering a new creative.
type AdCreativeCreateRequest struct {
	ImageURL string `json:"image_url" binding:"required,url"`
	Headline string `json:"headline"  binding:"required,min=1,max=60"`
}

// AdCreativeReviewRequest is the admin request body for approving/rejecting a creative.
type AdCreativeReviewRequest struct {
	Status          string  `json:"status"           binding:"required,oneof=approved rejected"`
	RejectionReason *string `json:"rejection_reason"`
}

// AdCampaign represents an ad campaign that runs a creative in a placement.
type AdCampaign struct {
	ID               int64     `json:"id"`
	HospitalID       int64     `json:"hospital_id"`
	CreativeID       int64     `json:"creative_id"`
	Placement        string    `json:"placement"`   // community_feed
	Status           string    `json:"status"`      // active, paused, completed, exhausted
	DailyBudget      int       `json:"daily_budget"`
	CpmPrice         int       `json:"cpm_price"`
	StartDate        time.Time `json:"start_date"`
	EndDate          time.Time `json:"end_date"`
	TotalImpressions int64     `json:"total_impressions"`
	TotalClicks      int64     `json:"total_clicks"`
	TotalSpent       int       `json:"total_spent"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`

	// Joined
	Creative     *AdCreative `json:"creative,omitempty"`
	HospitalName string      `json:"hospital_name,omitempty"`
}

// AdCampaignCreateRequest is the request body for creating a new campaign.
type AdCampaignCreateRequest struct {
	CreativeID  int64     `json:"creative_id"   binding:"required,min=1"`
	Placement   string    `json:"placement"     binding:"required,oneof=community_feed"`
	DailyBudget int       `json:"daily_budget"  binding:"required,min=1000"`
	CpmPrice    int       `json:"cpm_price"     binding:"required,min=1"`
	StartDate   time.Time `json:"start_date"    binding:"required"`
	EndDate     time.Time `json:"end_date"      binding:"required"`
}

// AdImpressionDaily stores daily aggregated impression/click/spend data per campaign.
type AdImpressionDaily struct {
	ID          int64     `json:"id"`
	CampaignID  int64     `json:"campaign_id"`
	Date        time.Time `json:"date"`
	Impressions int       `json:"impressions"`
	Clicks      int       `json:"clicks"`
	Spent       int       `json:"spent"`
}

// AdPerformanceReport is the aggregated performance view for a campaign.
type AdPerformanceReport struct {
	CampaignID       int64               `json:"campaign_id"`
	TotalImpressions int64               `json:"total_impressions"`
	TotalClicks      int64               `json:"total_clicks"`
	TotalSpent       int                 `json:"total_spent"`
	CTR              float64             `json:"ctr"` // clicks / impressions
	Daily            []AdImpressionDaily `json:"daily"`
}

// AdFeedItem is a lightweight card returned for feed ad injection.
type AdFeedItem struct {
	CampaignID   int64  `json:"campaign_id"`
	HospitalID   int64  `json:"hospital_id"`
	HospitalName string `json:"hospital_name"`
	ImageURL     string `json:"image_url"`
	Headline     string `json:"headline"`
	Placement    string `json:"placement"`
}
