package repository

import (
	"database/sql"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/letmein/server/internal/model"
)

// ErrResponseSlotFull is returned when a consultation already has 5 active responses.
var ErrResponseSlotFull = errors.New("consultation already has the maximum number of responses")

// ErrAlreadyResponded is returned when the hospital already responded to this request.
var ErrAlreadyResponded = errors.New("hospital already responded to this consultation request")

// ConsultationRepository defines all persistence operations for the auction module.
type ConsultationRepository interface {
	// Request operations
	CreateRequest(req *model.ConsultationRequest, detailIDs []int) (*model.ConsultationRequest, error)
	GetRequestByID(id int64) (*model.ConsultationRequestWithDetails, error)
	GetRequestsByUser(userID int64, status string, page, limit int) ([]*model.ConsultationRequestWithDetails, int, error)
	GetActiveRequestsForHospital(hospitalID int64, categoryIDs []int, page, limit int) ([]*model.ConsultationRequestWithDetails, int, error)
	CancelRequest(requestID, userID int64) error
	ExpireRequests() (int64, error)

	// Image operations
	AttachImages(requestID int64, imageIDs []int64) error

	// Scheduler operations
	GetUnmatchedRequestsOlderThan(threshold time.Time) ([]*model.ConsultationRequest, error)
	MarkEscalated(requestID int64) error

	// Response operations
	CreateResponse(resp *model.ConsultationResponse) (*model.ConsultationResponse, error)
	GetResponsesByRequest(requestID int64) ([]model.ConsultationResponse, error)
	GetResponseCountForRequest(requestID int64) (int, error)
	SelectResponse(requestID, responseID int64) error
}

type consultationRepository struct {
	db *sql.DB
}

// NewConsultationRepository constructs a ConsultationRepository backed by PostgreSQL.
func NewConsultationRepository(db *sql.DB) ConsultationRepository {
	return &consultationRepository{db: db}
}

// ---------------------------------------------------------------------------
// Request operations
// ---------------------------------------------------------------------------

func (r *consultationRepository) CreateRequest(req *model.ConsultationRequest, detailIDs []int) (*model.ConsultationRequest, error) {
	tx, err := r.db.Begin()
	if err != nil {
		return nil, fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback() //nolint:errcheck

	const q = `
		INSERT INTO consultation_requests (user_id, category_id, description, preferred_period, photo_public, status, expires_at)
		VALUES ($1, $2, $3, $4, $5, 'active', $6)
		RETURNING id, user_id, category_id, description, preferred_period, photo_public, status, expires_at, created_at`

	created := &model.ConsultationRequest{}
	err = tx.QueryRow(q,
		req.UserID,
		req.CategoryID,
		req.Description,
		req.PreferredPeriod,
		req.PhotoPublic,
		req.ExpiresAt,
	).Scan(
		&created.ID, &created.UserID, &created.CategoryID, &created.Description,
		&created.PreferredPeriod, &created.PhotoPublic, &created.Status,
		&created.ExpiresAt, &created.CreatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("insert consultation request: %w", err)
	}

	if len(detailIDs) > 0 {
		if err := insertRequestDetails(tx, created.ID, detailIDs); err != nil {
			return nil, err
		}
	}

	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("commit tx: %w", err)
	}
	return created, nil
}

func insertRequestDetails(tx *sql.Tx, requestID int64, detailIDs []int) error {
	for _, did := range detailIDs {
		const q = `INSERT INTO consultation_request_details (request_id, detail_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`
		if _, err := tx.Exec(q, requestID, did); err != nil {
			return fmt.Errorf("insert request detail (detail %d): %w", did, err)
		}
	}
	return nil
}

func (r *consultationRepository) GetRequestByID(id int64) (*model.ConsultationRequestWithDetails, error) {
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
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get request by id: %w", err)
	}

	details, err := r.loadDetails(id)
	if err != nil {
		return nil, err
	}
	item.Details = details

	images, err := r.loadImages(id)
	if err != nil {
		return nil, err
	}
	item.Images = images

	responses, err := r.GetResponsesByRequest(id)
	if err != nil {
		return nil, err
	}
	item.Responses = responses
	item.ResponseCount = len(responses)

	return item, nil
}

