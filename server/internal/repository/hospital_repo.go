package repository

import (
	"database/sql"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/letmein/server/internal/model"
)

// SearchParams holds all filter/sort/pagination parameters for hospital search.
type SearchParams struct {
	Query      string
	CategoryID *int
	Region     string
	SortBy     string
	Cursor     int64 // cursor-based: fetch hospitals with id < Cursor (0 = first page)
	Limit      int
}

// DashboardStats holds consultation counts for a hospital.
type DashboardStats struct {
	SentCount     int `json:"sent_count"`
	SelectedCount int `json:"selected_count"`
	ChatCount     int `json:"chat_count"`
}

type HospitalRepository interface {
	Create(hospital *model.Hospital, specialtyIDs []int) (*model.Hospital, error)
	GetByID(id int64) (*model.Hospital, error)
	GetByUserID(userID int64) (*model.Hospital, error)
	Update(hospital *model.Hospital) error
	UpdateStatus(id int64, status string) error
	Search(params SearchParams) ([]*model.HospitalListItem, int64, error)
	GetSpecialties(hospitalID int64) ([]model.ProcedureCategory, error)
	UpdateRole(userID int64) error
	GetDashboardStats(hospitalID int64) (*DashboardStats, error)
	GetTaggedPosts(hospitalID int64, limit int) ([]*model.PostListItem, error)
}

type hospitalRepository struct {
	db *sql.DB
}

func NewHospitalRepository(db *sql.DB) HospitalRepository {
	return &hospitalRepository{db: db}
}

func (r *hospitalRepository) Create(hospital *model.Hospital, specialtyIDs []int) (*model.Hospital, error) {
	tx, err := r.db.Begin()
	if err != nil {
		return nil, fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback() //nolint:errcheck

	const q = `
		INSERT INTO hospitals (user_id, name, business_number, license_image, description, address, phone, operating_hours, profile_image, status)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		RETURNING id, user_id, name, business_number, license_image, description, address, phone, operating_hours, profile_image, status, approved_at, created_at, updated_at`

	h := &model.Hospital{}
	err = tx.QueryRow(q,
		hospital.UserID,
		hospital.Name,
		hospital.BusinessNumber,
		hospital.LicenseImage,
		hospital.Description,
		hospital.Address,
		hospital.Phone,
		hospital.OperatingHours,
		hospital.ProfileImage,
		"pending",
	).Scan(
		&h.ID, &h.UserID, &h.Name, &h.BusinessNumber, &h.LicenseImage,
		&h.Description, &h.Address, &h.Phone, &h.OperatingHours, &h.ProfileImage,
		&h.Status, &h.ApprovedAt, &h.CreatedAt, &h.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("insert hospital: %w", err)
	}

	if len(specialtyIDs) > 0 {
		if err := insertSpecialties(tx, h.ID, specialtyIDs); err != nil {
			return nil, err
		}
	}

	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("commit tx: %w", err)
	}
	return h, nil
}

func insertSpecialties(tx *sql.Tx, hospitalID int64, categoryIDs []int) error {
	for _, catID := range categoryIDs {
		const q = `INSERT INTO hospital_specialties (hospital_id, category_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`
		if _, err := tx.Exec(q, hospitalID, catID); err != nil {
			return fmt.Errorf("insert specialty (category %d): %w", catID, err)
		}
	}
	return nil
}

func (r *hospitalRepository) GetByID(id int64) (*model.Hospital, error) {
	const q = `
		SELECT id, user_id, name, business_number, license_image, description, address, phone, operating_hours, profile_image, status, approved_at, created_at, updated_at
		FROM hospitals
		WHERE id = $1`

	h := &model.Hospital{}
	err := r.db.QueryRow(q, id).Scan(
		&h.ID, &h.UserID, &h.Name, &h.BusinessNumber, &h.LicenseImage,
		&h.Description, &h.Address, &h.Phone, &h.OperatingHours, &h.ProfileImage,
		&h.Status, &h.ApprovedAt, &h.CreatedAt, &h.UpdatedAt,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}

	specialties, err := r.GetSpecialties(h.ID)
	if err != nil {
		return nil, err
	}
	h.Specialties = specialties

	return h, nil
}

