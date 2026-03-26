package repository

import (
	"database/sql"
	"errors"
	"fmt"
	"time"

	"github.com/letmein/server/internal/model"
)

// AdRepository handles all persistence for the native ad system.
type AdRepository interface {
	// Credit
	GetOrCreateCredit(hospitalID int64) (*model.AdCredit, error)
	AddCredit(hospitalID int64, amount int, description string) error
	DeductCredit(hospitalID int64, amount int, description string) error
	GetCreditBalance(hospitalID int64) (int, error)
	ListCreditTransactions(hospitalID int64, limit, offset int) ([]model.AdCreditTransaction, error)

	// Creative
	CreateCreative(hospitalID int64, req model.AdCreativeCreateRequest) (int64, error)
	GetCreativeByID(id int64) (*model.AdCreative, error)
	UpdateCreativeReview(id int64, status string, reason *string, reviewedBy int64) error
	ListCreativesByHospital(hospitalID int64) ([]model.AdCreative, error)
	ListPendingCreatives() ([]model.AdCreative, error)

	// Campaign
	CreateCampaign(hospitalID int64, req model.AdCampaignCreateRequest) (int64, error)
	GetCampaignByID(id int64) (*model.AdCampaign, error)
	UpdateCampaignStatus(id int64, status string) error
	ListCampaignsByHospital(hospitalID int64) ([]model.AdCampaign, error)
	ListActiveCampaigns(placement string, limit int) ([]model.AdCampaign, error)

	// Impressions / clicks
	RecordImpression(campaignID int64, date time.Time) error
	RecordClick(campaignID int64, date time.Time) error
	GetCampaignPerformance(campaignID int64) (*model.AdPerformanceReport, error)
}

type adRepository struct {
	db *sql.DB
}

// NewAdRepository constructs an AdRepository backed by PostgreSQL.
func NewAdRepository(db *sql.DB) AdRepository {
	return &adRepository{db: db}
}

// ---------------------------------------------------------------------------
// Credit
// ---------------------------------------------------------------------------

func (r *adRepository) GetOrCreateCredit(hospitalID int64) (*model.AdCredit, error) {
	const upsertQ = `
		INSERT INTO ad_credits (hospital_id, balance)
		VALUES ($1, 0)
		ON CONFLICT (hospital_id) DO NOTHING`

	if _, err := r.db.Exec(upsertQ, hospitalID); err != nil {
		return nil, fmt.Errorf("upsert ad credit: %w", err)
	}

	const q = `SELECT id, hospital_id, balance, updated_at FROM ad_credits WHERE hospital_id = $1`
	c := &model.AdCredit{}
	err := r.db.QueryRow(q, hospitalID).Scan(&c.ID, &c.HospitalID, &c.Balance, &c.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("get ad credit: %w", err)
	}
	return c, nil
}

