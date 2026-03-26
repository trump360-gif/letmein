package service

import (
	"errors"

	"github.com/letmein/server/internal/model"
	"github.com/letmein/server/internal/repository"
)

var (
	ErrCastMemberNotFound      = errors.New("cast member not found")
	ErrCastMemberAlreadyExists = errors.New("cast member already exists for this user")
	ErrNotACastMember          = errors.New("user is not an approved cast member")
	ErrEpisodeNotFound         = errors.New("episode not found")
	ErrStoryNotFound           = errors.New("story not found")
)

// ──────────────────────────────────────────────
// Interface
// ──────────────────────────────────────────────

type CastMemberService interface {
	// Verification
	ApplyForVerification(userID int64, req model.CastVerificationRequest) (int64, error)
	ApproveVerification(adminUserID, castMemberID int64) error
	RejectVerification(adminUserID, castMemberID int64, reason string) error
	ListCastMembers(page, limit int) ([]model.CastMemberListItem, int, error)
	ListPendingCastMembers(page, limit int) ([]model.CastMember, int, error)
	GetCastMember(id int64) (*model.CastMember, error)

	// Stories
	CreateStory(userID int64, req model.CastStoryCreateRequest) (int64, error)
	GetStory(id int64) (*model.CastStory, error)
	GetStoryFeed(page, limit int) ([]model.CastStoryListItem, int, error)
	GetCastMemberStories(castMemberID int64, page, limit int) ([]model.CastStoryListItem, int, error)

	// Follows
	FollowCastMember(userID, castMemberID int64) error
	UnfollowCastMember(userID, castMemberID int64) error
	GetFollowingList(userID int64) ([]model.CastMemberListItem, error)

	// Episodes
	GetHeroEpisodes() ([]model.YouTubeEpisode, error)
	ListEpisodes(page, limit int) ([]model.YouTubeEpisode, int, error)
	GetEpisode(id int64) (*model.YouTubeEpisode, error)
	CreateEpisode(req model.YouTubeEpisodeCreateRequest) (int64, error)
	LinkEpisodeCastMember(episodeID, castMemberID int64) error
}

// ──────────────────────────────────────────────
// Implementation
// ──────────────────────────────────────────────

type castMemberService struct {
	castMemberRepo repository.CastMemberRepository
	castStoryRepo  repository.CastStoryRepository
	castFollowRepo repository.CastFollowRepository
	episodeRepo    repository.YouTubeEpisodeRepository
}

func NewCastMemberService(
	castMemberRepo repository.CastMemberRepository,
	castStoryRepo repository.CastStoryRepository,
	castFollowRepo repository.CastFollowRepository,
	episodeRepo repository.YouTubeEpisodeRepository,
) CastMemberService {
	return &castMemberService{
		castMemberRepo: castMemberRepo,
		castStoryRepo:  castStoryRepo,
		castFollowRepo: castFollowRepo,
		episodeRepo:    episodeRepo,
	}
}

// ──────────────────────────────────────────────
// Verification
// ──────────────────────────────────────────────

func (s *castMemberService) ApplyForVerification(userID int64, req model.CastVerificationRequest) (int64, error) {
	// Prevent duplicate applications.
	existing, err := s.castMemberRepo.GetByUserID(userID)
	if err != nil && !errors.Is(err, repository.ErrNotFound) {
		return 0, err
	}
	if existing != nil {
		return 0, ErrCastMemberAlreadyExists
	}

	return s.castMemberRepo.CreateCastMember(userID, req)
}

func (s *castMemberService) ApproveVerification(adminUserID, castMemberID int64) error {
	err := s.castMemberRepo.UpdateVerification(castMemberID, "approved", adminUserID, "")
	if errors.Is(err, repository.ErrNotFound) {
		return ErrCastMemberNotFound
	}
	return err
}

func (s *castMemberService) RejectVerification(adminUserID, castMemberID int64, reason string) error {
	err := s.castMemberRepo.UpdateVerification(castMemberID, "rejected", adminUserID, reason)
	if errors.Is(err, repository.ErrNotFound) {
		return ErrCastMemberNotFound
	}
	return err
}

func (s *castMemberService) ListCastMembers(page, limit int) ([]model.CastMemberListItem, int, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}
	offset := (page - 1) * limit
	return s.castMemberRepo.ListApproved(limit, offset)
}