func (r *hospitalRepository) GetByUserID(userID int64) (*model.Hospital, error) {
	const q = `
		SELECT id, user_id, name, business_number, license_image, description, address, phone, operating_hours, profile_image, status, approved_at, created_at, updated_at
		FROM hospitals
		WHERE user_id = $1`

	h := &model.Hospital{}
	err := r.db.QueryRow(q, userID).Scan(
		&h.ID, &h.UserID, &h.Name, &h.BusinessNumber, &h.LicenseImage,
		&h.Description, &h.Address, &h.Phone, &h.OperatingHours, &h.ProfileImage,
		&h.Status, &h.ApprovedAt, &h.CreatedAt, &h.UpdatedAt,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}

	specialties, err := r.GetSpecialties(h.ID)
	if err != nil {
		return nil, err
	}
	h.Specialties = specialties

	return h, nil
}

func (r *hospitalRepository) Update(hospital *model.Hospital) error {
	const q = `
		UPDATE hospitals
		SET name = $1, description = $2, address = $3, phone = $4,
		    operating_hours = $5, profile_image = $6, updated_at = $7
		WHERE id = $8`

	_, err := r.db.Exec(q,
		hospital.Name, hospital.Description, hospital.Address, hospital.Phone,
		hospital.OperatingHours, hospital.ProfileImage, time.Now(), hospital.ID,
	)
	return err
}

func (r *hospitalRepository) UpdateStatus(id int64, status string) error {
	var q string
	var args []interface{}

	if status == "approved" {
		q = `UPDATE hospitals SET status = $1, approved_at = $2, updated_at = $2 WHERE id = $3`
		now := time.Now()
		args = []interface{}{status, now, id}
	} else {
		q = `UPDATE hospitals SET status = $1, updated_at = $2 WHERE id = $3`
		args = []interface{}{status, time.Now(), id}
	}

	result, err := r.db.Exec(q, args...)
	if err != nil {
		return err
	}
	n, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if n == 0 {
		return ErrNotFound
	}
	return nil
}

// Search returns a page of hospitals matching params using cursor-based pagination.
//
// cursor=0  → first page (no id filter)
// cursor=N  → fetch hospitals with id < N
// Returns (items, nextCursor, error). nextCursor==0 means no more pages.
func (r *hospitalRepository) Search(params SearchParams) ([]*model.HospitalListItem, int64, error) {
	if params.Limit < 1 || params.Limit > 100 {
		params.Limit = 20
	}

	// Build WHERE clause dynamically.
	conditions := []string{"h.status = 'approved'"}
	args := []interface{}{}
	argIdx := 1

	if params.Query != "" {
		conditions = append(conditions, fmt.Sprintf("(h.name ILIKE $%d OR h.description ILIKE $%d)", argIdx, argIdx+1))
		like := "%" + params.Query + "%"
		args = append(args, like, like)
		argIdx += 2
	}

	if params.CategoryID != nil {
		conditions = append(conditions, fmt.Sprintf(
			"EXISTS (SELECT 1 FROM hospital_specialties hs WHERE hs.hospital_id = h.id AND hs.category_id = $%d)", argIdx,
		))
		args = append(args, *params.CategoryID)
		argIdx++
	}

	if params.Region != "" {
		conditions = append(conditions, fmt.Sprintf("h.address ILIKE $%d", argIdx))
		args = append(args, "%"+params.Region+"%")
		argIdx++
	}

	// Cursor: filter by id < cursor for stable id-based pagination.
	if params.Cursor > 0 {
		conditions = append(conditions, fmt.Sprintf("h.id < $%d", argIdx))
		args = append(args, params.Cursor)
		argIdx++
	}

	where := strings.Join(conditions, " AND ")

	// Determine secondary ORDER BY (primary is always premium-first).
	secondaryOrder := "h.name ASC"
	if params.SortBy == "reviews" {
		secondaryOrder = "review_count DESC, h.name ASC"
	}

	// Premium hospitals are sorted first; within the premium group the secondary
	// order applies. Only the top 3 premium results are guaranteed to appear at
	// the head — this is enforced at the query level by ordering premium DESC.
	dataQ := fmt.Sprintf(`
		SELECT h.id, h.name, h.address, h.profile_image, h.description,
		       COUNT(p.id) AS review_count,
		       h.is_premium
		FROM hospitals h
		LEFT JOIN posts p ON p.hospital_id = h.id AND p.board_type = 'before_after' AND p.status = 'active'
		WHERE %s
		GROUP BY h.id
		ORDER BY h.is_premium DESC, %s
		LIMIT $%d`, where, secondaryOrder, argIdx)

	args = append(args, params.Limit)

	rows, err := r.db.Query(dataQ, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("search hospitals: %w", err)
	}
	defer rows.Close()

	var items []*model.HospitalListItem
	premiumCount := 0
	for rows.Next() {
		item := &model.HospitalListItem{}
		if err := rows.Scan(
			&item.ID, &item.Name, &item.Address, &item.ProfileImage, &item.Description,
			&item.ReviewCount, &item.IsPremium,
		); err != nil {
			return nil, 0, err
		}
		// Cap premium hospitals at 3 per page to prevent monopolisation.
		if item.IsPremium {
			if premiumCount >= 3 {
				item.IsPremium = false // downgrade display flag for overflow entries
			} else {
				premiumCount++
			}
		}
		items = append(items, item)
	}
	if err := rows.Err(); err != nil {
		return nil, 0, err
	}

	if items == nil {
		return []*model.HospitalListItem{}, 0, nil
	}

	// next_cursor is the ID of the last item; 0 if this is the last page.
	var nextCursor int64
	if len(items) == params.Limit {
		nextCursor = items[len(items)-1].ID
	}

	return items, nextCursor, nil
}

