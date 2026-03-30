package service

import (
	"errors"
	"fmt"

	"github.com/letmein/server/internal/model"
	"github.com/letmein/server/internal/repository"
)

var (
	ErrHospitalNotFound    = errors.New("hospital not found")
	ErrHospitalExists      = errors.New("hospital already registered for this user")
	ErrHospitalNotApproved = errors.New("hospital is not approved")
)

// RegisterInput holds the data required to register a new hospital.
type RegisterInput struct {
	Name           string
	BusinessNumber string
	LicenseImage   string
	Address        string
	Phone          string
	OperatingHours string
	Description    string
	SpecialtyIDs   []int
}

// UpdateProfileInput holds the fields the hospital can update themselves.
type UpdateProfileInput struct {
	Name           string
	Description    *string
	Address        *string
	Phone          *string
	OperatingHours *string
	ProfileImage   *string
}

// HospitalSearchParams mirrors repository.SearchParams for the service layer.
type HospitalSearchParams struct {
	Query      string
	CategoryID *int
	Region     string
	SortBy     string
	Cursor     int64 // cursor-based pagination (0 = first page)
	Limit      int
}

// CursorMeta holds cursor-based pagination metadata.
type CursorMeta struct {
	NextCursor int64 `json:"next_cursor"`
	Limit      int   `json:"limit"`
}

// PaginatedHospitals is the cursor-paginated search result.
type PaginatedHospitals struct {
	Data []*model.HospitalListItem `json:"data"`
	Meta CursorMeta                `json:"meta"`
}

type HospitalService interface {
	Register(userID int64, input RegisterInput) (*model.Hospital, error)
	UpdateProfile(hospitalID int64, input UpdateProfileInput) (*model.Hospital, error)
	GetProfile(hospitalID int64) (*model.HospitalDetail, error)
	GetProfileByUserID(userID int64) (*model.Hospital, error)
	Search(params HospitalSearchParams) (*PaginatedHospitals, error)
	GetDashboard(hospitalID int64) (*repository.DashboardStats, error)
}

type hospitalService struct {
	hospitalRepo repository.HospitalRepository
	categoryRepo repository.CategoryRepository
}

func NewHospitalService(
	hospitalRepo repository.HospitalRepository,
	categoryRepo repository.CategoryRepository,
) HospitalService {
	return &hospitalService{
		hospitalRepo: hospitalRepo,
		categoryRepo: categoryRepo,
	}
}

func (s *hospitalService) Register(userID int64, input RegisterInput) (*model.Hospital, error) {
	// Check if user already has a hospital registered.
	existing, err := s.hospitalRepo.GetByUserID(userID)
	if err != nil && !errors.Is(err, repository.ErrNotFound) {
		return nil, fmt.Errorf("check existing hospital: %w", err)
	}
	if existing != nil {
		return nil, ErrHospitalExists
	}

	h := &model.Hospital{
		UserID: userID,
		Name:   input.Name,
	}
	if input.BusinessNumber != "" {
		h.BusinessNumber = &input.BusinessNumber
	}
	if input.LicenseImage != "" {
		h.LicenseImage = &input.LicenseImage
	}
	if input.Address != "" {
		h.Address = &input.Address
	}
	if input.Phone != "" {
		h.Phone = &input.Phone
	}
	if input.OperatingHours != "" {
		h.OperatingHours = &input.OperatingHours
	}
	if input.Description != "" {
		h.Description = &input.Description
	}

	created, err := s.hospitalRepo.Create(h, input.SpecialtyIDs)
	if err != nil {
		return nil, fmt.Errorf("create hospital: %w", err)
	}

	// Elevate user role to "hospital".
	if err := s.hospitalRepo.UpdateRole(userID); err != nil {
		// Non-fatal: log in a real app, but do not roll back the hospital row.
		_ = err
	}

	return created, nil
}

func (s *hospitalService) UpdateProfile(hospitalID int64, input UpdateProfileInput) (*model.Hospital, error) {
	h, err := s.hospitalRepo.GetByID(hospitalID)
	if errors.Is(err, repository.ErrNotFound) {
		return nil, ErrHospitalNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get hospital: %w", err)
	}

	h.Name = input.Name
	if input.Description != nil {
		h.Description = input.Description
	}
	if input.Address != nil {
		h.Address = input.Address
	}
	if input.Phone != nil {
		h.Phone = input.Phone
	}
	if input.OperatingHours != nil {
		h.OperatingHours = input.OperatingHours
	}
	if input.ProfileImage != nil {
		h.ProfileImage = input.ProfileImage
	}

	if err := s.hospitalRepo.Update(h); err != nil {
		return nil, fmt.Errorf("update hospital: %w", err)
	}

	return s.hospitalRepo.GetByID(hospitalID)
}

func (s *hospitalService) GetProfile(hospitalID int64) (*model.HospitalDetail, error) {
	h, err := s.hospitalRepo.GetByID(hospitalID)
	if errors.Is(err, repository.ErrNotFound) {
		return nil, ErrHospitalNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get hospital: %w", err)
	}

	posts, err := s.hospitalRepo.GetTaggedPosts(hospitalID, 5)
	if err != nil {
		return nil, fmt.Errorf("get tagged posts: %w", err)
	}

	return &model.HospitalDetail{
		Hospital:    h,
		TaggedPosts: posts,
	}, nil
}

func (s *hospitalService) GetProfileByUserID(userID int64) (*model.Hospital, error) {
	h, err := s.hospitalRepo.GetByUserID(userID)
	if errors.Is(err, repository.ErrNotFound) {
		return nil, ErrHospitalNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get hospital by user: %w", err)
	}
	return h, nil
}

func (s *hospitalService) Search(params HospitalSearchParams) (*PaginatedHospitals, error) {
	if params.Limit < 1 || params.Limit > 100 {
		params.Limit = 20
	}

	repoParams := repository.SearchParams{
		Query:      params.Query,
		CategoryID: params.CategoryID,
		Region:     params.Region,
		SortBy:     params.SortBy,
		Cursor:     params.Cursor,
		Limit:      params.Limit,
	}

	items, nextCursor, err := s.hospitalRepo.Search(repoParams)
	if err != nil {
		return nil, fmt.Errorf("search hospitals: %w", err)
	}

	return &PaginatedHospitals{
		Data: items,
		Meta: CursorMeta{
			NextCursor: nextCursor,
			Limit:      params.Limit,
		},
	}, nil
}

func (s *hospitalService) GetDashboard(hospitalID int64) (*repository.DashboardStats, error) {
	// Verify the hospital exists.
	if _, err := s.hospitalRepo.GetByID(hospitalID); err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return nil, ErrHospitalNotFound
		}
		return nil, fmt.Errorf("get hospital: %w", err)
	}

	stats, err := s.hospitalRepo.GetDashboardStats(hospitalID)
	if err != nil {
		return nil, fmt.Errorf("get dashboard stats: %w", err)
	}
	return stats, nil
}
