package repository

import (
	"database/sql"
	"fmt"
	"time"

	"github.com/letmein/server/internal/model"
)

// AdminDashboardStats holds top-level KPI counts for the admin dashboard.
type AdminDashboardStats struct {
	TotalUsers          int `json:"total_users"`
	TotalHospitals      int `json:"total_hospitals"`
	PendingHospitals    int `json:"pending_hospitals"`
	TodayConsultations  int `json:"today_consultations"`
	PendingReports      int `json:"pending_reports"`
}

// ActivityItem represents a single event in the recent-activity feed.
type ActivityItem struct {
	Type      string    `json:"type"`
	Message   string    `json:"message"`
	Timestamp time.Time `json:"timestamp"`
}

// DateCount is a (date, count) pair used in chart data.
type DateCount struct {
	Date  string `json:"date"`
	Count int    `json:"count"`
}

// ChartData holds time-series data for the dashboard chart.
type ChartData struct {
	UserSignups   []DateCount `json:"user_signups"`
	Consultations []DateCount `json:"consultations"`
}

// AdminConsultationItem is a lightweight row used in the admin consultation list.
type AdminConsultationItem struct {
	ID           int64     `json:"id"`
	UserID       int64     `json:"user_id"`
	UserNickname *string   `json:"user_nickname"`
	CategoryID   int       `json:"category_id"`
	CategoryName string    `json:"category_name"`
	Description  string    `json:"description"`
	Status       string    `json:"status"`
	ExpiresAt    time.Time `json:"expires_at"`
	CreatedAt    time.Time `json:"created_at"`
}

// AdminRepository defines all persistence operations needed by admin handlers.
type AdminRepository interface {
	DashboardStats() (*AdminDashboardStats, error)
	RecentActivity(limit int) ([]ActivityItem, error)
	ChartData(days int) (*ChartData, error)

	ListAllHospitals(status string, page, limit int) ([]*model.Hospital, int, error)
	ApproveHospital(id int64) error
	RejectHospital(id int64) error

	ListAllConsultations(status string, page, limit int) ([]*AdminConsultationItem, int, error)
	GetConsultationAdmin(id int64) (*model.ConsultationRequestWithDetails, error)

	CreateCategory(name, icon string, sortOrder int) (*model.ProcedureCategory, error)
	UpdateCategory(id int, name, icon string, sortOrder int) (*model.ProcedureCategory, error)
	DeleteCategory(id int) error

	CreateProcedureDetail(categoryID int, name string, sortOrder int) (*model.ProcedureDetail, error)
	UpdateProcedureDetail(id int, name string, sortOrder int) (*model.ProcedureDetail, error)
	DeleteProcedureDetail(id int) error
}

type adminRepository struct {
	db *sql.DB
}