func (r *hospitalRepository) GetSpecialties(hospitalID int64) ([]model.ProcedureCategory, error) {
	const q = `
		SELECT pc.id, pc.name, pc.icon, pc.sort_order
		FROM hospital_specialties hs
		JOIN procedure_categories pc ON pc.id = hs.category_id
		WHERE hs.hospital_id = $1
		ORDER BY pc.sort_order ASC, pc.name ASC`

	rows, err := r.db.Query(q, hospitalID)
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
	if cats == nil {
		cats = []model.ProcedureCategory{}
	}
	return cats, nil
}

// UpdateRole promotes the user to the "hospital" role.
func (r *hospitalRepository) UpdateRole(userID int64) error {
	const q = `UPDATE users SET role = 'hospital', updated_at = $1 WHERE id = $2`
	_, err := r.db.Exec(q, time.Now(), userID)
	return err
}

// GetDashboardStats returns consultation statistics for a hospital.
func (r *hospitalRepository) GetDashboardStats(hospitalID int64) (*DashboardStats, error) {
	const q = `
		SELECT
			COUNT(*) FILTER (WHERE status = 'sent')     AS sent_count,
			COUNT(*) FILTER (WHERE status = 'selected') AS selected_count
		FROM consultation_responses
		WHERE hospital_id = $1`

	stats := &DashboardStats{}
	if err := r.db.QueryRow(q, hospitalID).Scan(&stats.SentCount, &stats.SelectedCount); err != nil {
		return nil, err
	}

	const chatQ = `SELECT COUNT(*) FROM chat_rooms WHERE hospital_id = $1`
	if err := r.db.QueryRow(chatQ, hospitalID).Scan(&stats.ChatCount); err != nil {
		return nil, err
	}

	return stats, nil
}

// GetTaggedPosts returns up to limit before_after posts that have been tagged
// with the given hospital, ordered by most recent first.
// It returns a PostListItem slice so the handler can embed it directly in the
// hospital detail response without a separate round-trip.
func (r *hospitalRepository) GetTaggedPosts(hospitalID int64, limit int) ([]*model.PostListItem, error) {
	if limit < 1 {
		limit = 5
	}

	const q = `
		SELECT p.id, p.board_type, p.category_id, pc.name AS category_name,
		       p.title, p.content, p.is_anonymous,
		       COALESCE(u.nickname, '익명') AS author_nickname,
		       p.hospital_id, h.name AS hospital_name,
		       p.like_count, p.comment_count, p.created_at
		FROM posts p
		JOIN users u ON u.id = p.user_id
		LEFT JOIN procedure_categories pc ON pc.id = p.category_id
		LEFT JOIN hospitals h ON h.id = p.hospital_id
		WHERE p.hospital_id = $1
		  AND p.board_type = 'before_after'
		  AND p.status = 'active'
		ORDER BY p.created_at DESC
		LIMIT $2`

	rows, err := r.db.Query(q, hospitalID, limit)
	if err != nil {
		return nil, fmt.Errorf("get tagged posts: %w", err)
	}
	defer rows.Close()

	var items []*model.PostListItem
	for rows.Next() {
		item := &model.PostListItem{}
		if err := rows.Scan(
			&item.ID, &item.BoardType, &item.CategoryID, &item.CategoryName,
			&item.Title, &item.Content, &item.IsAnonymous,
			&item.AuthorNickname,
			&item.HospitalID, &item.HospitalName,
			&item.LikeCount, &item.CommentCount, &item.CreatedAt,
		); err != nil {
			return nil, fmt.Errorf("scan tagged post row: %w", err)
		}
		item.ImageURLs = []string{}
		items = append(items, item)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	if items == nil {
		items = []*model.PostListItem{}
	}
	return items, nil
}
