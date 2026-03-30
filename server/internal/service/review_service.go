package service

import (
	"errors"

	"github.com/letmein/server/internal/model"
	"github.com/letmein/server/internal/repository"
)

var (
	ErrReviewNotFound   = errors.New("review not found")
	ErrReviewDuplicate  = errors.New("review already exists for this consultation")
	ErrReviewForbidden  = errors.New("forbidden")
	ErrReviewIneligible = errors.New("not eligible to review: no completed consultation with this hospital")
)

// ──────────────────────────────────────────────
// Input structs
// ──────────────────────────────────────────────

type CreateReviewInput struct {
	HospitalID int64
	RequestID  int64
	Rating     int
	Content    string
	ImageURLs  []string
}

type UpdateReviewInput struct {
	Rating    int
	Content   string
	ImageURLs []string
}

// ──────────────────────────────────────────────
// Interface
// ──────────────────────────────────────────────

type ReviewService interface {
	CreateReview(userID int64, input CreateReviewInput) (*model.Review, error)
	UpdateReview(userID, reviewID int64, input UpdateReviewInput) (*model.Review, error)
	DeleteReview(userID, reviewID int64) error
	ListByHospital(hospitalID int64, cursor int64, limit int) ([]*model.ReviewListItem, error)
}

// ──────────────────────────────────────────────
// Implementation
// ──────────────────────────────────────────────

type reviewService struct {
	reviewRepo   repository.ReviewRepository
	consultRepo  repository.ConsultationRepository
}

func NewReviewService(reviewRepo repository.ReviewRepository, consultRepo repository.ConsultationRepository) ReviewService {
	return &reviewService{
		reviewRepo:  reviewRepo,
		consultRepo: consultRepo,
	}
}

func (s *reviewService) CreateReview(userID int64, input CreateReviewInput) (*model.Review, error) {
	// Eligibility: user must have a selected consultation response for this hospital + request.
	eligible, err := s.checkEligibility(userID, input.HospitalID, input.RequestID)
	if err != nil {
		return nil, err
	}
	if !eligible {
		return nil, ErrReviewIneligible
	}

	// Prevent duplicate review for the same consultation.
	dup, err := s.reviewRepo.CheckDuplicate(userID, input.HospitalID, input.RequestID)
	if err != nil {
		return nil, err
	}
	if dup {
		return nil, ErrReviewDuplicate
	}

	review := &model.Review{
		UserID:     userID,
		HospitalID: input.HospitalID,
		RequestID:  input.RequestID,
		Rating:     input.Rating,
		Content:    input.Content,
		ImageURLs:  input.ImageURLs,
	}

	created, err := s.reviewRepo.CreateReview(review)
	if err != nil {
		return nil, err
	}

	// Recalculate hospital-level stats asynchronously is fine; do it inline
	// since it's a single UPDATE — acceptable latency for review creation.
	_ = s.reviewRepo.UpdateHospitalStats(input.HospitalID)

	return created, nil
}

func (s *reviewService) UpdateReview(userID, reviewID int64, input UpdateReviewInput) (*model.Review, error) {
	existing, err := s.reviewRepo.GetByID(reviewID)
	if errors.Is(err, repository.ErrNotFound) {
		return nil, ErrReviewNotFound
	}
	if err != nil {
		return nil, err
	}
	if existing.UserID != userID {
		return nil, ErrReviewForbidden
	}

	if err := s.reviewRepo.UpdateReview(reviewID, input.Rating, input.Content); err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return nil, ErrReviewNotFound
		}
		return nil, err
	}

	// Replace images when provided.
	if input.ImageURLs != nil {
		if err := s.reviewRepo.DeleteImages(reviewID); err != nil {
			return nil, err
		}
		if len(input.ImageURLs) > 0 {
			if err := s.reviewRepo.AddImages(reviewID, input.ImageURLs); err != nil {
				return nil, err
			}
		}
	}

	_ = s.reviewRepo.UpdateHospitalStats(existing.HospitalID)

	return s.reviewRepo.GetByID(reviewID)
}

func (s *reviewService) DeleteReview(userID, reviewID int64) error {
	existing, err := s.reviewRepo.GetByID(reviewID)
	if errors.Is(err, repository.ErrNotFound) {
		return ErrReviewNotFound
	}
	if err != nil {
		return err
	}
	if existing.UserID != userID {
		return ErrReviewForbidden
	}

	if err := s.reviewRepo.DeleteReview(reviewID); err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return ErrReviewNotFound
		}
		return err
	}

	_ = s.reviewRepo.UpdateHospitalStats(existing.HospitalID)

	return nil
}

func (s *reviewService) ListByHospital(hospitalID int64, cursor int64, limit int) ([]*model.ReviewListItem, error) {
	return s.reviewRepo.ListByHospital(hospitalID, cursor, limit)
}

// checkEligibility verifies the user selected this hospital for the given request.
// A user is eligible when there is a consultation_responses row with status 'selected'
// linked to the request, for this hospital, and the request belongs to the user.
func (s *reviewService) checkEligibility(userID, hospitalID, requestID int64) (bool, error) {
	responses, err := s.consultRepo.GetResponsesByRequest(requestID)
	if err != nil {
		return false, err
	}

	// Also confirm the request belongs to this user.
	req, err := s.consultRepo.GetRequestByID(requestID)
	if err != nil {
		return false, err
	}
	if req.UserID != userID {
		return false, nil
	}

	for _, resp := range responses {
		if resp.HospitalID == hospitalID && resp.Status == "selected" {
			return true, nil
		}
	}
	return false, nil
}
