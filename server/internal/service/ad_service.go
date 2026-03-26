package service

import (
	"errors"
	"fmt"
	"time"

	"github.com/letmein/server/internal/model"
	"github.com/letmein/server/internal/repository"
)

var (
	ErrCreativeNotFound    = errors.New("ad creative not found")
	ErrCreativeAccessDenied = errors.New("creative does not belong to this hospital")
	ErrCampaignNotFound    = errors.New("ad campaign not found")
	ErrCampaignAccessDenied = errors.New("campaign does not belong to this hospital")
	ErrCampaignNotActive   = errors.New("campaign is not active")
	ErrInsufficientCredit  = errors.New("insufficient ad credit balance")
	ErrCreativeNotApproved = errors.New("creative must be approved before creating a campaign")
)

// AdService exposes all native ad business operations.
type AdService interface {
	// Credit
	ChargeCredit(hospitalID int64, amount int, description string) (*model.AdCredit, error)
	GetCreditBalance(hospitalID int64) (*model.AdCredit, error)

	// Creative
	CreateCreative(hospitalID int64, req model.AdCreativeCreateRequest) (*model.AdCreative, error)
	ListCreatives(hospitalID int64) ([]model.AdCreative, error)
	ReviewCreative(adminUserID, creativeID int64, req model.AdCreativeReviewRequest) error

	// Campaign
	CreateCampaign(hospitalID int64, req model.AdCampaignCreateRequest) (*model.AdCampaign, error)
	ListCampaigns(hospitalID int64) ([]model.AdCampaign, error)
	PauseCampaign(hospitalID, campaignID int64) error
	GetCampaignReport(hospitalID, campaignID int64) (*model.AdPerformanceReport, error)

	// Feed
	GetFeedAds(placement string, count int) ([]model.AdFeedItem, error)

	// Interaction tracking
	RecordAdImpression(campaignID int64) error
	RecordAdClick(campaignID int64) error

	// Admin
	ListPendingCreatives() ([]model.AdCreative, error)
}

type adService struct {
	adRepo       repository.AdRepository
	hospitalRepo repository.HospitalRepository
}

// NewAdService constructs an AdService.
func NewAdService(
	adRepo repository.AdRepository,
	hospitalRepo repository.HospitalRepository,
) AdService {
	return &adService{
		adRepo:       adRepo,
		hospitalRepo: hospitalRepo,
	}
}

// ---------------------------------------------------------------------------
// Credit
// ---------------------------------------------------------------------------

func (s *adService) ChargeCredit(hospitalID int64, amount int, description string) (*model.AdCredit, error) {
	if amount <= 0 {
		return nil, fmt.Errorf("charge amount must be positive")
	}

	if err := s.adRepo.AddCredit(hospitalID, amount, description); err != nil {
		return nil, fmt.Errorf("add credit: %w", err)
	}

	credit, err := s.adRepo.GetOrCreateCredit(hospitalID)
	if err != nil {
		return nil, fmt.Errorf("get credit after charge: %w", err)
	}
	return credit, nil
}

func (s *adService) GetCreditBalance(hospitalID int64) (*model.AdCredit, error) {
	credit, err := s.adRepo.GetOrCreateCredit(hospitalID)
	if err != nil {
		return nil, fmt.Errorf("get credit balance: %w", err)
	}
	return credit, nil
}

// ---------------------------------------------------------------------------
// Creative
// ---------------------------------------------------------------------------

func (s *adService) CreateCreative(hospitalID int64, req model.AdCreativeCreateRequest) (*model.AdCreative, error) {
	id, err := s.adRepo.CreateCreative(hospitalID, req)
	if err != nil {
		return nil, fmt.Errorf("create creative: %w", err)
	}

	creative, err := s.adRepo.GetCreativeByID(id)
	if err != nil {
		return nil, fmt.Errorf("fetch created creative: %w", err)
	}
	return creative, nil
}

func (s *adService) ListCreatives(hospitalID int64) ([]model.AdCreative, error) {
	creatives, err := s.adRepo.ListCreativesByHospital(hospitalID)
	if err != nil {
		return nil, fmt.Errorf("list creatives: %w", err)
	}
	return creatives, nil
}

func (s *adService) ReviewCreative(adminUserID, creativeID int64, req model.AdCreativeReviewRequest) error {
	if _, err := s.adRepo.GetCreativeByID(creativeID); errors.Is(err, repository.ErrNotFound) {
		return ErrCreativeNotFound
	} else if err != nil {
		return fmt.Errorf("get creative: %w", err)
	}

	if err := s.adRepo.UpdateCreativeReview(creativeID, req.Status, req.RejectionReason, adminUserID); err != nil {
		return fmt.Errorf("update creative review: %w", err)
	}
	return nil
}

// ---------------------------------------------------------------------------
// Campaign
// ---------------------------------------------------------------------------