func (r *consultationRepository) GetRequestsByUser(userID int64, status string, page, limit int) ([]*model.ConsultationRequestWithDetails, int, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	args := []interface{}{userID}
	argIdx := 2
	whereExtra := ""

	if status != "" {
		whereExtra = fmt.Sprintf(" AND cr.status = $%d", argIdx)
		args = append(args, status)
		argIdx++
	}

	countQ := fmt.Sprintf(`SELECT COUNT(*) FROM consultation_requests cr WHERE cr.user_id = $1%s`, whereExtra)
	var total int
	if err := r.db.QueryRow(countQ, args...).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("count user requests: %w", err)
	}

	offset := (page - 1) * limit
	dataQ := fmt.Sprintf(`
		SELECT cr.id, cr.user_id, cr.category_id, pc.name, cr.description, cr.preferred_period,
		       cr.photo_public, cr.status, cr.expires_at, cr.created_at
		FROM consultation_requests cr
		JOIN procedure_categories pc ON pc.id = cr.category_id
		WHERE cr.user_id = $1%s
		ORDER BY cr.created_at DESC
		LIMIT $%d OFFSET $%d`, whereExtra, argIdx, argIdx+1)

	args = append(args, limit, offset)
	rows, err := r.db.Query(dataQ, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("query user requests: %w", err)
	}
	defer rows.Close()

	items, err := scanRequestRows(rows)
	if err != nil {
		return nil, 0, err
	}

	if err := r.enrichRequests(items, false); err != nil {
		return nil, 0, err
	}

	return items, total, nil
}

func (r *consultationRepository) GetActiveRequestsForHospital(hospitalID int64, categoryIDs []int, page, limit int) ([]*model.ConsultationRequestWithDetails, int, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	if len(categoryIDs) == 0 {
		return []*model.ConsultationRequestWithDetails{}, 0, nil
	}

	// Build IN clause placeholders for categoryIDs
	inPlaceholders := make([]string, len(categoryIDs))
	args := []interface{}{}
	for i, catID := range categoryIDs {
		inPlaceholders[i] = fmt.Sprintf("$%d", i+1)
		args = append(args, catID)
	}
	inClause := strings.Join(inPlaceholders, ", ")
	hospitalArg := len(categoryIDs) + 1
	args = append(args, hospitalID)

	countQ := fmt.Sprintf(`
		SELECT COUNT(*)
		FROM consultation_requests cr
		WHERE cr.category_id IN (%s)
		  AND cr.status = 'active'
		  AND cr.expires_at > NOW()
		  AND NOT EXISTS (
		      SELECT 1 FROM consultation_responses res
		      WHERE res.request_id = cr.id
		        AND res.hospital_id = $%d
		  )`, inClause, hospitalArg)

	var total int
	if err := r.db.QueryRow(countQ, args...).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("count hospital requests: %w", err)
	}

	limitArg := hospitalArg + 1
	offsetArg := hospitalArg + 2
	args = append(args, limit, (page-1)*limit)

	dataQ := fmt.Sprintf(`
		SELECT cr.id, cr.user_id, cr.category_id, pc.name, cr.description, cr.preferred_period,
		       cr.photo_public, cr.status, cr.expires_at, cr.created_at
		FROM consultation_requests cr
		JOIN procedure_categories pc ON pc.id = cr.category_id
		WHERE cr.category_id IN (%s)
		  AND cr.status = 'active'
		  AND cr.expires_at > NOW()
		  AND NOT EXISTS (
		      SELECT 1 FROM consultation_responses res
		      WHERE res.request_id = cr.id
		        AND res.hospital_id = $%d
		  )
		ORDER BY cr.created_at DESC
		LIMIT $%d OFFSET $%d`, inClause, hospitalArg, limitArg, offsetArg)

	rows, err := r.db.Query(dataQ, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("query hospital requests: %w", err)
	}
	defer rows.Close()

	items, err := scanRequestRows(rows)
	if err != nil {
		return nil, 0, err
	}

	// Enrich details (no images — visibility depends on photo_public, handled by caller)
	if err := r.enrichRequests(items, false); err != nil {
		return nil, 0, err
	}

	return items, total, nil
}