func (s *castMemberService) ListPendingCastMembers(page, limit int) ([]model.CastMember, int, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}
	offset := (page - 1) * limit
	return s.castMemberRepo.ListPending(limit, offset)
}

func (s *castMemberService) GetCastMember(id int64) (*model.CastMember, error) {
	m, err := s.castMemberRepo.GetByID(id)
	if errors.Is(err, repository.ErrNotFound) {
		return nil, ErrCastMemberNotFound
	}
	return m, err
}

// ──────────────────────────────────────────────
// Stories
// ──────────────────────────────────────────────

func (s *castMemberService) CreateStory(userID int64, req model.CastStoryCreateRequest) (int64, error) {
	// Only approved cast members can post stories.
	member, err := s.castMemberRepo.GetByUserID(userID)
	if errors.Is(err, repository.ErrNotFound) {
		return 0, ErrNotACastMember
	}
	if err != nil {
		return 0, err
	}
	if member.VerificationStatus != "approved" {
		return 0, ErrNotACastMember
	}

	return s.castStoryRepo.CreateStory(member.ID, req)
}

func (s *castMemberService) GetStory(id int64) (*model.CastStory, error) {
	story, err := s.castStoryRepo.GetStoryByID(id)
	if errors.Is(err, repository.ErrNotFound) {
		return nil, ErrStoryNotFound
	}
	return story, err
}

func (s *castMemberService) GetStoryFeed(page, limit int) ([]model.CastStoryListItem, int, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}
	offset := (page - 1) * limit
	return s.castStoryRepo.ListFeedStories(limit, offset)
}

func (s *castMemberService) GetCastMemberStories(castMemberID int64, page, limit int) ([]model.CastStoryListItem, int, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}
	// Verify cast member exists.
	if _, err := s.castMemberRepo.GetByID(castMemberID); errors.Is(err, repository.ErrNotFound) {
		return nil, 0, ErrCastMemberNotFound
	} else if err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * limit
	return s.castStoryRepo.ListStories(castMemberID, limit, offset)
}

// ──────────────────────────────────────────────
// Follows
// ──────────────────────────────────────────────

func (s *castMemberService) FollowCastMember(userID, castMemberID int64) error {
	// Verify cast member exists and is approved.
	m, err := s.castMemberRepo.GetByID(castMemberID)
	if errors.Is(err, repository.ErrNotFound) {
		return ErrCastMemberNotFound
	}
	if err != nil {
		return err
	}
	if m.VerificationStatus != "approved" {
		return ErrCastMemberNotFound
	}

	return s.castFollowRepo.Follow(userID, castMemberID)
}

func (s *castMemberService) UnfollowCastMember(userID, castMemberID int64) error {
	return s.castFollowRepo.Unfollow(userID, castMemberID)
}

func (s *castMemberService) GetFollowingList(userID int64) ([]model.CastMemberListItem, error) {
	return s.castFollowRepo.GetFollowingList(userID)
}

// ──────────────────────────────────────────────
// Episodes
// ──────────────────────────────────────────────

func (s *castMemberService) GetHeroEpisodes() ([]model.YouTubeEpisode, error) {
	return s.episodeRepo.ListHero()
}

func (s *castMemberService) ListEpisodes(page, limit int) ([]model.YouTubeEpisode, int, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}
	offset := (page - 1) * limit
	return s.episodeRepo.ListAll(limit, offset)
}

func (s *castMemberService) GetEpisode(id int64) (*model.YouTubeEpisode, error) {
	ep, err := s.episodeRepo.GetByID(id)
	if errors.Is(err, repository.ErrNotFound) {
		return nil, ErrEpisodeNotFound
	}
	return ep, err
}

func (s *castMemberService) CreateEpisode(req model.YouTubeEpisodeCreateRequest) (int64, error) {
	return s.episodeRepo.Create(req)
}

func (s *castMemberService) LinkEpisodeCastMember(episodeID, castMemberID int64) error {
	// Verify both exist.
	if _, err := s.episodeRepo.GetByID(episodeID); errors.Is(err, repository.ErrNotFound) {
		return ErrEpisodeNotFound
	} else if err != nil {
		return err
	}
	if _, err := s.castMemberRepo.GetByID(castMemberID); errors.Is(err, repository.ErrNotFound) {
		return ErrCastMemberNotFound
	} else if err != nil {
		return err
	}

	return s.episodeRepo.LinkCastMember(episodeID, castMemberID)
}
