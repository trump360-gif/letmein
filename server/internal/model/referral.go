package model

import "time"

// Referral tracks a friend-referral relationship between two users.
// referrer_id invited referred_id using their referral code.
//
// SQL migration (add when DB table is required):
//
//	CREATE TABLE IF NOT EXISTS referrals (
//	  id           BIGSERIAL PRIMARY KEY,
//	  referrer_id  BIGINT      NOT NULL REFERENCES users(id),
//	  referred_id  BIGINT      NOT NULL REFERENCES users(id) UNIQUE,
//	  status       VARCHAR(20) NOT NULL DEFAULT 'pending',
//	  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
//	);
//	CREATE INDEX idx_referrals_referrer_id ON referrals(referrer_id);
//
// status values: pending | confirmed | rewarded

type Referral struct {
	ID         int64     `json:"id"`
	ReferrerID int64     `json:"referrer_id"`
	ReferredID int64     `json:"referred_id"`
	Status     string    `json:"status"` // pending | confirmed | rewarded
	CreatedAt  time.Time `json:"created_at"`
}
