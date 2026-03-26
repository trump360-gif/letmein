package repository

import (
	"database/sql"
	"errors"
	"fmt"
	"strings"

	"github.com/letmein/server/internal/model"
)

// ErrAlreadyMatched is returned when a hospital is already matched to the same request.
var ErrAlreadyMatched = errors.New("hospital already matched to this consultation request")

// CoordinatorRepository defines all persistence operations for the coordinator matching module.
type CoordinatorRepository interface {
	CreateMatch(requestID, hospitalID, matchedBy int64, note string) (*model.CoordinatorMatch, error)
	GetMatchesByRequestID(requestID int64) ([]model.CoordinatorMatchWithHospital, error)
	UpdateMatchStatus(id int64, status string) error
	SetCoordinatorOnRequest(requestID, coordinatorID int64) error
	SetRequestStatusMatched(requestID int64) error
	GetChatRoomIDForMatch(requestID, hospitalID int64) (*int64, error)
}

type coordinatorRepository struct {
	db *sql.DB
}

// NewCoordinatorRepository constructs a CoordinatorRepository backed by PostgreSQL.
func NewCoordinatorRepository(db *sql.DB) CoordinatorRepository {
	return &coordinatorRepository{db: db}
}

// CreateMatch inserts a new coordinator_matches row and returns the created record.
func (r *coordinatorRepository) CreateMatch(requestID, hospitalID, matchedBy int64, note string) (*model.CoordinatorMatch, error) {
	const q = `
		INSERT INTO coordinator_matches (request_id, hospital_id, matched_by, note, status)
		VALUES ($1, $2, $3, NULLIF($4, ''), 'matched')
		RETURNING id, request_id, hospital_id, matched_by, note, status, created_at`

	m := &model.CoordinatorMatch{}
	err := r.db.QueryRow(q, requestID, hospitalID, matchedBy, note).Scan(
		&m.ID, &m.RequestID, &m.HospitalID, &m.MatchedBy,
		&m.Note, &m.Status, &m.CreatedAt,
	)
	if err != nil {
		if isUniqueViolation(err) {
			return nil, ErrAlreadyMatched
		}
		return nil, fmt.Errorf("create coordinator match: %w", err)
	}
	return m, nil
}

// GetMatchesByRequestID returns all matches for a request joined with hospital info and chat room.
func (r *coordinatorRepository) GetMatchesByRequestID(requestID int64) ([]model.CoordinatorMatchWithHospital, error) {
	const q = `
		SELECT
			cm.id, cm.request_id, cm.hospital_id,
			h.name, h.profile_image, h.address,
			cm.note, cm.status,
			cr.id AS chat_room_id,
			cm.created_at
		FROM coordinator_matches cm
		JOIN hospitals h ON h.id = cm.hospital_id
		LEFT JOIN chat_rooms cr
			ON cr.request_id = cm.request_id
			AND cr.hospital_id = cm.hospital_id
		WHERE cm.request_id = $1
		ORDER BY cm.created_at ASC`

	rows, err := r.db.Query(q, requestID)
	if err != nil {
		return nil, fmt.Errorf("get matches by request id: %w", err)
	}
	defer rows.Close()

	var results []model.CoordinatorMatchWithHospital
	for rows.Next() {
		item := model.CoordinatorMatchWithHospital{}
		var chatRoomID sql.NullInt64
		if err := rows.Scan(
			&item.ID, &item.RequestID, &item.HospitalID,
			&item.HospitalName, &item.HospitalProfileImage, &item.HospitalAddress,
			&item.Note, &item.Status,
			&chatRoomID,
			&item.CreatedAt,
		); err != nil {
			return nil, fmt.Errorf("scan match row: %w", err)
		}
		if chatRoomID.Valid {
			id := chatRoomID.Int64
			item.ChatRoomID = &id
		}
		results = append(results, item)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	if results == nil {
		results = []model.CoordinatorMatchWithHospital{}
	}
	return results, nil
}

// UpdateMatchStatus updates the status of a coordinator_matches row.
func (r *coordinatorRepository) UpdateMatchStatus(id int64, status string) error {
	const q = `UPDATE coordinator_matches SET status = $2 WHERE id = $1`
	result, err := r.db.Exec(q, id, status)
	if err != nil {
		return fmt.Errorf("update match status: %w", err)
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

// SetCoordinatorOnRequest updates coordinator_id and matched_at on a consultation_requests row.
func (r *coordinatorRepository) SetCoordinatorOnRequest(requestID, coordinatorID int64) error {
	const q = `
		UPDATE consultation_requests
		SET coordinator_id = $2, matched_at = NOW()
		WHERE id = $1`
	if _, err := r.db.Exec(q, requestID, coordinatorID); err != nil {
		return fmt.Errorf("set coordinator on request: %w", err)
	}
	return nil
}

// SetRequestStatusMatched changes the consultation request status to 'matched'.
func (r *coordinatorRepository) SetRequestStatusMatched(requestID int64) error {
	const q = `UPDATE consultation_requests SET status = 'matched' WHERE id = $1`
	if _, err := r.db.Exec(q, requestID); err != nil {
		return fmt.Errorf("set request status matched: %w", err)
	}
	return nil
}

// GetChatRoomIDForMatch looks up the chat room created for a specific (request, hospital) pair.
func (r *coordinatorRepository) GetChatRoomIDForMatch(requestID, hospitalID int64) (*int64, error) {
	const q = `SELECT id FROM chat_rooms WHERE request_id = $1 AND hospital_id = $2 LIMIT 1`
	var roomID int64
	err := r.db.QueryRow(q, requestID, hospitalID).Scan(&roomID)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("get chat room id for match: %w", err)
	}
	return &roomID, nil
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

func isUniqueViolation(err error) bool {
	if err == nil {
		return false
	}
	msg := err.Error()
	return strings.Contains(msg, "unique") || strings.Contains(msg, "duplicate") || strings.Contains(msg, "23505")
}
