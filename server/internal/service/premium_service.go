package service

import (
	"errors"
	"fmt"
	"time"

	"github.com/letmein/server/internal/model"
	"github.com/letmein/server/internal/repository"
)

var (
	ErrSubscriptionNotFound  = errors.New("subscription not found")
	ErrAlreadySubscribed     = errors.New("hospital already has an active subscription")
	ErrDoctorNotFound        = errors.New("doctor not found")
	ErrDoctorAccessDenied    = errors.New("doctor does not belong to this hospital")
	ErrPremiumRequired       = errors.New("premium subscription required")
)

// PremiumService exposes all premium-related business operations.
type PremiumService interface {
	// Subscription lifecycle
	SubscribePremium(hospitalID int64, tier string, monthlyPrice int, expiresAt time.Time) (*model.HospitalSubscription, error)
	CancelPremium(hospitalID int64) error
	GetPremiumStatus(hospitalID int64) (*model.HospitalSubscription, error)

	// Doctor management (premium only)
	AddDoctor(hospitalID int64, req model.DoctorCreateRequest) (*model.HospitalDoctor, error)
	ListDoctors(hospitalID int64) ([]model.HospitalDoctor, error)
	UpdateDoctor(hospitalID, doctorID int64, req model.DoctorCreateRequest) error
	DeleteDoctor(hospitalID, doctorID int64) error

	// Discovery
	GetPremiumHospitalsForSearch(categoryID int, limit int) ([]model.PremiumHospitalListItem, error)
	GetRecommendedHospitals(limit int) ([]model.PremiumHospitalListItem, error)

	// Detail
	GetHospitalDetailWithPremium(hospitalID int64) (*model.PremiumHospitalResponse, error)

	// Admin operations
	AdminGrantSubscription(hospitalID int64, tier string, monthlyPrice int, expiresAt time.Time) (*model.HospitalSubscription, error)
	AdminCancelSubscription(subscriptionID int64) error
	AdminListSubscriptions(page, limit int) ([]model.HospitalSubscription, int, error)
}

type premiumService struct {
	premiumRepo repository.PremiumRepository
	doctorRepo  repository.DoctorRepository
	hospitalRepo repository.HospitalRepository
}

// NewPremiumService constructs a PremiumService.
func NewPremiumService(
	premiumRepo repository.PremiumRepository,
	doctorRepo repository.DoctorRepository,
	hospitalRepo repository.HospitalRepository,
) PremiumService {
	return &premiumService{
		premiumRepo:  premiumRepo,
		doctorRepo:   doctorRepo,
		hospitalRepo: hospitalRepo,
	}
}

// ---------------------------------------------------------------------------
// Subscription lifecycle
// ---------------------------------------------------------------------------

func (s *premiumService) SubscribePremium(hospitalID int64, tier string, monthlyPrice int, expiresAt time.Time) (*model.HospitalSubscription, error) {
	// Verify the hospital exists and is approved.
	if _, err := s.hospitalRepo.GetByID(hospitalID); err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return nil, ErrHospitalNotFound
		}
		return nil, fmt.Errorf("get hospital: %w", err)
	}

	// Block if there is already an active subscription.
	existing, err := s.premiumRepo.GetActiveSubscription(hospitalID)
	if err != nil && !errors.Is(err, repository.ErrNotFound) {
		return nil, fmt.Errorf("check existing subscription: %w", err)
	}
	if existing != nil {
		return nil, ErrAlreadySubscribed
	}

	id, err := s.premiumRepo.CreateSubscription(hospitalID, tier, monthlyPrice, expiresAt)
	if err != nil {
		return nil, fmt.Errorf("create subscription: %w", err)
	}

	// Flip premium flag on the hospital row.
	if err := s.premiumRepo.SetPremiumFlag(hospitalID, true, &tier); err != nil {
		// Non-fatal: flag can be repaired later.
		_ = err
	}

	sub, err := s.premiumRepo.GetSubscriptionByID(id)
	if err != nil {
		return nil, fmt.Errorf("fetch created subscription: %w", err)
	}
	return sub, nil
}

func (s *premiumService) CancelPremium(hospitalID int64) error {
	sub, err := s.premiumRepo.GetActiveSubscription(hospitalID)
	if errors.Is(err, repository.ErrNotFound) {
		return ErrSubscriptionNotFound
	}
	if err != nil {
		return fmt.Errorf("get active subscription: %w", err)
	}

	if err := s.premiumRepo.CancelSubscription(sub.ID); err != nil {
		return fmt.Errorf("cancel subscription: %w", err)
	}

	// Clear premium flag.
	if err := s.premiumRepo.SetPremiumFlag(hospitalID, false, nil); err != nil {
		_ = err
	}

	return nil
}

func (s *premiumService) GetPremiumStatus(hospitalID int64) (*model.HospitalSubscription, error) {
	sub, err := s.premiumRepo.GetActiveSubscription(hospitalID)
	if errors.Is(err, repository.ErrNotFound) {
		return nil, ErrSubscriptionNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get active subscription: %w", err)
	}
	return sub, nil
}

// ---------------------------------------------------------------------------
// Doctor management
// ---------------------------------------------------------------------------

