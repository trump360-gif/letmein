package service

import (
	"errors"
	"fmt"
	"time"

	"github.com/letmein/server/internal/model"
	"github.com/letmein/server/internal/repository"
	"github.com/letmein/server/pkg/filter"
)

// Sentinel errors for the consultation domain.
var (
	ErrConsultationNotFound    = errors.New("consultation request not found")
	ErrConsultationForbidden   = errors.New("access to this consultation is not allowed")
	ErrResponseSlotFull        = errors.New("consultation already has the maximum number of responses")
	ErrAlreadyResponded        = errors.New("hospital already responded to this consultation request")
	ErrMessageFiltered         = errors.New("message contains forbidden content")
	ErrConsultationNotActive   = errors.New("consultation request is not active")
)

// CreateRequestInput holds the fields required to create a consultation request.
type CreateRequestInput struct {
	CategoryID      int
	DetailIDs       []int
	Description     string
	PreferredPeriod string
	PhotoPublic     bool
	ImageIDs        []int64
}

// SendResponseInput holds the fields required for a hospital to send a response.
type SendResponseInput struct {
	Intro          string
	Experience     string
	Message        string
	ConsultMethods string
	ConsultHours   string
}

// SelectHospitalResult carries data needed to trigger a chat room after selection.
type SelectHospitalResult struct {
	RequestID  int64 `json:"request_id"`
	ResponseID int64 `json:"response_id"`
	UserID     int64 `json:"user_id"`
	HospitalID int64 `json:"hospital_id"`
}

// PaginatedConsultations is a generic paginated result for consultation requests.
type PaginatedConsultations struct {
	Data []*model.ConsultationRequestWithDetails `json:"data"`
	Meta PaginationMeta                          `json:"meta"`
}

// ConsultationService defines all business-logic operations for the auction module.
type ConsultationService interface {
	CreateRequest(userID int64, input CreateRequestInput) (*model.ConsultationRequestWithDetails, error)
	GetUserRequests(userID int64, status string, page, limit int) (*PaginatedConsultations, error)
	GetRequestDetail(userID int64, requestID int64) (*model.ConsultationRequestWithDetails, error)
	GetHospitalRequests(hospitalID int64, page, limit int) (*PaginatedConsultations, error)
	GetRequestDetailForHospital(hospitalID int64, requestID int64) (*model.ConsultationRequestWithDetails, error)
	SendResponse(hospitalID, requestID int64, input SendResponseInput) (*model.ConsultationResponse, error)
	GetReceivedConsultations(userID, requestID int64) ([]model.ConsultationResponse, error)
	SelectHospital(userID, requestID, responseID int64) (*SelectHospitalResult, error)
	CancelRequest(userID, requestID int64) error
	ExpireRequests() (int64, error)
}

type consultationService struct {
	consultRepo  repository.ConsultationRepository
	hospitalRepo repository.HospitalRepository
}

// NewConsultationService constructs a ConsultationService.
func NewConsultationService(
	consultRepo repository.ConsultationRepository,
	hospitalRepo repository.HospitalRepository,
) ConsultationService {
	return &consultationService{
		consultRepo:  consultRepo,
		hospitalRepo: hospitalRepo,
	}
}

func (s *consultationService) CreateRequest(userID int64, input CreateRequestInput) (*model.ConsultationRequestWithDetails, error) {
	req := &model.ConsultationRequest{
		UserID:      userID,
		CategoryID:  input.CategoryID,
		Description: input.Description,
		PhotoPublic: input.PhotoPublic,
		ExpiresAt:   time.Now().Add(72 * time.Hour),
	}
	if input.PreferredPeriod != "" {
		req.PreferredPeriod = &input.PreferredPeriod
	}

	created, err := s.consultRepo.CreateRequest(req, input.DetailIDs)
	if err != nil {
		return nil, fmt.Errorf("create consultation request: %w", err)
	}

	// Link uploaded images to this consultation request.
	if len(input.ImageIDs) > 0 {
		if err := s.consultRepo.AttachImages(created.ID, input.ImageIDs); err != nil {
			return nil, fmt.Errorf("attach images to consultation request: %w", err)
		}
	}

	// Return the enriched detail view (includes images, details, responses).
	detail, err := s.consultRepo.GetRequestByID(created.ID)
	if err != nil {
		return nil, fmt.Errorf("fetch created consultation request: %w", err)
	}
	return detail, nil
}

func (s *consultationService) GetUserRequests(userID int64, status string, page, limit int) (*PaginatedConsultations, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	items, total, err := s.consultRepo.GetRequestsByUser(userID, status, page, limit)
	if err != nil {
		return nil, fmt.Errorf("get user requests: %w", err)
	}

	return &PaginatedConsultations{
		Data: items,
		Meta: PaginationMeta{Total: total, Page: page, Limit: limit},
	}, nil
}

func (s *consultationService) GetRequestDetail(userID int64, requestID int64) (*model.ConsultationRequestWithDetails, error) {
	item, err := s.consultRepo.GetRequestByID(requestID)
	if errors.Is(err, repository.ErrNotFound) {
		return nil, ErrConsultationNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get request detail: %w", err)
	}
	if item.UserID != userID {
		return nil, ErrConsultationForbidden
	}
	return item, nil
}

