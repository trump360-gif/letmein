package service

import (
	"errors"
	"fmt"

	"github.com/letmein/server/internal/model"
	"github.com/letmein/server/internal/repository"
)

var ErrCategoryNotFound = errors.New("category not found")

type CategoryService interface {
	GetAllCategories() ([]model.ProcedureCategory, error)
	GetDetailsByCategory(categoryID int) ([]model.ProcedureDetail, error)
}

type categoryService struct {
	categoryRepo repository.CategoryRepository
}

func NewCategoryService(categoryRepo repository.CategoryRepository) CategoryService {
	return &categoryService{categoryRepo: categoryRepo}
}

func (s *categoryService) GetAllCategories() ([]model.ProcedureCategory, error) {
	cats, err := s.categoryRepo.GetAllCategories()
	if err != nil {
		return nil, fmt.Errorf("get all categories: %w", err)
	}
	return cats, nil
}

func (s *categoryService) GetDetailsByCategory(categoryID int) ([]model.ProcedureDetail, error) {
	// Verify the category exists first.
	if _, err := s.categoryRepo.GetCategoryByID(categoryID); err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return nil, ErrCategoryNotFound
		}
		return nil, fmt.Errorf("get category: %w", err)
	}

	details, err := s.categoryRepo.GetDetailsByCategory(categoryID)
	if err != nil {
		return nil, fmt.Errorf("get details: %w", err)
	}
	return details, nil
}
