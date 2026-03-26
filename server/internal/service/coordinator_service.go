package service

import (
	"errors"
	"fmt"

	"github.com/letmein/server/internal/model"
	"github.com/letmein/server/internal/repository"
)

// Sentinel errors for the coordinator matching domain.
var (
	ErrCoordinatorMatchNotFound    = errors.New("coordinator match not found")
	ErrCoordinatorAlreadyMatched   = errors.New("hospital already matched to this consultation request")
	ErrCoordinatorInvalidHospitals = errors.New("between 2 and 3 hospitals must be provided")
	ErrCoordinatorRequestNotActive = errors.New("consultation request is not in an active or matchable state")
)

// CoordinatorService defines all business-logic operations for the coordinator matching module.
type CoordinatorService interface {
	// MatchHospitals assigns 2–3 hospitals to a consultation request, opens chat rooms,
	// and transitions the request status to 'matched'.
	MatchHospitals(requestID int64, hospitalIDs []int64, coordinatorID int64, note string) (*model.CoordinatorMatchResult, error)

	// GetMatchesForUser returns the match cards for a given consultation request,
	// validating that the caller (userID) owns the request.
	GetMatchesForUser(userID, requestID int64) ([]model.CoordinatorMatchWithHospital, error)
}

type coordinatorService struct {
	coordinatorRepo repository.CoordinatorRepository
	consultRepo     repository.ConsultationRepository
	chatRepo        repository.ChatRepository
}

// NewCoordinatorService constructs a CoordinatorService.
func NewCoordinatorService(
	coordinatorRepo repository.CoordinatorRepository,
	consultRepo repository.ConsultationRepository,
	chatRepo repository.ChatRepository,
) CoordinatorService {
	return &coordinatorService{
		coordinatorRepo: coordinatorRepo,
		consultRepo:     consultRepo,
		chatRepo:        chatRepo,
	}
}

func (s *coordinatorService) MatchHospitals(requestID int64, hospitalIDs []int64, coordinatorID int64, note string) (*model.CoordinatorMatchResult, error) {
	if len(hospitalIDs) < 2 || len(hospitalIDs) > 3 {
		return nil, ErrCoordinatorInvalidHospitals
	}

	// Verify the request exists and is eligible.
	req, err := s.consultRepo.GetRequestByID(requestID)
	if errors.Is(err, repository.ErrNotFound) {
		return nil, ErrConsultationNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get request: %w", err)
	}
	if req.Status != "active" && req.Status != "matched" {
		return nil, ErrCoordinatorRequestNotActive
	}

	// Create coordinator_matches rows and chat rooms for each hospital.
	var chatRoomIDs []int64

	for _, hospitalID := range hospitalIDs {
		if _, err := s.coordinatorRepo.CreateMatch(requestID, hospitalID, coordinatorID, note); err != nil {
			if errors.Is(err, repository.ErrAlreadyMatched) {
				return nil, ErrCoordinatorAlreadyMatched
			}
			return nil, fmt.Errorf("create match for hospital %d: %w", hospitalID, err)
		}

		// Open a chat room between the user and this hospital.
		room, err := s.chatRepo.CreateRoom(requestID, req.UserID, hospitalID)
		if err != nil {
			return nil, fmt.Errorf("create chat room for hospital %d: %w", hospitalID, err)
		}
		chatRoomIDs = append(chatRoomIDs, room.ID)
	}

	// Update consultation_requests: set coordinator_id, matched_at, status='matched'.
	if err := s.coordinatorRepo.SetCoordinatorOnRequest(requestID, coordinatorID); err != nil {
		return nil, fmt.Errorf("set coordinator on request: %w", err)
	}
	if err := s.coordinatorRepo.SetRequestStatusMatched(requestID); err != nil {
		return nil, fmt.Errorf("set request status matched: %w", err)
	}

	// Fetch enriched match list (with hospital info + chat room IDs).
	matches, err := s.coordinatorRepo.GetMatchesByRequestID(requestID)
	if err != nil {
		return nil, fmt.Errorf("get matches by request: %w", err)
	}

	return &model.CoordinatorMatchResult{
		RequestID:   requestID,
		Matches:     matches,
		ChatRoomIDs: chatRoomIDs,
	}, nil
}

func (s *coordinatorService) GetMatchesForUser(userID, requestID int64) ([]model.CoordinatorMatchWithHospital, error) {
	// Verify ownership of the request.
	req, err := s.consultRepo.GetRequestByID(requestID)
	if errors.Is(err, repository.ErrNotFound) {
		return nil, ErrConsultationNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get request: %w", err)
	}
	if req.UserID != userID {
		return nil, ErrConsultationForbidden
	}

	matches, err := s.coordinatorRepo.GetMatchesByRequestID(requestID)
	if err != nil {
		return nil, fmt.Errorf("get matches for user: %w", err)
	}
	return matches, nil
}