func (s *consultationService) GetHospitalRequests(hospitalID int64, page, limit int) (*PaginatedConsultations, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	// Get the hospital's specialty category IDs.
	specialties, err := s.hospitalRepo.GetSpecialties(hospitalID)
	if err != nil {
		return nil, fmt.Errorf("get hospital specialties: %w", err)
	}

	categoryIDs := make([]int, len(specialties))
	for i, sp := range specialties {
		categoryIDs[i] = sp.ID
	}

	items, total, err := s.consultRepo.GetActiveRequestsForHospital(hospitalID, categoryIDs, page, limit)
	if err != nil {
		return nil, fmt.Errorf("get hospital requests: %w", err)
	}

	// Strip images from requests where photo_public is false.
	for _, item := range items {
		if !item.PhotoPublic {
			item.Images = nil
		}
	}

	return &PaginatedConsultations{
		Data: items,
		Meta: PaginationMeta{Total: total, Page: page, Limit: limit},
	}, nil
}

func (s *consultationService) GetRequestDetailForHospital(hospitalID int64, requestID int64) (*model.ConsultationRequestWithDetails, error) {
	item, err := s.consultRepo.GetRequestByID(requestID)
	if errors.Is(err, repository.ErrNotFound) {
		return nil, ErrConsultationNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get request detail: %w", err)
	}

	// Only return responses that belong to this hospital (hide others for privacy).
	// The hospital sees only their own response, if any.
	filtered := make([]model.ConsultationResponse, 0)
	for _, resp := range item.Responses {
		if resp.HospitalID == hospitalID {
			filtered = append(filtered, resp)
		}
	}
	item.Responses = filtered

	// Respect photo_public flag.
	if !item.PhotoPublic {
		item.Images = nil
	}

	return item, nil
}

func (s *consultationService) SendResponse(hospitalID, requestID int64, input SendResponseInput) (*model.ConsultationResponse, error) {
	// Validate the message with the keyword filter.
	clean, reason := filter.FilterMessage(input.Message)
	if !clean {
		return nil, fmt.Errorf("%w: %s", ErrMessageFiltered, reason)
	}

	// Also filter intro and experience fields.
	if input.Intro != "" {
		if clean, reason = filter.FilterMessage(input.Intro); !clean {
			return nil, fmt.Errorf("%w: %s", ErrMessageFiltered, reason)
		}
	}
	if input.Experience != "" {
		if clean, reason = filter.FilterMessage(input.Experience); !clean {
			return nil, fmt.Errorf("%w: %s", ErrMessageFiltered, reason)
		}
	}

	// Verify the request is still active.
	item, err := s.consultRepo.GetRequestByID(requestID)
	if errors.Is(err, repository.ErrNotFound) {
		return nil, ErrConsultationNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get request: %w", err)
	}
	if item.Status != "active" {
		return nil, ErrConsultationNotActive
	}

	resp := &model.ConsultationResponse{
		RequestID:  requestID,
		HospitalID: hospitalID,
		Message:    input.Message,
	}
	if input.Intro != "" {
		resp.Intro = &input.Intro
	}
	if input.Experience != "" {
		resp.Experience = &input.Experience
	}
	if input.ConsultMethods != "" {
		resp.ConsultMethods = &input.ConsultMethods
	}
	if input.ConsultHours != "" {
		resp.ConsultHours = &input.ConsultHours
	}

	created, err := s.consultRepo.CreateResponse(resp)
	if errors.Is(err, repository.ErrResponseSlotFull) {
		return nil, ErrResponseSlotFull
	}
	if errors.Is(err, repository.ErrAlreadyResponded) {
		return nil, ErrAlreadyResponded
	}
	if err != nil {
		return nil, fmt.Errorf("create response: %w", err)
	}
	return created, nil
}

func (s *consultationService) GetReceivedConsultations(userID, requestID int64) ([]model.ConsultationResponse, error) {
	// Verify ownership.
	item, err := s.consultRepo.GetRequestByID(requestID)
	if errors.Is(err, repository.ErrNotFound) {
		return nil, ErrConsultationNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get request: %w", err)
	}
	if item.UserID != userID {
		return nil, ErrConsultationForbidden
	}

	responses, err := s.consultRepo.GetResponsesByRequest(requestID)
	if err != nil {
		return nil, fmt.Errorf("get responses: %w", err)
	}
	return responses, nil
}

func (s *consultationService) SelectHospital(userID, requestID, responseID int64) (*SelectHospitalResult, error) {
	// Verify ownership of the request.
	item, err := s.consultRepo.GetRequestByID(requestID)
	if errors.Is(err, repository.ErrNotFound) {
		return nil, ErrConsultationNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get request: %w", err)
	}
	if item.UserID != userID {
		return nil, ErrConsultationForbidden
	}
	if item.Status != "active" {
		return nil, ErrConsultationNotActive
	}

	// Find the target response to retrieve hospitalID before selection.
	var selectedHospitalID int64
	for _, resp := range item.Responses {
		if resp.ID == responseID {
			selectedHospitalID = resp.HospitalID
			break
		}
	}
	if selectedHospitalID == 0 {
		return nil, ErrConsultationNotFound
	}

	if err := s.consultRepo.SelectResponse(requestID, responseID); err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return nil, ErrConsultationNotFound
		}
		return nil, fmt.Errorf("select response: %w", err)
	}

	return &SelectHospitalResult{
		RequestID:  requestID,
		ResponseID: responseID,
		UserID:     userID,
		HospitalID: selectedHospitalID,
	}, nil
}

func (s *consultationService) CancelRequest(userID, requestID int64) error {
	err := s.consultRepo.CancelRequest(requestID, userID)
	if errors.Is(err, repository.ErrNotFound) {
		return ErrConsultationNotFound
	}
	if err != nil {
		return fmt.Errorf("cancel request: %w", err)
	}
	return nil
}

func (s *consultationService) ExpireRequests() (int64, error) {
	n, err := s.consultRepo.ExpireRequests()
	if err != nil {
		return 0, fmt.Errorf("expire requests: %w", err)
	}
	return n, nil
}