func (s *premiumService) AddDoctor(hospitalID int64, req model.DoctorCreateRequest) (*model.HospitalDoctor, error) {
	// Require active premium subscription.
	if _, err := s.premiumRepo.GetActiveSubscription(hospitalID); err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return nil, ErrPremiumRequired
		}
		return nil, fmt.Errorf("check subscription: %w", err)
	}

	id, err := s.doctorRepo.CreateDoctor(hospitalID, req)
	if err != nil {
		return nil, fmt.Errorf("create doctor: %w", err)
	}

	doctor, err := s.doctorRepo.GetDoctorByID(id)
	if err != nil {
		return nil, fmt.Errorf("fetch created doctor: %w", err)
	}
	return doctor, nil
}

func (s *premiumService) ListDoctors(hospitalID int64) ([]model.HospitalDoctor, error) {
	doctors, err := s.doctorRepo.ListByHospital(hospitalID)
	if err != nil {
		return nil, fmt.Errorf("list doctors: %w", err)
	}
	return doctors, nil
}

func (s *premiumService) UpdateDoctor(hospitalID, doctorID int64, req model.DoctorCreateRequest) error {
	doc, err := s.doctorRepo.GetDoctorByID(doctorID)
	if errors.Is(err, repository.ErrNotFound) {
		return ErrDoctorNotFound
	}
	if err != nil {
		return fmt.Errorf("get doctor: %w", err)
	}
	if doc.HospitalID != hospitalID {
		return ErrDoctorAccessDenied
	}

	if err := s.doctorRepo.UpdateDoctor(doctorID, req); err != nil {
		return fmt.Errorf("update doctor: %w", err)
	}
	return nil
}

func (s *premiumService) DeleteDoctor(hospitalID, doctorID int64) error {
	doc, err := s.doctorRepo.GetDoctorByID(doctorID)
	if errors.Is(err, repository.ErrNotFound) {
		return ErrDoctorNotFound
	}
	if err != nil {
		return fmt.Errorf("get doctor: %w", err)
	}
	if doc.HospitalID != hospitalID {
		return ErrDoctorAccessDenied
	}

	if err := s.doctorRepo.DeleteDoctor(doctorID); err != nil {
		return fmt.Errorf("delete doctor: %w", err)
	}
	return nil
}

// ---------------------------------------------------------------------------
// Discovery
// ---------------------------------------------------------------------------

func (s *premiumService) GetPremiumHospitalsForSearch(categoryID int, limit int) ([]model.PremiumHospitalListItem, error) {
	items, err := s.premiumRepo.ListPremiumHospitals(categoryID, limit)
	if err != nil {
		return nil, fmt.Errorf("list premium hospitals: %w", err)
	}
	return items, nil
}

func (s *premiumService) GetRecommendedHospitals(limit int) ([]model.PremiumHospitalListItem, error) {
	items, err := s.premiumRepo.GetRecommendedHospitals(limit)
	if err != nil {
		return nil, fmt.Errorf("get recommended hospitals: %w", err)
	}
	return items, nil
}

// ---------------------------------------------------------------------------
// Detail
// ---------------------------------------------------------------------------

func (s *premiumService) GetHospitalDetailWithPremium(hospitalID int64) (*model.PremiumHospitalResponse, error) {
	detail, err := s.premiumRepo.GetPremiumDetail(hospitalID)
	if errors.Is(err, repository.ErrNotFound) {
		return nil, ErrHospitalNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get premium detail: %w", err)
	}

	// Populate doctors if premium.
	if detail.IsPremium {
		doctors, err := s.doctorRepo.ListByHospital(hospitalID)
		if err != nil {
			return nil, fmt.Errorf("list doctors: %w", err)
		}
		detail.Doctors = doctors

		// Attach active subscription info.
		sub, err := s.premiumRepo.GetActiveSubscription(hospitalID)
		if err == nil {
			detail.Subscription = sub
		}
	}

	return detail, nil
}

// ---------------------------------------------------------------------------
// Admin operations
// ---------------------------------------------------------------------------

func (s *premiumService) AdminGrantSubscription(hospitalID int64, tier string, monthlyPrice int, expiresAt time.Time) (*model.HospitalSubscription, error) {
	return s.SubscribePremium(hospitalID, tier, monthlyPrice, expiresAt)
}

func (s *premiumService) AdminCancelSubscription(subscriptionID int64) error {
	sub, err := s.premiumRepo.GetSubscriptionByID(subscriptionID)
	if errors.Is(err, repository.ErrNotFound) {
		return ErrSubscriptionNotFound
	}
	if err != nil {
		return fmt.Errorf("get subscription: %w", err)
	}

	if err := s.premiumRepo.CancelSubscription(sub.ID); err != nil {
		return fmt.Errorf("cancel subscription: %w", err)
	}

	// Clear premium flag on the hospital.
	if err := s.premiumRepo.SetPremiumFlag(sub.HospitalID, false, nil); err != nil {
		_ = err
	}
	return nil
}

func (s *premiumService) AdminListSubscriptions(page, limit int) ([]model.HospitalSubscription, int, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}
	offset := (page - 1) * limit

	items, total, err := s.premiumRepo.ListSubscriptions(limit, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("list subscriptions: %w", err)
	}
	return items, total, nil
}