func (r *consultationRepository) CancelRequest(requestID, userID int64) error {
	const q = `UPDATE consultation_requests SET status = 'cancelled' WHERE id = $1 AND user_id = $2 AND status = 'active'`
	result, err := r.db.Exec(q, requestID, userID)
	if err != nil {
		return fmt.Errorf("cancel request: %w", err)
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

// AttachImages sets entity_type = 'consultation' and entity_id = requestID for
// each image in imageIDs. Only images owned by any uploader are updated; if an
// imageID does not exist the update is silently skipped (no error).
func (r *consultationRepository) AttachImages(requestID int64, imageIDs []int64) error {
	if len(imageIDs) == 0 {
		return nil
	}

	// Build placeholder list: $2, $3, ...
	placeholders := make([]string, len(imageIDs))
	args := make([]interface{}, 0, len(imageIDs)+2)
	args = append(args, requestID, "consultation")
	for i, id := range imageIDs {
		placeholders[i] = fmt.Sprintf("$%d", i+3)
		args = append(args, id)
	}

	q := fmt.Sprintf(`
		UPDATE images
		SET entity_type = $2, entity_id = $1
		WHERE id IN (%s)`, strings.Join(placeholders, ", "))

	if _, err := r.db.Exec(q, args...); err != nil {
		return fmt.Errorf("attach images to consultation: %w", err)
	}
	return nil
}

func (r *consultationRepository) ExpireRequests() (int64, error) {
	const q = `UPDATE consultation_requests SET status = 'expired' WHERE expires_at < NOW() AND status = 'active'`
	result, err := r.db.Exec(q)
	if err != nil {
		return 0, fmt.Errorf("expire requests: %w", err)
	}
	n, err := result.RowsAffected()
	if err != nil {
		return 0, err
	}
	return n, nil
}

// GetUnmatchedRequestsOlderThan returns active requests with no coordinator assigned
// that were created before the given threshold and have not yet been escalated.
func (r *consultationRepository) GetUnmatchedRequestsOlderThan(threshold time.Time) ([]*model.ConsultationRequest, error) {
	const q = `
		SELECT id, user_id, category_id, description, preferred_period, photo_public, status, expires_at, created_at
		FROM consultation_requests
		WHERE status = 'active'
		  AND coordinator_id IS NULL
		  AND created_at < $1
		  AND escalated_at IS NULL`

	rows, err := r.db.Query(q, threshold)
	if err != nil {
		return nil, fmt.Errorf("get unmatched requests: %w", err)
	}
	defer rows.Close()

	var reqs []*model.ConsultationRequest
	for rows.Next() {
		req := &model.ConsultationRequest{}
		if err := rows.Scan(
			&req.ID, &req.UserID, &req.CategoryID, &req.Description,
			&req.PreferredPeriod, &req.PhotoPublic, &req.Status,
			&req.ExpiresAt, &req.CreatedAt,
		); err != nil {
			return nil, fmt.Errorf("scan unmatched request: %w", err)
		}
		reqs = append(reqs, req)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return reqs, nil
}

// MarkEscalated sets escalated_at = NOW() for the given request.
func (r *consultationRepository) MarkEscalated(requestID int64) error {
	const q = `UPDATE consultation_requests SET escalated_at = NOW() WHERE id = $1`
	if _, err := r.db.Exec(q, requestID); err != nil {
		return fmt.Errorf("mark escalated %d: %w", requestID, err)
	}
	return nil
}

// ---------------------------------------------------------------------------
// Response operations
// ---------------------------------------------------------------------------

func (r *consultationRepository) CreateResponse(resp *model.ConsultationResponse) (*model.ConsultationResponse, error) {
	// Check 5-slot limit (count active responses).
	count, err := r.GetResponseCountForRequest(resp.RequestID)
	if err != nil {
		return nil, err
	}
	if count >= 5 {
		return nil, ErrResponseSlotFull
	}

	const q = `
		INSERT INTO consultation_responses (request_id, hospital_id, intro, experience, message, consult_methods, consult_hours, status)
		VALUES ($1, $2, $3, $4, $5, $6, $7, 'sent')
		RETURNING id, request_id, hospital_id, intro, experience, message, consult_methods, consult_hours, status, created_at`

	created := &model.ConsultationResponse{}
	err = r.db.QueryRow(q,
		resp.RequestID, resp.HospitalID, resp.Intro, resp.Experience,
		resp.Message, resp.ConsultMethods, resp.ConsultHours,
	).Scan(
		&created.ID, &created.RequestID, &created.HospitalID, &created.Intro, &created.Experience,
		&created.Message, &created.ConsultMethods, &created.ConsultHours, &created.Status, &created.CreatedAt,
	)
	if err != nil {
		// Detect unique constraint violation (hospital already responded).
		if strings.Contains(err.Error(), "unique") || strings.Contains(err.Error(), "duplicate") {
			return nil, ErrAlreadyResponded
		}
		return nil, fmt.Errorf("insert consultation response: %w", err)
	}
	return created, nil
}

func (r *consultationRepository) GetResponsesByRequest(requestID int64) ([]model.ConsultationResponse, error) {
	const q = `
		SELECT cr.id, cr.request_id, cr.hospital_id, cr.intro, cr.experience, cr.message,
		       cr.consult_methods, cr.consult_hours, cr.status, cr.created_at,
		       h.name, h.profile_image, h.address
		FROM consultation_responses cr
		JOIN hospitals h ON h.id = cr.hospital_id
		WHERE cr.request_id = $1
		ORDER BY cr.created_at ASC`

	rows, err := r.db.Query(q, requestID)
	if err != nil {
		return nil, fmt.Errorf("get responses by request: %w", err)
	}
	defer rows.Close()

	var responses []model.ConsultationResponse
	for rows.Next() {
		resp := model.ConsultationResponse{}
		if err := rows.Scan(
			&resp.ID, &resp.RequestID, &resp.HospitalID, &resp.Intro, &resp.Experience,
			&resp.Message, &resp.ConsultMethods, &resp.ConsultHours, &resp.Status, &resp.CreatedAt,
			&resp.HospitalName, &resp.HospitalProfileImage, &resp.HospitalAddress,
		); err != nil {
			return nil, fmt.Errorf("scan response row: %w", err)
		}
		responses = append(responses, resp)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	if responses == nil {
		responses = []model.ConsultationResponse{}
	}
	return responses, nil
}

func (r *consultationRepository) GetResponseCountForRequest(requestID int64) (int, error) {
	const q = `SELECT COUNT(*) FROM consultation_responses WHERE request_id = $1 AND status IN ('sent', 'selected')`
	var count int
	if err := r.db.QueryRow(q, requestID).Scan(&count); err != nil {
		return 0, fmt.Errorf("count responses: %w", err)
	}
	return count, nil
}

func (r *consultationRepository) SelectResponse(requestID, responseID int64) error {
	tx, err := r.db.Begin()
	if err != nil {
		return fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback() //nolint:errcheck

	// Mark the chosen response as selected.
	const selectQ = `UPDATE consultation_responses SET status = 'selected' WHERE id = $1 AND request_id = $2 AND status = 'sent'`
	result, err := tx.Exec(selectQ, responseID, requestID)
	if err != nil {
		return fmt.Errorf("select response: %w", err)
	}
	n, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if n == 0 {
		return ErrNotFound
	}

	// Reject all other sent responses for this request.
	const rejectQ = `UPDATE consultation_responses SET status = 'rejected' WHERE request_id = $1 AND id != $2 AND status = 'sent'`
	if _, err := tx.Exec(rejectQ, requestID, responseID); err != nil {
		return fmt.Errorf("reject other responses: %w", err)
	}

	// Mark the request as completed.
	const completeQ = `UPDATE consultation_requests SET status = 'completed' WHERE id = $1`
	if _, err := tx.Exec(completeQ, requestID); err != nil {
		return fmt.Errorf("complete request: %w", err)
	}

	return tx.Commit()
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

func scanRequestRows(rows *sql.Rows) ([]*model.ConsultationRequestWithDetails, error) {
	var items []*model.ConsultationRequestWithDetails
	for rows.Next() {
		item := &model.ConsultationRequestWithDetails{}
		if err := rows.Scan(
			&item.ID, &item.UserID, &item.CategoryID, &item.CategoryName, &item.Description,
			&item.PreferredPeriod, &item.PhotoPublic, &item.Status, &item.ExpiresAt, &item.CreatedAt,
		); err != nil {
			return nil, fmt.Errorf("scan request row: %w", err)
		}
		items = append(items, item)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	if items == nil {
		items = []*model.ConsultationRequestWithDetails{}
	}
	return items, nil
}

// enrichRequests loads details (and optionally images) for a batch of requests
// using batch queries to avoid N+1.
func (r *consultationRepository) enrichRequests(items []*model.ConsultationRequestWithDetails, includeImages bool) error {
	if len(items) == 0 {
		return nil
	}

	// Collect IDs.
	ids := make([]int64, len(items))
	idxByID := make(map[int64]int, len(items))
	for i, item := range items {
		ids[i] = item.ID
		idxByID[item.ID] = i
		item.Details = []model.ProcedureDetail{}
		item.ResponseCount = 0
	}

	// Batch-load procedure details.
	placeholders := make([]string, len(ids))
	detailArgs := make([]interface{}, len(ids))
	for i, id := range ids {
		placeholders[i] = fmt.Sprintf("$%d", i+1)
		detailArgs[i] = id
	}
	detailQ := fmt.Sprintf(`
		SELECT crd.request_id, pd.id, pd.category_id, pd.name, pd.sort_order
		FROM consultation_request_details crd
		JOIN procedure_details pd ON pd.id = crd.detail_id
		WHERE crd.request_id IN (%s)
		ORDER BY pd.sort_order ASC`, strings.Join(placeholders, ", "))

	detailRows, err := r.db.Query(detailQ, detailArgs...)
	if err != nil {
		return fmt.Errorf("batch load details: %w", err)
	}
	defer detailRows.Close()

	for detailRows.Next() {
		var reqID int64
		d := model.ProcedureDetail{}
		if err := detailRows.Scan(&reqID, &d.ID, &d.CategoryID, &d.Name, &d.SortOrder); err != nil {
			return fmt.Errorf("scan detail row: %w", err)
		}
		if idx, ok := idxByID[reqID]; ok {
			items[idx].Details = append(items[idx].Details, d)
		}
	}
	if err := detailRows.Err(); err != nil {
		return err
	}

	// Batch-load response counts.
	countQ := fmt.Sprintf(`
		SELECT request_id, COUNT(*)
		FROM consultation_responses
		WHERE request_id IN (%s)
		  AND status IN ('sent', 'selected')
		GROUP BY request_id`, strings.Join(placeholders, ", "))

	countRows, err := r.db.Query(countQ, detailArgs...)
	if err != nil {
		return fmt.Errorf("batch load response counts: %w", err)
	}
	defer countRows.Close()

	for countRows.Next() {
		var reqID int64
		var cnt int
		if err := countRows.Scan(&reqID, &cnt); err != nil {
			return fmt.Errorf("scan count row: %w", err)
		}
		if idx, ok := idxByID[reqID]; ok {
			items[idx].ResponseCount = cnt
		}
	}
	if err := countRows.Err(); err != nil {
		return err
	}

	// Optionally batch-load images.
	if includeImages {
		imgQ := fmt.Sprintf(`
			SELECT entity_id, id, uploader_id, bucket, original_path, thumb_path, medium_path, full_path, content_type, size_bytes, entity_type, created_at
			FROM images
			WHERE entity_type = 'consultation' AND entity_id IN (%s)
			ORDER BY created_at ASC`, strings.Join(placeholders, ", "))

		imgRows, err := r.db.Query(imgQ, detailArgs...)
		if err != nil {
			return fmt.Errorf("batch load images: %w", err)
		}
		defer imgRows.Close()

		for imgRows.Next() {
			var entityID int64
			img := &model.Image{}
			if err := imgRows.Scan(
				&entityID,
				&img.ID, &img.UploaderID, &img.Bucket, &img.OriginalPath,
				&img.ThumbPath, &img.MediumPath, &img.FullPath, &img.ContentType,
				&img.SizeBytes, &img.EntityType, &img.CreatedAt,
			); err != nil {
				return fmt.Errorf("scan image row: %w", err)
			}
			img.EntityID = &entityID
			if idx, ok := idxByID[entityID]; ok {
				items[idx].Images = append(items[idx].Images, img)
			}
		}
		if err := imgRows.Err(); err != nil {
			return err
		}
	}

	return nil
}

// loadDetails fetches procedure details for a single request.
func (r *consultationRepository) loadDetails(requestID int64) ([]model.ProcedureDetail, error) {
	const q = `
		SELECT pd.id, pd.category_id, pd.name, pd.sort_order
		FROM consultation_request_details crd
		JOIN procedure_details pd ON pd.id = crd.detail_id
		WHERE crd.request_id = $1
		ORDER BY pd.sort_order ASC`

	rows, err := r.db.Query(q, requestID)
	if err != nil {
		return nil, fmt.Errorf("load details: %w", err)
	}
	defer rows.Close()

	var details []model.ProcedureDetail
	for rows.Next() {
		d := model.ProcedureDetail{}
		if err := rows.Scan(&d.ID, &d.CategoryID, &d.Name, &d.SortOrder); err != nil {
			return nil, fmt.Errorf("scan detail: %w", err)
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

// loadImages fetches images for a single consultation request.
func (r *consultationRepository) loadImages(requestID int64) ([]*model.Image, error) {
	const q = `
		SELECT id, uploader_id, bucket, original_path, thumb_path, medium_path, full_path, content_type, size_bytes, entity_type, entity_id, created_at
		FROM images
		WHERE entity_type = 'consultation' AND entity_id = $1
		ORDER BY created_at ASC`

	rows, err := r.db.Query(q, requestID)
	if err != nil {
		return nil, fmt.Errorf("load images: %w", err)
	}
	defer rows.Close()

	var images []*model.Image
	for rows.Next() {
		img := &model.Image{}
		if err := rows.Scan(
			&img.ID, &img.UploaderID, &img.Bucket, &img.OriginalPath,
			&img.ThumbPath, &img.MediumPath, &img.FullPath, &img.ContentType,
			&img.SizeBytes, &img.EntityType, &img.EntityID, &img.CreatedAt,
		); err != nil {
			return nil, fmt.Errorf("scan image: %w", err)
		}
		images = append(images, img)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return images, nil
}

