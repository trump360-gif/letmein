package service

import (
	"errors"
	"time"

	"github.com/letmein/server/internal/model"
	"github.com/letmein/server/internal/repository"
)

var (
	ErrPollNotFound = errors.New("poll not found")
	ErrAlreadyVoted = errors.New("already voted on this poll")
	ErrPollClosed   = errors.New("poll is already closed")
)

// ──────────────────────────────────────────────
// Input structs
// ──────────────────────────────────────────────

type CreatePollInput struct {
	Title       string
	Description string
	PollType    string // "single" | "multiple"
	Options     []CreatePollOptionInput
	EndsAt      *time.Time
}

type CreatePollOptionInput struct {
	Text     string
	ImageURL string
}

// ──────────────────────────────────────────────
// Interface
// ──────────────────────────────────────────────

type PollService interface {
	CreatePoll(userID int64, input CreatePollInput) (*model.Poll, error)
	GetPoll(id int64, currentUserID int64) (*model.PollDetail, error)
	ListPolls(cursor int64, limit int) ([]*model.PollListItem, int64, error)
	Vote(pollID, optionID, userID int64) error
	ClosePoll(pollID, userID int64) error
}

// ──────────────────────────────────────────────
// Implementation
// ──────────────────────────────────────────────

type pollService struct {
	pollRepo repository.PollRepository
}

func NewPollService(pollRepo repository.PollRepository) PollService {
	return &pollService{pollRepo: pollRepo}
}

func (s *pollService) CreatePoll(userID int64, input CreatePollInput) (*model.Poll, error) {
	pollType := input.PollType
	if pollType != "single" && pollType != "multiple" {
		pollType = "single"
	}

	poll := &model.Poll{
		UserID:      userID,
		Title:       input.Title,
		Description: input.Description,
		PollType:    pollType,
		EndsAt:      input.EndsAt,
	}

	options := make([]model.PollOption, 0, len(input.Options))
	for _, o := range input.Options {
		options = append(options, model.PollOption{
			Text:     o.Text,
			ImageURL: o.ImageURL,
		})
	}

	return s.pollRepo.Create(poll, options)
}

func (s *pollService) GetPoll(id int64, currentUserID int64) (*model.PollDetail, error) {
	pd, err := s.pollRepo.GetByID(id, currentUserID)
	if errors.Is(err, repository.ErrNotFound) {
		return nil, ErrPollNotFound
	}
	return pd, err
}

func (s *pollService) ListPolls(cursor int64, limit int) ([]*model.PollListItem, int64, error) {
	return s.pollRepo.List(cursor, limit)
}

func (s *pollService) Vote(pollID, optionID, userID int64) error {
	// Check poll exists and is active.
	pd, err := s.pollRepo.GetByID(pollID, userID)
	if errors.Is(err, repository.ErrNotFound) {
		return ErrPollNotFound
	}
	if err != nil {
		return err
	}
	if pd.Status != "active" {
		return ErrPollClosed
	}

	// For single-type polls the PK on poll_votes already enforces one vote.
	// For multiple-type polls the PK also enforces one row per (poll, user).
	// We expose ErrAlreadyVoted to the handler so it can return 409.
	err = s.pollRepo.Vote(pollID, optionID, userID)
	if errors.Is(err, repository.ErrAlreadyVoted) {
		return ErrAlreadyVoted
	}
	if errors.Is(err, repository.ErrNotFound) {
		return ErrPollNotFound
	}
	return err
}

func (s *pollService) ClosePoll(pollID, userID int64) error {
	authorID, err := s.pollRepo.GetAuthorID(pollID)
	if errors.Is(err, repository.ErrNotFound) {
		return ErrPollNotFound
	}
	if err != nil {
		return err
	}
	if authorID != userID {
		return ErrForbidden
	}

	err = s.pollRepo.Close(pollID)
	if errors.Is(err, repository.ErrNotFound) {
		return ErrPollClosed // already closed or not found
	}
	return err
}