func (s *adService) CreateCampaign(hospitalID int64, req model.AdCampaignCreateRequest) (*model.AdCampaign, error) {
	// Validate date range.
	if !req.EndDate.After(req.StartDate) {
		return nil, fmt.Errorf("end_date must be after start_date")
	}

	// Verify creative belongs to hospital and is approved.
	creative, err := s.adRepo.GetCreativeByID(req.CreativeID)
	if errors.Is(err, repository.ErrNotFound) {
		return nil, ErrCreativeNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get creative: %w", err)
	}
	if creative.HospitalID != hospitalID {
		return nil, ErrCreativeAccessDenied
	}
	if creative.ReviewStatus != "approved" {
		return nil, ErrCreativeNotApproved
	}

	id, err := s.adRepo.CreateCampaign(hospitalID, req)
	if err != nil {
		return nil, fmt.Errorf("create campaign: %w", err)
	}

	campaign, err := s.adRepo.GetCampaignByID(id)
	if err != nil {
		return nil, fmt.Errorf("fetch created campaign: %w", err)
	}
	return campaign, nil
}

func (s *adService) ListCampaigns(hospitalID int64) ([]model.AdCampaign, error) {
	campaigns, err := s.adRepo.ListCampaignsByHospital(hospitalID)
	if err != nil {
		return nil, fmt.Errorf("list campaigns: %w", err)
	}
	return campaigns, nil
}

func (s *adService) PauseCampaign(hospitalID, campaignID int64) error {
	campaign, err := s.adRepo.GetCampaignByID(campaignID)
	if errors.Is(err, repository.ErrNotFound) {
		return ErrCampaignNotFound
	}
	if err != nil {
		return fmt.Errorf("get campaign: %w", err)
	}
	if campaign.HospitalID != hospitalID {
		return ErrCampaignAccessDenied
	}
	if campaign.Status != "active" {
		return ErrCampaignNotActive
	}

	if err := s.adRepo.UpdateCampaignStatus(campaignID, "paused"); err != nil {
		return fmt.Errorf("pause campaign: %w", err)
	}
	return nil
}

func (s *adService) GetCampaignReport(hospitalID, campaignID int64) (*model.AdPerformanceReport, error) {
	campaign, err := s.adRepo.GetCampaignByID(campaignID)
	if errors.Is(err, repository.ErrNotFound) {
		return nil, ErrCampaignNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get campaign: %w", err)
	}
	if campaign.HospitalID != hospitalID {
		return nil, ErrCampaignAccessDenied
	}

	report, err := s.adRepo.GetCampaignPerformance(campaignID)
	if err != nil {
		return nil, fmt.Errorf("get campaign performance: %w", err)
	}
	return report, nil
}

// ---------------------------------------------------------------------------
// Feed
// ---------------------------------------------------------------------------

// GetFeedAds returns up to `count` ad cards for the given placement.
// count should equal feedItemCount / 5 so that one ad appears every 5 posts.
//
// Rules enforced here (in addition to DB-level active/approved filtering):
//   - Campaigns with no creative are skipped.
//   - Consecutive ads from the same hospital are not allowed; duplicates are
//     removed by keeping only the first occurrence per hospital.
func (s *adService) GetFeedAds(placement string, count int) ([]model.AdFeedItem, error) {
	if count < 1 {
		count = 1
	}
	if count > 20 {
		count = 20
	}

	// Fetch more than needed so deduplication still yields `count` items when
	// multiple campaigns from the same hospital are active.
	fetchLimit := count * 3
	if fetchLimit > 60 {
		fetchLimit = 60
	}

	campaigns, err := s.adRepo.ListActiveCampaigns(placement, fetchLimit)
	if err != nil {
		return nil, fmt.Errorf("list active campaigns: %w", err)
	}

	items := make([]model.AdFeedItem, 0, count)
	seenHospitals := make(map[int64]struct{}, count)

	for _, c := range campaigns {
		if len(items) >= count {
			break
		}
		if c.Creative == nil {
			continue
		}
		// Skip if we have already included an ad from this hospital.
		if _, duplicate := seenHospitals[c.HospitalID]; duplicate {
			continue
		}
		seenHospitals[c.HospitalID] = struct{}{}
		items = append(items, model.AdFeedItem{
			CampaignID:   c.ID,
			HospitalID:   c.HospitalID,
			HospitalName: c.HospitalName,
			ImageURL:     c.Creative.ImageURL,
			Headline:     c.Creative.Headline,
			Placement:    c.Placement,
		})
	}
	return items, nil
}

// ---------------------------------------------------------------------------
// Interaction tracking
// ---------------------------------------------------------------------------

func (s *adService) RecordAdImpression(campaignID int64) error {
	if err := s.adRepo.RecordImpression(campaignID, time.Now()); err != nil {
		return fmt.Errorf("record impression: %w", err)
	}
	return nil
}

func (s *adService) RecordAdClick(campaignID int64) error {
	if err := s.adRepo.RecordClick(campaignID, time.Now()); err != nil {
		return fmt.Errorf("record click: %w", err)
	}
	return nil
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

func (s *adService) ListPendingCreatives() ([]model.AdCreative, error) {
	creatives, err := s.adRepo.ListPendingCreatives()
	if err != nil {
		return nil, fmt.Errorf("list pending creatives: %w", err)
	}
	return creatives, nil
}
