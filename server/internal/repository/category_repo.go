package repository

import (
	"database/sql"
	"errors"

	"github.com/letmein/server/internal/model"
)

type CategoryRepository interface {
	GetAllCategories() ([]model.ProcedureCategory, error)
	GetCategoryByID(id int) (*model.ProcedureCategory, error)
	GetDetailsByCategory(categoryID int) ([]model.ProcedureDetail, error)
}

type categoryRepository struct {
	db *sql.DB
}

func NewCategoryRepository(db *sql.DB) CategoryRepository {
	return &categoryRepository{db: db}
}

func (r *categoryRepository) GetAllCategories() ([]model.ProcedureCategory, error) {
	const catQ = `
		SELECT id, name, icon, sort_order
		FROM procedure_categories
		ORDER BY sort_order ASC, name ASC`

	rows, err := r.db.Query(catQ)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var cats []model.ProcedureCategory
	for rows.Next() {
		c := model.ProcedureCategory{}
		if err := rows.Scan(&c.ID, &c.Name, &c.Icon, &c.SortOrder); err != nil {
			return nil, err
		}
		cats = append(cats, c)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	if len(cats) == 0 {
		return []model.ProcedureCategory{}, nil
	}

	// Load details for each category in a single query to avoid N+1.
	const detQ = `
		SELECT id, category_id, name, sort_order
		FROM procedure_details
		ORDER BY sort_order ASC, name ASC`

	detRows, err := r.db.Query(detQ)
	if err != nil {
		return nil, err
	}
	defer detRows.Close()

	// Index categories by ID for O(1) assignment.
	catByID := make(map[int]*model.ProcedureCategory, len(cats))
	for i := range cats {
		catByID[cats[i].ID] = &cats[i]
	}

	for detRows.Next() {
		d := model.ProcedureDetail{}
		if err := detRows.Scan(&d.ID, &d.CategoryID, &d.Name, &d.SortOrder); err != nil {
			return nil, err
		}
		if cat, ok := catByID[d.CategoryID]; ok {
			cat.Details = append(cat.Details, d)
		}
	}
	if err := detRows.Err(); err != nil {
		return nil, err
	}

	// Ensure Details is never nil in JSON output.
	for i := range cats {
		if cats[i].Details == nil {
			cats[i].Details = []model.ProcedureDetail{}
		}
	}

	return cats, nil
}

func (r *categoryRepository) GetCategoryByID(id int) (*model.ProcedureCategory, error) {
	const q = `
		SELECT id, name, icon, sort_order
		FROM procedure_categories
		WHERE id = $1`

	c := &model.ProcedureCategory{}
	err := r.db.QueryRow(q, id).Scan(&c.ID, &c.Name, &c.Icon, &c.SortOrder)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}

	details, err := r.GetDetailsByCategory(c.ID)
	if err != nil {
		return nil, err
	}
	c.Details = details

	return c, nil
}

func (r *categoryRepository) GetDetailsByCategory(categoryID int) ([]model.ProcedureDetail, error) {
	const q = `
		SELECT id, category_id, name, sort_order
		FROM procedure_details
		WHERE category_id = $1
		ORDER BY sort_order ASC, name ASC`

	rows, err := r.db.Query(q, categoryID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var details []model.ProcedureDetail
	for rows.Next() {
		d := model.ProcedureDetail{}
		if err := rows.Scan(&d.ID, &d.CategoryID, &d.Name, &d.SortOrder); err != nil {
			return nil, err
		}
		details = append(details, d)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	if details == nil {
		details = []model.ProcedureDetail{}
	}
	return details, nil
}