func NewAdminRepository(db *sql.DB) AdminRepository {
	return &adminRepository{db: db}
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

func (r *adminRepository) DashboardStats() (*AdminDashboardStats, error) {
	stats := &AdminDashboardStats{}

	const q = `
		SELECT
			(SELECT COUNT(*) FROM users WHERE status = 'active')                                  AS total_users,
			(SELECT COUNT(*) FROM hospitals WHERE status = 'approved')                            AS total_hospitals,
			(SELECT COUNT(*) FROM hospitals WHERE status = 'pending')                             AS pending_hospitals,
			(SELECT COUNT(*) FROM consultation_requests WHERE DATE(created_at) = CURRENT_DATE)    AS today_consultations,
			(SELECT COUNT(*) FROM reports WHERE status = 'pending')                               AS pending_reports`

	if err := r.db.QueryRow(q).Scan(
		&stats.TotalUsers,
		&stats.TotalHospitals,
		&stats.PendingHospitals,
		&stats.TodayConsultations,
		&stats.PendingReports,
	); err != nil {
		return nil, fmt.Errorf("dashboard stats: %w", err)
	}
	return stats, nil
}

func (r *adminRepository) RecentActivity(limit int) ([]ActivityItem, error) {
	if limit <= 0 {
		limit = 10
	}

	// Collect up to 3 recent events from each major table then merge.
	type rawRow struct {
		typ       string
		messageID int64
		name      *string
		ts        time.Time
	}

	var rows []rawRow

	// New users
	userRows, err := r.db.Query(
		`SELECT id, nickname, created_at FROM users ORDER BY created_at DESC LIMIT 3`)
	if err != nil {
		return nil, fmt.Errorf("activity users: %w", err)
	}
	defer userRows.Close()
	for userRows.Next() {
		var id int64
		var nick *string
		var ts time.Time
		if err := userRows.Scan(&id, &nick, &ts); err != nil {
			return nil, err
		}
		rows = append(rows, rawRow{typ: "new_user", messageID: id, name: nick, ts: ts})
	}
	if err := userRows.Err(); err != nil {
		return nil, err
	}

	// New hospitals
	hospRows, err := r.db.Query(
		`SELECT id, name, created_at FROM hospitals ORDER BY created_at DESC LIMIT 3`)
	if err != nil {
		return nil, fmt.Errorf("activity hospitals: %w", err)
	}
	defer hospRows.Close()
	for hospRows.Next() {
		var id int64
		var name string
		var ts time.Time
		if err := hospRows.Scan(&id, &name, &ts); err != nil {
			return nil, err
		}
		n := name
		rows = append(rows, rawRow{typ: "new_hospital", messageID: id, name: &n, ts: ts})
	}
	if err := hospRows.Err(); err != nil {
		return nil, err
	}

	// New consultation requests
	consultRows, err := r.db.Query(
		`SELECT id, created_at FROM consultation_requests ORDER BY created_at DESC LIMIT 3`)
	if err != nil {
		return nil, fmt.Errorf("activity consultations: %w", err)
	}
	defer consultRows.Close()
	for consultRows.Next() {
		var id int64
		var ts time.Time
		if err := consultRows.Scan(&id, &ts); err != nil {
			return nil, err
		}
		rows = append(rows, rawRow{typ: "new_consultation", messageID: id, name: nil, ts: ts})
	}
	if err := consultRows.Err(); err != nil {
		return nil, err
	}

	// New reports
	reportRows, err := r.db.Query(
		`SELECT id, created_at FROM reports ORDER BY created_at DESC LIMIT 3`)
	if err != nil {
		return nil, fmt.Errorf("activity reports: %w", err)
	}
	defer reportRows.Close()
	for reportRows.Next() {
		var id int64
		var ts time.Time
		if err := reportRows.Scan(&id, &ts); err != nil {
			return nil, err
		}
		rows = append(rows, rawRow{typ: "new_report", messageID: id, name: nil, ts: ts})
	}
	if err := reportRows.Err(); err != nil {
		return nil, err
	}

	// Sort by timestamp descending (insertion-sort is fine for ~12 items).
	for i := 1; i < len(rows); i++ {
		for j := i; j > 0 && rows[j].ts.After(rows[j-1].ts); j-- {
			rows[j], rows[j-1] = rows[j-1], rows[j]
		}
	}

	if len(rows) > limit {
		rows = rows[:limit]
	}

	items := make([]ActivityItem, 0, len(rows))
	for _, row := range rows {
		var msg string
		switch row.typ {
		case "new_user":
			nick := "익명"
			if row.name != nil {
				nick = *row.name
			}
			msg = fmt.Sprintf("새 사용자 가입: %s (ID %d)", nick, row.messageID)
		case "new_hospital":
			name := ""
			if row.name != nil {
				name = *row.name
			}
			msg = fmt.Sprintf("병원 등록 신청: %s (ID %d)", name, row.messageID)
		case "new_consultation":
			msg = fmt.Sprintf("새 상담 요청 (ID %d)", row.messageID)
		case "new_report":
			msg = fmt.Sprintf("새 신고 접수 (ID %d)", row.messageID)
		}
		items = append(items, ActivityItem{Type: row.typ, Message: msg, Timestamp: row.ts})
	}
	return items, nil
}

func (r *adminRepository) ChartData(days int) (*ChartData, error) {
	if days <= 0 {
		days = 7
	}

	userRows, err := r.db.Query(
		`SELECT DATE(created_at)::text AS d, COUNT(*) AS cnt
		 FROM users
		 WHERE created_at >= NOW() - ($1 || ' days')::interval
		 GROUP BY d
		 ORDER BY d ASC`,
		days,
	)
	if err != nil {
		return nil, fmt.Errorf("chart user signups: %w", err)
	}
	defer userRows.Close()

	userSignups := []DateCount{}
	for userRows.Next() {
		dc := DateCount{}
		if err := userRows.Scan(&dc.Date, &dc.Count); err != nil {
			return nil, err
		}
		userSignups = append(userSignups, dc)
	}
	if err := userRows.Err(); err != nil {
		return nil, err
	}

	consultRows, err := r.db.Query(
		`SELECT DATE(created_at)::text AS d, COUNT(*) AS cnt
		 FROM consultation_requests
		 WHERE created_at >= NOW() - ($1 || ' days')::interval
		 GROUP BY d
		 ORDER BY d ASC`,
		days,
	)
	if err != nil {
		return nil, fmt.Errorf("chart consultations: %w", err)
	}
	defer consultRows.Close()

	consultations := []DateCount{}
	for consultRows.Next() {
		dc := DateCount{}
		if err := consultRows.Scan(&dc.Date, &dc.Count); err != nil {
			return nil, err
		}
		consultations = append(consultations, dc)
	}
	if err := consultRows.Err(); err != nil {
		return nil, err
	}

	return &ChartData{UserSignups: userSignups, Consultations: consultations}, nil
}

// ---------------------------------------------------------------------------
// Hospitals
// ---------------------------------------------------------------------------

func (r *adminRepository) ListAllHospitals(status string, page, limit int) ([]*model.Hospital, int, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	args := []interface{}{}
	whereClause := ""
	argIdx := 1

	if status != "" {
		whereClause = fmt.Sprintf("WHERE status = $%d", argIdx)
		args = append(args, status)
		argIdx++
	}

	var total int
	countQ := fmt.Sprintf("SELECT COUNT(*) FROM hospitals %s", whereClause)
	if err := r.db.QueryRow(countQ, args...).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("count hospitals: %w", err)
	}

	offset := (page - 1) * limit
	dataQ := fmt.Sprintf(`
		SELECT id, user_id, name, business_number, license_image, description, address, phone, operating_hours, profile_image, status, approved_at, created_at, updated_at
		FROM hospitals
		%s
		ORDER BY created_at DESC
		LIMIT $%d OFFSET $%d`, whereClause, argIdx, argIdx+1)

	args = append(args, limit, offset)

	rows, err := r.db.Query(dataQ, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("list hospitals: %w", err)
	}
	defer rows.Close()

	var hospitals []*model.Hospital
	for rows.Next() {
		h := &model.Hospital{}
		if err := rows.Scan(
			&h.ID, &h.UserID, &h.Name, &h.BusinessNumber, &h.LicenseImage,
			&h.Description, &h.Address, &h.Phone, &h.OperatingHours, &h.ProfileImage,
			&h.Status, &h.ApprovedAt, &h.CreatedAt, &h.UpdatedAt,
		); err != nil {
			return nil, 0, err
		}
		h.Specialties = []model.ProcedureCategory{}
		hospitals = append(hospitals, h)
	}
	if err := rows.Err(); err != nil {
		return nil, 0, err
	}
	if hospitals == nil {
		hospitals = []*model.Hospital{}
	}
	return hospitals, total, nil
}

