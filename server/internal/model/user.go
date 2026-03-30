package model

import "time"

type User struct {
	ID           int64      `json:"id"`
	KakaoID      int64      `json:"kakao_id"`
	AppleID      *string    `json:"apple_id,omitempty"`
	Nickname     *string    `json:"nickname"`
	ProfileImage *string    `json:"profile_image"`
	Role         string     `json:"role"`
	Status       string     `json:"status"`
	WithdrawnAt  *time.Time `json:"withdrawn_at,omitempty"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
}

type UserAgreement struct {
	ID            int64     `json:"id"`
	UserID        int64     `json:"user_id"`
	AgreementType string    `json:"agreement_type"`
	Agreed        bool      `json:"agreed"`
	AgreedAt      time.Time `json:"agreed_at"`
}

type UserInterest struct {
	ID         int64     `json:"id"`
	UserID     int64     `json:"user_id"`
	CategoryID int       `json:"category_id"`
	CreatedAt  time.Time `json:"created_at"`
}
