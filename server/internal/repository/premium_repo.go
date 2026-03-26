package repository

import (
	"database/sql"
	"errors"
	"fmt"
	"time"

	"github.com/letmein/server/internal/model"
)

// PremiumRepository handles all persistence for premium subscriptions.
type PremiumRepository interface {
	// Subscription
	CreateSubscription(hospitalID int64, tier string, monthlyPrice int, expiresAt time.Time) (int64, error)
	GetActiveSubscription(hospitalID int64) (*model.HospitalSubscription, error)
	CancelSubscription(id int64) error
	GetSubscriptionByID(id int64) (*model.HospitalSubscription, error)
	ListSubscriptions(limit, offset int) ([]model.HospitalSubscription, int, error)

	// Premium flag management
	SetPremiumFlag(hospitalID int64, isPremium bool, tier *string) error

	// Premium hospital discovery
	ListPremiumHospitals(categoryID int, limit int) ([]model.PremiumHospitalListItem, error)
	GetRecommendedHospitals(limit int) ([]model.PremiumHospitalListItem, error)

	// Premium detail
	GetPremiumDetail(hospitalID int64) (*model.PremiumHospitalResponse, error)
}

// DoctorRepository handles persistence for hospital_doctors.
type DoctorRepository interface {
	CreateDoctor(hospitalID int64, doctor model.DoctorCreateRequest) (int64, error)
	ListByHospital(hospitalID int64) ([]model.HospitalDoctor, error)
	GetDoctorByID(id int64) (*model.HospitalDoctor, error)
	UpdateDoctor(id int64, doctor model.DoctorCreateRequest) error
	DeleteDoctor(id int64) error
}

type premiumRepository struct {
	db *sql.DB
}

type doctorRepository struct {
	db *sql.DB
}

// NewPremiumRepository constructs a PremiumRepository backed by PostgreSQL.
func NewPremiumRepository(db *sql.DB) PremiumRepository {
	return &premiumRepository{db: db}
}

// NewDoctorRepository constructs a DoctorRepository backed by PostgreSQL.
func NewDoctorRepository(db *sql.DB) DoctorRepository {
	return &doctorRepository{db: db}
}

// ---------------------------------------------------------------------------
// Subscription
// ---------------------------------------------------------------------------

func (r *premiumRepository) CreateSubscription(hospitalID int64, tier string, monthlyPrice int, expiresAt time.Time) (int64, error) {
	const q = `
		INSERT INTO hospital_subscriptions (hospital_id, tier, status, started_at, expires_at, monthly_price)
		VALUES ($1, $2, 'active', NOW(), $3, $4)
		RETURNING id`

	var id int64
	err := r.db.QueryRow(q, hospitalID, tier, expiresAt, monthlyPrice).Scan(&id)
	if err != nil {
		return 0, fmt.Errorf("create subscription: %w", err)
	}
	return id, nil
}

func (r *premiumRepository) GetActiveSubscription(hospitalID int64) (*model.HospitalSubscription, error) {
	const q = `
		SELECT id, hospital_id, tier, status, started_at, expires_at, cancelled_at, monthly_price, created_at, updated_at
		FROM hospital_subscriptions
		WHERE hospital_id = $1 AND status = 'active'
		ORDER BY created_at DESC
		LIMIT 1`

	s := &model.HospitalSubscription{}
	err := r.db.QueryRow(q, hospitalID).Scan(
		&s.ID, &s.HospitalID, &s.Tier, &s.Status,
		&s.StartedAt, &s.ExpiresAt, &s.CancelledAt,
		&s.MonthlyPrice, &s.CreatedAt, &s.UpdatedAt,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get active subscription: %w", err)
	}
	return s, nil
}