func (r *adminRepository) ApproveHospital(id int64) error {
	const q = `UPDATE hospitals SET status = 'approved', approved_at = NOW(), updated_at = NOW() WHERE id = $1`
	result, err := r.db.Exec(q, id)
	if err != nil {
		return fmt.Errorf("approve hospital: %w", err)
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

func (r *adminRepository) RejectHospital(id int64) error {
	const q = `UPDATE hospitals SET status = 'rejected', updated_at = NOW() WHERE id = $1`
	result, err := r.db.Exec(q, id)
	if err != nil {
		return fmt.Errorf("reject hospital: %w", err)
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

// ---------------------------------------------------------------------------
// Consultations
// ---------------------------------------------------------------------------

func (r *adminRepository) ListAllConsultations(status string, page, limit int) ([]*AdminConsultationItem, int, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	args := []interface{}{}
	whereClause := ""
	argIdx := 1

	if status != "" {
		whereClause = fmt.Sprintf("WHERE cr.status = $%d", argIdx)
		args = append(args, status)
		argIdx++
	}

	var total int
	countQ := fmt.Sprintf(`SELECT COUNT(*) FROM consultation_requests cr %s`, whereClause)
	if err := r.db.QueryRow(countQ, args...).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("count consultations: %w", err)
	}

	offset := (page - 1) * limit
	dataQ := fmt.Sprintf(`
		SELECT cr.id, cr.user_id, u.nickname, cr.category_id, pc.name, cr.description, cr.status, cr.expires_at, cr.created_at
		FROM consultation_requests cr
		JOIN procedure_categories pc ON pc.id = cr.category_id
		JOIN users u ON u.id = cr.user_id
		%s
		ORDER BY cr.created_at DESC
		LIMIT $%d OFFSET $%d`, whereClause, argIdx, argIdx+1)

	args = append(args, limit, offset)

	rows, err := r.db.Query(dataQ, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("list consultations: %w", err)
	}
	defer rows.Close()

	var items []*AdminConsultationItem
	for rows.Next() {
		item := &AdminConsultationItem{}
		if err := rows.Scan(
			&item.ID, &item.UserID, &item.UserNickname,
			&item.CategoryID, &item.CategoryName,
			&item.Description, &item.Status, &item.ExpiresAt, &item.CreatedAt,
		); err != nil {
			return nil, 0, err
		}
		items = append(items, item)
	}
	if err := rows.Err(); err != nil {
		return nil, 0, err
	}
	if items == nil {
		items = []*AdminConsultationItem{}
	}
	return items, total, nil
}

func (r *adminRepository) GetConsultationAdmin(id int64) (*model.ConsultationRequestWithDetails, error) {
	const q = `
		SELECT cr.id, cr.user_id, cr.category_id, pc.name, cr.description, cr.preferred_period,
		       cr.photo_public, cr.status, cr.expires_at, cr.created_at
		FROM consultation_requests cr
		JOIN procedure_categories pc ON pc.id = cr.category_id
		WHERE cr.id = $1`

	item := &model.ConsultationRequestWithDetails{}
	err := r.db.QueryRow(q, id).Scan(
		&item.ID, &item.UserID, &item.CategoryID, &item.CategoryName, &item.Description,
		&item.PreferredPeriod, &item.PhotoPublic, &item.Status, &item.ExpiresAt, &item.CreatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get consultation admin: %w", err)
	}

	// Load procedure details
	detailRows, err := r.db.Query(`
		SELECT pd.id, pd.category_id, pd.name, pd.sort_order
		FROM consultation_request_details crd
		JOIN procedure_details pd ON pd.id = crd.detail_id
		WHERE crd.request_id = $1
		ORDER BY pd.sort_order ASC`, id)
	if err != nil {
		return nil, fmt.Errorf("load details: %w", err)
	}
	defer detailRows.Close()

	item.Details = []model.ProcedureDetail{}
	for detailRows.Next() {
		d := model.ProcedureDetail{}
		if err := detailRows.Scan(&d.ID, &d.CategoryID, &d.Name, &d.SortOrder); err != nil {
			return nil, err
		}
		item.Details = append(item.Details, d)
	}
	if err := detailRows.Err(); err != nil {
		return nil, err
	}

	// Load responses
	respRows, err := r.db.Query(`
		SELECT cr.id, cr.request_id, cr.hospital_id, cr.intro, cr.experience, cr.message,
		       cr.consult_methods, cr.consult_hours, cr.status, cr.created_at,
		       h.name, h.profile_image, h.address
		FROM consultation_responses cr
		JOIN hospitals h ON h.id = cr.hospital_id
		WHERE cr.request_id = $1
		ORDER BY cr.created_at ASC`, id)
	if err != nil {
		return nil, fmt.Errorf("load responses: %w", err)
	}
	defer respRows.Close()

	item.Responses = []model.ConsultationResponse{}
	for respRows.Next() {
		resp := model.ConsultationResponse{}
		if err := respRows.Scan(
			&resp.ID, &resp.RequestID, &resp.HospitalID, &resp.Intro, &resp.Experience,
			&resp.Message, &resp.ConsultMethods, &resp.ConsultHours, &resp.Status, &resp.CreatedAt,
			&resp.HospitalName, &resp.HospitalProfileImage, &resp.HospitalAddress,
		); err != nil {
			return nil, err
		}
		item.Responses = append(item.Responses, resp)
	}
	if err := respRows.Err(); err != nil {
		return nil, err
	}
	item.ResponseCount = len(item.Responses)

	return item, nil
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

func (r *adminRepository) CreateCategory(name, icon string, sortOrder int) (*model.ProcedureCategory, error) {
	const q = `
		INSERT INTO procedure_categories (name, icon, sort_order)
		VALUES ($1, $2, $3)
		RETURNING id, name, icon, sort_order`

	c := &model.ProcedureCategory{}
	if err := r.db.QueryRow(q, name, nullableString(icon), sortOrder).Scan(
		&c.ID, &c.Name, &c.Icon, &c.SortOrder,
	); err != nil {
		return nil, fmt.Errorf("create category: %w", err)
	}
	c.Details = []model.ProcedureDetail{}
	return c, nil
}

func (r *adminRepository) UpdateCategory(id int, name, icon string, sortOrder int) (*model.ProcedureCategory, error) {
	const q = `
		UPDATE procedure_categories
		SET name = $1, icon = $2, sort_order = $3
		WHERE id = $4
		RETURNING id, name, icon, sort_order`

	c := &model.ProcedureCategory{}
	err := r.db.QueryRow(q, name, nullableString(icon), sortOrder, id).Scan(
		&c.ID, &c.Name, &c.Icon, &c.SortOrder,
	)
	if err == sql.ErrNoRows {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("update category: %w", err)
	}
	c.Details = []model.ProcedureDetail{}
	return c, nil
}

func (r *adminRepository) DeleteCategory(id int) error {
	const q = `DELETE FROM procedure_categories WHERE id = $1`
	result, err := r.db.Exec(q, id)
	if err != nil {
		return fmt.Errorf("delete category: %w", err)
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

// ---------------------------------------------------------------------------
// Procedure details
// ---------------------------------------------------------------------------

func (r *adminRepository) CreateProcedureDetail(categoryID int, name string, sortOrder int) (*model.ProcedureDetail, error) {
	// Verify the category exists first.
	var exists bool
	if err := r.db.QueryRow(
		`SELECT EXISTS(SELECT 1 FROM procedure_categories WHERE id = $1)`, categoryID,
	).Scan(&exists); err != nil {
		return nil, fmt.Errorf("check category: %w", err)
	}
	if !exists {
		return nil, ErrNotFound
	}

	const q = `
		INSERT INTO procedure_details (category_id, name, sort_order)
		VALUES ($1, $2, $3)
		RETURNING id, category_id, name, sort_order`

	d := &model.ProcedureDetail{}
	if err := r.db.QueryRow(q, categoryID, name, sortOrder).Scan(
		&d.ID, &d.CategoryID, &d.Name, &d.SortOrder,
	); err != nil {
		return nil, fmt.Errorf("create procedure detail: %w", err)
	}
	return d, nil
}

func (r *adminRepository) UpdateProcedureDetail(id int, name string, sortOrder int) (*model.ProcedureDetail, error) {
	const q = `
		UPDATE procedure_details
		SET name = $1, sort_order = $2
		WHERE id = $3
		RETURNING id, category_id, name, sort_order`

	d := &model.ProcedureDetail{}
	err := r.db.QueryRow(q, name, sortOrder, id).Scan(
		&d.ID, &d.CategoryID, &d.Name, &d.SortOrder,
	)
	if err == sql.ErrNoRows {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("update procedure detail: %w", err)
	}
	return d, nil
}

func (r *adminRepository) DeleteProcedureDetail(id int) error {
	const q = `DELETE FROM procedure_details WHERE id = $1`
	result, err := r.db.Exec(q, id)
	if err != nil {
		return fmt.Errorf("delete procedure detail: %w", err)
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

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

// nullableString converts an empty string to nil so it is stored as NULL.
func nullableString(s string) interface{} {
	if s == "" {
		return nil
	}
	return s
}
