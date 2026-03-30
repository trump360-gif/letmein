package service

import (
	"errors"
	"fmt"

	"github.com/letmein/server/internal/model"
	"github.com/letmein/server/internal/repository"
	"github.com/letmein/server/pkg/filter"
)

var (
	ErrPostNotFound     = errors.New("post not found")
	ErrForbidden        = errors.New("forbidden")
	ErrInvalidBoardType = errors.New("invalid board type")
	ErrPostBlocked      = errors.New("post contains blocked content")
)

// ──────────────────────────────────────────────
// Input structs
// ──────────────────────────────────────────────

type CreatePostInput struct {
	BoardType     string
	CategoryID    *int
	Title         *string
	Content       string
	HospitalID    *int64
	ProcedureDate *string
	IsAnonymous   bool
	ImageIDs      []int64
}

type CreateCommentInput struct {
	PostID      int64
	ParentID    *int64
	Content     string
	IsAnonymous bool
}

type CreateReportInput struct {
	TargetType  string
	TargetID    int64
	Reason      string
	Description *string
}

// ──────────────────────────────────────────────
// Interface
// ──────────────────────────────────────────────

type PostService interface {
	CreatePost(userID int64, input CreatePostInput) (*model.Post, error)
	GetPost(id int64) (*model.PostDetail, error)
	ListPosts(params repository.PostListParams) ([]*model.PostListItem, int64, error)
	DeletePost(userID, postID int64) error

	AddComment(userID int64, input CreateCommentInput) (*model.Comment, error)
	GetComments(postID int64) ([]*model.Comment, error)

	ToggleLike(userID, postID int64) (liked bool, count int, err error)

	ReportContent(userID int64, input CreateReportInput) (*model.Report, error)
}

// ──────────────────────────────────────────────
// Implementation
// ──────────────────────────────────────────────

type postService struct {
	postRepo repository.PostRepository
}

func NewPostService(postRepo repository.PostRepository) PostService {
	return &postService{postRepo: postRepo}
}

var validBoardTypes = map[string]bool{
	"before_after": true,
	"free":         true,
	"qna":          true,
}

func (s *postService) CreatePost(userID int64, input CreatePostInput) (*model.Post, error) {
	if !validBoardTypes[input.BoardType] {
		return nil, ErrInvalidBoardType
	}

	// Check title and content for hard-blocked terms (hospital names, competitors, etc.).
	checkTexts := []string{input.Content}
	if input.Title != nil {
		checkTexts = append(checkTexts, *input.Title)
	}
	for _, t := range checkTexts {
		if blocked, reason := filter.ContainsBlockedContent(t); blocked {
			return nil, fmt.Errorf("%w: %s", ErrPostBlocked, reason)
		}
	}

	// Blind profanity and price information before persisting.
	blindedContent := filter.BlindSensitiveContent(input.Content)
	var blindedTitle *string
	if input.Title != nil {
		s := filter.BlindSensitiveContent(*input.Title)
		blindedTitle = &s
	}

	post := &model.Post{
		UserID:        userID,
		BoardType:     input.BoardType,
		CategoryID:    input.CategoryID,
		Title:         blindedTitle,
		Content:       blindedContent,
		HospitalID:    input.HospitalID,
		ProcedureDate: input.ProcedureDate,
		IsAnonymous:   input.IsAnonymous,
	}

	return s.postRepo.Create(post, input.ImageIDs)
}

func (s *postService) GetPost(id int64) (*model.PostDetail, error) {
	pd, err := s.postRepo.GetByID(id)
	if errors.Is(err, repository.ErrNotFound) {
		return nil, ErrPostNotFound
	}
	return pd, err
}

func (s *postService) ListPosts(params repository.PostListParams) ([]*model.PostListItem, int64, error) {
	return s.postRepo.List(params)
}

func (s *postService) DeletePost(userID, postID int64) error {
	// Verify ownership before deleting.
	pd, err := s.postRepo.GetByID(postID)
	if errors.Is(err, repository.ErrNotFound) {
		return ErrPostNotFound
	}
	if err != nil {
		return err
	}
	if pd.AuthorID != userID {
		return ErrForbidden
	}
	return s.postRepo.Delete(postID)
}

func (s *postService) AddComment(userID int64, input CreateCommentInput) (*model.Comment, error) {
	// Verify the post exists.
	if _, err := s.postRepo.GetByID(input.PostID); err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return nil, ErrPostNotFound
		}
		return nil, err
	}

	comment := &model.Comment{
		PostID:      input.PostID,
		UserID:      userID,
		ParentID:    input.ParentID,
		Content:     input.Content,
		IsAnonymous: input.IsAnonymous,
	}
	return s.postRepo.CreateComment(comment)
}

func (s *postService) GetComments(postID int64) ([]*model.Comment, error) {
	return s.postRepo.GetComments(postID)
}

func (s *postService) ToggleLike(userID, postID int64) (bool, int, error) {
	// Verify the post exists.
	if _, err := s.postRepo.GetByID(postID); err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return false, 0, ErrPostNotFound
		}
		return false, 0, err
	}
	return s.postRepo.ToggleLike(userID, postID)
}

func (s *postService) ReportContent(userID int64, input CreateReportInput) (*model.Report, error) {
	report := &model.Report{
		ReporterID:  userID,
		TargetType:  input.TargetType,
		TargetID:    input.TargetID,
		Reason:      input.Reason,
		Description: input.Description,
	}
	return s.postRepo.CreateReport(report)
}