func (r *premiumRepository) CancelSubscription(id int64) error {
	const q = `
		UPDATE hospital_subscriptions
		SET status = 'cancelled', cancelled_at = NOW(), updated_at = NOW()
		WHERE id = $1 AND status = 'active'`

	result, err := r.db.Exec(q, id)
	if err != nil {
		return fmt.Errorf("cancel subscription: %w", err)
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

func (r *premiumRepository) GetSubscriptionByID(id int64) (*model.HospitalSubscription, error) {
	const q = `
		SELECT id, hospital_id, tier, status, started_at, expires_at, cancelled_at, monthly_price, created_at, updated_at
		FROM hospital_subscriptions
		WHERE id = $1`

	s := &model.HospitalSubscription{}
	err := r.db.QueryRow(q, id).Scan(
		&s.ID, &s.HospitalID, &s.Tier, &s.Status,
		&s.StartedAt, &s.ExpiresAt, &s.CancelledAt,
		&s.MonthlyPrice, &s.CreatedAt, &s.UpdatedAt,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get subscription by id: %w", err)
	}
	return s, nil
}

func (r *premiumRepository) ListSubscriptions(limit, offset int) ([]model.HospitalSubscription, int, error) {
	const countQ = `SELECT COUNT(*) FROM hospital_subscriptions`
	var total int
	if err := r.db.QueryRow(countQ).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("count subscriptions: %w", err)
	}

	const q = `
		SELECT id, hospital_id, tier, status, started_at, expires_at, cancelled_at, monthly_price, created_at, updated_at
		FROM hospital_subscriptions
		ORDER BY created_at DESC
		LIMIT $1 OFFSET $2`

	rows, err := r.db.Query(q, limit, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("list subscriptions: %w", err)
	}
	defer rows.Close()

	var items []model.HospitalSubscription
	for rows.Next() {
		s := model.HospitalSubscription{}
		if err := rows.Scan(
			&s.ID, &s.HospitalID, &s.Tier, &s.Status,
			&s.StartedAt, &s.ExpiresAt, &s.CancelledAt,
			&s.MonthlyPrice, &s.CreatedAt, &s.UpdatedAt,
		); err != nil {
			return nil, 0, err
		}
		items = append(items, s)
	}
	if err := rows.Err(); err != nil {
		return nil, 0, err
	}
	if items == nil {
		items = []model.HospitalSubscription{}
	}
	return items, total, nil
}

// ---------------------------------------------------------------------------
// Premium flag
// ---------------------------------------------------------------------------

func (r *premiumRepository) SetPremiumFlag(hospitalID int64, isPremium bool, tier *string) error {
	const q = `
		UPDATE hospitals
		SET is_premium = $2, premium_tier = $3, updated_at = NOW()
		WHERE id = $1`

	_, err := r.db.Exec(q, hospitalID, isPremium, tier)
	if err != nil {
		return fmt.Errorf("set premium flag: %w", err)
	}
	return nil
}

// ---------------------------------------------------------------------------
// Discovery
// ---------------------------------------------------------------------------

func (r *premiumRepository) ListPremiumHospitals(categoryID int, limit int) ([]model.PremiumHospitalListItem, error) {
	if limit < 1 || limit > 100 {
		limit = 20
	}

	args := []interface{}{}
	argIdx := 1

	where := "h.is_premium = TRUE AND h.status = 'approved'"
	if categoryID > 0 {
		where += fmt.Sprintf(
			" AND EXISTS (SELECT 1 FROM hospital_specialties hs WHERE hs.hospital_id = h.id AND hs.category_id = $%d)",
			argIdx,
		)
		args = append(args, categoryID)
		argIdx++
	}

	dataQ := fmt.Sprintf(`
		SELECT h.id, h.name, h.address, h.profile_image, h.description,
		       COUNT(p.id) AS review_count,
		       h.is_premium, h.premium_tier, h.case_count
		FROM hospitals h
		LEFT JOIN posts p ON p.hospital_id = h.id AND p.board_type = 'before_after' AND p.status = 'active'
		WHERE %s
		GROUP BY h.id
		ORDER BY h.premium_tier DESC, h.case_count DESC, h.name ASC
		LIMIT $%d`, where, argIdx)

	args = append(args, limit)

	rows, err := r.db.Query(dataQ, args...)
	if err != nil {
		return nil, fmt.Errorf("list premium hospitals: %w", err)
	}
	defer rows.Close()

	var items []model.PremiumHospitalListItem
	for rows.Next() {
		item := model.PremiumHospitalListItem{}
		if err := rows.Scan(
			&item.ID, &item.Name, &item.Address, &item.ProfileImage, &item.Description,
			&item.ReviewCount,
			&item.IsPremium, &item.PremiumTier, &item.CaseCount,
		); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	if items == nil {
		items = []model.PremiumHospitalListItem{}
	}
	return items, nil
}

func (r *premiumRepository) GetRecommendedHospitals(limit int) ([]model.PremiumHospitalListItem, error) {
	if limit < 1 || limit > 50 {
		limit = 10
	}

	const q = `
		SELECT h.id, h.name, h.address, h.profile_image, h.description,
		       COUNT(p.id) AS review_count,
		       h.is_premium, h.premium_tier, h.case_count
		FROM hospitals h
		LEFT JOIN posts p ON p.hospital_id = h.id AND p.board_type = 'before_after' AND p.status = 'active'
		WHERE h.is_premium = TRUE AND h.status = 'approved'
		GROUP BY h.id
		ORDER BY h.case_count DESC, review_count DESC, h.name ASC
		LIMIT $1`

	rows, err := r.db.Query(q, limit)
	if err != nil {
		return nil, fmt.Errorf("get recommended hospitals: %w", err)
	}
	defer rows.Close()

	var items []model.PremiumHospitalListItem
	for rows.Next() {
		item := model.PremiumHospitalListItem{}
		if err := rows.Scan(
			&item.ID, &item.Name, &item.Address, &item.ProfileImage, &item.Description,
			&item.ReviewCount,
			&item.IsPremium, &item.PremiumTier, &item.CaseCount,
		); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	if items == nil {
		items = []model.PremiumHospitalListItem{}
	}
	return items, nil
}

// ---------------------------------------------------------------------------
// Premium detail
// ---------------------------------------------------------------------------

func (r *premiumRepository) GetPremiumDetail(hospitalID int64) (*model.PremiumHospitalResponse, error) {
	const q = `
		SELECT id, name, address, phone, operating_hours, profile_image, description,
		       status, approved_at,
		       COALESCE(is_premium, FALSE), premium_tier, intro_video_url, detailed_description,
		       COALESCE(case_count, 0)
		FROM hospitals
		WHERE id = $1`

	h := &model.PremiumHospitalResponse{}
	err := r.db.QueryRow(q, hospitalID).Scan(
		&h.ID, &h.Name, &h.Address, &h.Phone, &h.OperatingHours, &h.ProfileImage, &h.Description,
		&h.Status, &h.ApprovedAt,
		&h.IsPremium, &h.PremiumTier, &h.IntroVideoURL, &h.DetailedDescription,
		&h.CaseCount,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get premium detail: %w", err)
	}
	return h, nil
}

// ---------------------------------------------------------------------------
// Doctor repository
// ---------------------------------------------------------------------------

func (r *doctorRepository) CreateDoctor(hospitalID int64, req model.DoctorCreateRequest) (int64, error) {
	const q = `
		INSERT INTO hospital_doctors (hospital_id, name, title, experience, profile_image, sort_order)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id`

	var id int64
	err := r.db.QueryRow(q,
		hospitalID, req.Name, req.Title, req.Experience, req.ProfileImage, req.SortOrder,
	).Scan(&id)
	if err != nil {
		return 0, fmt.Errorf("create doctor: %w", err)
	}
	return id, nil
}

func (r *doctorRepository) ListByHospital(hospitalID int64) ([]model.HospitalDoctor, error) {
	const q = `
		SELECT id, hospital_id, name, title, experience, profile_image, sort_order, created_at
		FROM hospital_doctors
		WHERE hospital_id = $1
		ORDER BY sort_order ASC, id ASC`

	rows, err := r.db.Query(q, hospitalID)
	if err != nil {
		return nil, fmt.Errorf("list doctors: %w", err)
	}
	defer rows.Close()

	var doctors []model.HospitalDoctor
	for rows.Next() {
		d := model.HospitalDoctor{}
		if err := rows.Scan(
			&d.ID, &d.HospitalID, &d.Name, &d.Title, &d.Experience, &d.ProfileImage,
			&d.SortOrder, &d.CreatedAt,
		); err != nil {
			return nil, err
		}
		doctors = append(doctors, d)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	if doctors == nil {
		doctors = []model.HospitalDoctor{}
	}
	return doctors, nil
}

func (r *doctorRepository) GetDoctorByID(id int64) (*model.HospitalDoctor, error) {
	const q = `
		SELECT id, hospital_id, name, title, experience, profile_image, sort_order, created_at
		FROM hospital_doctors
		WHERE id = $1`

	d := &model.HospitalDoctor{}
	err := r.db.QueryRow(q, id).Scan(
		&d.ID, &d.HospitalID, &d.Name, &d.Title, &d.Experience, &d.ProfileImage,
		&d.SortOrder, &d.CreatedAt,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get doctor by id: %w", err)
	}
	return d, nil
}

func (r *doctorRepository) UpdateDoctor(id int64, req model.DoctorCreateRequest) error {
	const q = `
		UPDATE hospital_doctors
		SET name = $2, title = $3, experience = $4, profile_image = $5, sort_order = $6
		WHERE id = $1`

	result, err := r.db.Exec(q, id, req.Name, req.Title, req.Experience, req.ProfileImage, req.SortOrder)
	if err != nil {
		return fmt.Errorf("update doctor: %w", err)
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

func (r *doctorRepository) DeleteDoctor(id int64) error {
	const q = `DELETE FROM hospital_doctors WHERE id = $1`
	result, err := r.db.Exec(q, id)
	if err != nil {
		return fmt.Errorf("delete doctor: %w", err)
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