func (r *adRepository) AddCredit(hospitalID int64, amount int, description string) error {
	tx, err := r.db.Begin()
	if err != nil {
		return fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback() //nolint:errcheck

	const upsertQ = `
		INSERT INTO ad_credits (hospital_id, balance, updated_at)
		VALUES ($1, $2, NOW())
		ON CONFLICT (hospital_id) DO UPDATE
		SET balance = ad_credits.balance + $2, updated_at = NOW()`

	if _, err := tx.Exec(upsertQ, hospitalID, amount); err != nil {
		return fmt.Errorf("add credit balance: %w", err)
	}

	const txQ = `
		INSERT INTO ad_credit_transactions (hospital_id, amount, type, description)
		VALUES ($1, $2, 'charge', NULLIF($3, ''))`

	if _, err := tx.Exec(txQ, hospitalID, amount, description); err != nil {
		return fmt.Errorf("insert credit transaction: %w", err)
	}

	return tx.Commit()
}

func (r *adRepository) DeductCredit(hospitalID int64, amount int, description string) error {
	tx, err := r.db.Begin()
	if err != nil {
		return fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback() //nolint:errcheck

	const updateQ = `
		UPDATE ad_credits
		SET balance = balance - $2, updated_at = NOW()
		WHERE hospital_id = $1 AND balance >= $2`

	result, err := tx.Exec(updateQ, hospitalID, amount)
	if err != nil {
		return fmt.Errorf("deduct credit: %w", err)
	}
	n, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if n == 0 {
		return ErrInsufficientCredit
	}

	const txQ = `
		INSERT INTO ad_credit_transactions (hospital_id, amount, type, description)
		VALUES ($1, $2, 'spend', NULLIF($3, ''))`

	if _, err := tx.Exec(txQ, hospitalID, -amount, description); err != nil {
		return fmt.Errorf("insert spend transaction: %w", err)
	}

	return tx.Commit()
}

func (r *adRepository) GetCreditBalance(hospitalID int64) (int, error) {
	const q = `SELECT COALESCE(balance, 0) FROM ad_credits WHERE hospital_id = $1`
	var balance int
	err := r.db.QueryRow(q, hospitalID).Scan(&balance)
	if errors.Is(err, sql.ErrNoRows) {
		return 0, nil
	}
	if err != nil {
		return 0, fmt.Errorf("get credit balance: %w", err)
	}
	return balance, nil
}

func (r *adRepository) ListCreditTransactions(hospitalID int64, limit, offset int) ([]model.AdCreditTransaction, error) {
	const q = `
		SELECT id, hospital_id, amount, type, description, created_at
		FROM ad_credit_transactions
		WHERE hospital_id = $1
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3`

	rows, err := r.db.Query(q, hospitalID, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("list credit transactions: %w", err)
	}
	defer rows.Close()

	var txs []model.AdCreditTransaction
	for rows.Next() {
		t := model.AdCreditTransaction{}
		if err := rows.Scan(&t.ID, &t.HospitalID, &t.Amount, &t.Type, &t.Description, &t.CreatedAt); err != nil {
			return nil, err
		}
		txs = append(txs, t)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	if txs == nil {
		txs = []model.AdCreditTransaction{}
	}
	return txs, nil
}

// ---------------------------------------------------------------------------
// Creative
// ---------------------------------------------------------------------------

func (r *adRepository) CreateCreative(hospitalID int64, req model.AdCreativeCreateRequest) (int64, error) {
	const q = `
		INSERT INTO ad_creatives (hospital_id, image_url, headline, review_status)
		VALUES ($1, $2, $3, 'pending')
		RETURNING id`

	var id int64
	err := r.db.QueryRow(q, hospitalID, req.ImageURL, req.Headline).Scan(&id)
	if err != nil {
		return 0, fmt.Errorf("create creative: %w", err)
	}
	return id, nil
}

func (r *adRepository) GetCreativeByID(id int64) (*model.AdCreative, error) {
	const q = `
		SELECT id, hospital_id, image_url, headline, review_status, rejection_reason, reviewed_at, reviewed_by, created_at
		FROM ad_creatives
		WHERE id = $1`

	c := &model.AdCreative{}
	err := r.db.QueryRow(q, id).Scan(
		&c.ID, &c.HospitalID, &c.ImageURL, &c.Headline,
		&c.ReviewStatus, &c.RejectionReason, &c.ReviewedAt, &c.ReviewedBy,
		&c.CreatedAt,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get creative by id: %w", err)
	}
	return c, nil
}

func (r *adRepository) UpdateCreativeReview(id int64, status string, reason *string, reviewedBy int64) error {
	const q = `
		UPDATE ad_creatives
		SET review_status = $2, rejection_reason = $3, reviewed_at = NOW(), reviewed_by = $4
		WHERE id = $1`

	result, err := r.db.Exec(q, id, status, reason, reviewedBy)
	if err != nil {
		return fmt.Errorf("update creative review: %w", err)
	}
	n, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if n == 0 {
		return ErrNotFound
	}
	return nil
}

func (r *adRepository) ListCreativesByHospital(hospitalID int64) ([]model.AdCreative, error) {
	const q = `
		SELECT id, hospital_id, image_url, headline, review_status, rejection_reason, reviewed_at, reviewed_by, created_at
		FROM ad_creatives
		WHERE hospital_id = $1
		ORDER BY created_at DESC`

	return r.scanCreatives(r.db.Query(q, hospitalID))
}

func (r *adRepository) ListPendingCreatives() ([]model.AdCreative, error) {
	const q = `
		SELECT id, hospital_id, image_url, headline, review_status, rejection_reason, reviewed_at, reviewed_by, created_at
		FROM ad_creatives
		WHERE review_status = 'pending'
		ORDER BY created_at ASC`

	return r.scanCreatives(r.db.Query(q))
}

func (r *adRepository) scanCreatives(rows *sql.Rows, err error) ([]model.AdCreative, error) {
	if err != nil {
		return nil, fmt.Errorf("query creatives: %w", err)
	}
	defer rows.Close()

	var creatives []model.AdCreative
	for rows.Next() {
		c := model.AdCreative{}
		if err := rows.Scan(
			&c.ID, &c.HospitalID, &c.ImageURL, &c.Headline,
			&c.ReviewStatus, &c.RejectionReason, &c.ReviewedAt, &c.ReviewedBy,
			&c.CreatedAt,
		); err != nil {
			return nil, err
		}
		creatives = append(creatives, c)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	if creatives == nil {
		creatives = []model.AdCreative{}
	}
	return creatives, nil
}

// ---------------------------------------------------------------------------
// Campaign
// ---------------------------------------------------------------------------

func (r *adRepository) CreateCampaign(hospitalID int64, req model.AdCampaignCreateRequest) (int64, error) {
	const q = `
		INSERT INTO ad_campaigns (hospital_id, creative_id, placement, status, daily_budget, cpm_price, start_date, end_date)
		VALUES ($1, $2, $3, 'active', $4, $5, $6, $7)
		RETURNING id`

	var id int64
	err := r.db.QueryRow(q,
		hospitalID, req.CreativeID, req.Placement,
		req.DailyBudget, req.CpmPrice,
		req.StartDate.Format("2006-01-02"),
		req.EndDate.Format("2006-01-02"),
	).Scan(&id)
	if err != nil {
		return 0, fmt.Errorf("create campaign: %w", err)
	}
	return id, nil
}

func (r *adRepository) GetCampaignByID(id int64) (*model.AdCampaign, error) {
	const q = `
		SELECT
			c.id, c.hospital_id, c.creative_id, c.placement, c.status,
			c.daily_budget, c.cpm_price, c.start_date, c.end_date,
			c.total_impressions, c.total_clicks, c.total_spent,
			c.created_at, c.updated_at,
			cr.id, cr.hospital_id, cr.image_url, cr.headline, cr.review_status,
			cr.rejection_reason, cr.reviewed_at, cr.reviewed_by, cr.created_at
		FROM ad_campaigns c
		JOIN ad_creatives cr ON cr.id = c.creative_id
		WHERE c.id = $1`

	camp := &model.AdCampaign{}
	cr := &model.AdCreative{}
	err := r.db.QueryRow(q, id).Scan(
		&camp.ID, &camp.HospitalID, &camp.CreativeID, &camp.Placement, &camp.Status,
		&camp.DailyBudget, &camp.CpmPrice, &camp.StartDate, &camp.EndDate,
		&camp.TotalImpressions, &camp.TotalClicks, &camp.TotalSpent,
		&camp.CreatedAt, &camp.UpdatedAt,
		&cr.ID, &cr.HospitalID, &cr.ImageURL, &cr.Headline, &cr.ReviewStatus,
		&cr.RejectionReason, &cr.ReviewedAt, &cr.ReviewedBy, &cr.CreatedAt,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get campaign by id: %w", err)
	}
	camp.Creative = cr
	return camp, nil
}

func (r *adRepository) UpdateCampaignStatus(id int64, status string) error {
	const q = `UPDATE ad_campaigns SET status = $2, updated_at = NOW() WHERE id = $1`
	result, err := r.db.Exec(q, id, status)
	if err != nil {
		return fmt.Errorf("update campaign status: %w", err)
	}
	n, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if n == 0 {
		return ErrNotFound
	}
	return nil
}

func (r *adRepository) ListCampaignsByHospital(hospitalID int64) ([]model.AdCampaign, error) {
	const q = `
		SELECT
			c.id, c.hospital_id, c.creative_id, c.placement, c.status,
			c.daily_budget, c.cpm_price, c.start_date, c.end_date,
			c.total_impressions, c.total_clicks, c.total_spent,
			c.created_at, c.updated_at,
			cr.id, cr.hospital_id, cr.image_url, cr.headline, cr.review_status,
			cr.rejection_reason, cr.reviewed_at, cr.reviewed_by, cr.created_at
		FROM ad_campaigns c
		JOIN ad_creatives cr ON cr.id = c.creative_id
		WHERE c.hospital_id = $1
		ORDER BY c.created_at DESC`

	return r.scanCampaigns(r.db.Query(q, hospitalID))
}

func (r *adRepository) ListActiveCampaigns(placement string, limit int) ([]model.AdCampaign, error) {
	if limit < 1 || limit > 50 {
		limit = 10
	}

	const q = `
		SELECT
			c.id, c.hospital_id, c.creative_id, c.placement, c.status,
			c.daily_budget, c.cpm_price, c.start_date, c.end_date,
			c.total_impressions, c.total_clicks, c.total_spent,
			c.created_at, c.updated_at,
			cr.id, cr.hospital_id, cr.image_url, cr.headline, cr.review_status,
			cr.rejection_reason, cr.reviewed_at, cr.reviewed_by, cr.created_at,
			COALESCE(h.name, '') AS hospital_name
		FROM ad_campaigns c
		JOIN ad_creatives cr ON cr.id = c.creative_id
		LEFT JOIN hospitals h ON h.id = c.hospital_id
		WHERE c.status = 'active'
		  AND c.placement = $1
		  AND cr.review_status = 'approved'
		  AND c.start_date <= CURRENT_DATE
		  AND c.end_date >= CURRENT_DATE
		ORDER BY RANDOM()
		LIMIT $2`

	return r.scanCampaignsWithName(r.db.Query(q, placement, limit))
}

func (r *adRepository) scanCampaigns(rows *sql.Rows, err error) ([]model.AdCampaign, error) {
	if err != nil {
		return nil, fmt.Errorf("query campaigns: %w", err)
	}
	defer rows.Close()

	var campaigns []model.AdCampaign
	for rows.Next() {
		c := model.AdCampaign{}
		cr := model.AdCreative{}
		if err := rows.Scan(
			&c.ID, &c.HospitalID, &c.CreativeID, &c.Placement, &c.Status,
			&c.DailyBudget, &c.CpmPrice, &c.StartDate, &c.EndDate,
			&c.TotalImpressions, &c.TotalClicks, &c.TotalSpent,
			&c.CreatedAt, &c.UpdatedAt,
			&cr.ID, &cr.HospitalID, &cr.ImageURL, &cr.Headline, &cr.ReviewStatus,
			&cr.RejectionReason, &cr.ReviewedAt, &cr.ReviewedBy, &cr.CreatedAt,
		); err != nil {
			return nil, err
		}
		c.Creative = &cr
		campaigns = append(campaigns, c)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	if campaigns == nil {
		campaigns = []model.AdCampaign{}
	}
	return campaigns, nil
}

func (r *adRepository) scanCampaignsWithName(rows *sql.Rows, err error) ([]model.AdCampaign, error) {
	if err != nil {
		return nil, fmt.Errorf("query campaigns: %w", err)
	}
	defer rows.Close()

	var campaigns []model.AdCampaign
	for rows.Next() {
		c := model.AdCampaign{}
		cr := model.AdCreative{}
		if err := rows.Scan(
			&c.ID, &c.HospitalID, &c.CreativeID, &c.Placement, &c.Status,
			&c.DailyBudget, &c.CpmPrice, &c.StartDate, &c.EndDate,
			&c.TotalImpressions, &c.TotalClicks, &c.TotalSpent,
			&c.CreatedAt, &c.UpdatedAt,
			&cr.ID, &cr.HospitalID, &cr.ImageURL, &cr.Headline, &cr.ReviewStatus,
			&cr.RejectionReason, &cr.ReviewedAt, &cr.ReviewedBy, &cr.CreatedAt,
			&c.HospitalName,
		); err != nil {
			return nil, err
		}
		c.Creative = &cr
		campaigns = append(campaigns, c)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	if campaigns == nil {
		campaigns = []model.AdCampaign{}
	}
	return campaigns, nil
}

// ---------------------------------------------------------------------------
// Impressions / clicks
// ---------------------------------------------------------------------------

func (r *adRepository) RecordImpression(campaignID int64, date time.Time) error {
	tx, err := r.db.Begin()
	if err != nil {
		return fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback() //nolint:errcheck

	dateStr := date.Format("2006-01-02")

	// Upsert daily impression log.
	const logQ = `
		INSERT INTO ad_impressions_daily (campaign_id, date, impressions)
		VALUES ($1, $2, 1)
		ON CONFLICT (campaign_id, date) DO UPDATE
		SET impressions = ad_impressions_daily.impressions + 1`

	if _, err := tx.Exec(logQ, campaignID, dateStr); err != nil {
		return fmt.Errorf("upsert impression log: %w", err)
	}

	// Increment campaign totals.
	const campQ = `
		UPDATE ad_campaigns
		SET total_impressions = total_impressions + 1, updated_at = NOW()
		WHERE id = $1`

	if _, err := tx.Exec(campQ, campaignID); err != nil {
		return fmt.Errorf("increment campaign impressions: %w", err)
	}

	return tx.Commit()
}

func (r *adRepository) RecordClick(campaignID int64, date time.Time) error {
	tx, err := r.db.Begin()
	if err != nil {
		return fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback() //nolint:errcheck

	dateStr := date.Format("2006-01-02")

	// Upsert daily click log.
	const logQ = `
		INSERT INTO ad_impressions_daily (campaign_id, date, clicks)
		VALUES ($1, $2, 1)
		ON CONFLICT (campaign_id, date) DO UPDATE
		SET clicks = ad_impressions_daily.clicks + 1`

	if _, err := tx.Exec(logQ, campaignID, dateStr); err != nil {
		return fmt.Errorf("upsert click log: %w", err)
	}

	// Increment campaign totals.
	const campQ = `
		UPDATE ad_campaigns
		SET total_clicks = total_clicks + 1, updated_at = NOW()
		WHERE id = $1`

	if _, err := tx.Exec(campQ, campaignID); err != nil {
		return fmt.Errorf("increment campaign clicks: %w", err)
	}

	return tx.Commit()
}

func (r *adRepository) GetCampaignPerformance(campaignID int64) (*model.AdPerformanceReport, error) {
	// Fetch campaign totals.
	const campQ = `
		SELECT total_impressions, total_clicks, total_spent
		FROM ad_campaigns
		WHERE id = $1`

	report := &model.AdPerformanceReport{CampaignID: campaignID}
	err := r.db.QueryRow(campQ, campaignID).Scan(
		&report.TotalImpressions, &report.TotalClicks, &report.TotalSpent,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get campaign performance totals: %w", err)
	}

	if report.TotalImpressions > 0 {
		report.CTR = float64(report.TotalClicks) / float64(report.TotalImpressions)
	}

	// Fetch daily breakdown.
	const dailyQ = `
		SELECT id, campaign_id, date, impressions, clicks, spent
		FROM ad_impressions_daily
		WHERE campaign_id = $1
		ORDER BY date ASC`

	rows, err := r.db.Query(dailyQ, campaignID)
	if err != nil {
		return nil, fmt.Errorf("get daily impressions: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		d := model.AdImpressionDaily{}
		if err := rows.Scan(&d.ID, &d.CampaignID, &d.Date, &d.Impressions, &d.Clicks, &d.Spent); err != nil {
			return nil, err
		}
		report.Daily = append(report.Daily, d)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	if report.Daily == nil {
		report.Daily = []model.AdImpressionDaily{}
	}

	return report, nil
}
