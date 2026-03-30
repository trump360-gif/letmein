package repository

import (
	"database/sql"
	"errors"
	"fmt"
	"time"

	"github.com/letmein/server/internal/model"
)

// VisitCardRepository defines persistence operations for visit booking cards.
type VisitCardRepository interface {
	Create(card *model.VisitCard) (*model.VisitCard, error)
	GetByID(id int64) (*model.VisitCard, error)
	UpdateStatus(id int64, status string) error
	ListByRoom(roomID int64) ([]*model.VisitCard, error)
}

type visitCardRepository struct {
	db *sql.DB
}

// NewVisitCardRepository constructs a VisitCardRepository backed by PostgreSQL.
func NewVisitCardRepository(db *sql.DB) VisitCardRepository {
	return &visitCardRepository{db: db}
}

// Create inserts a new visit card and returns the persisted record.
func (r *visitCardRepository) Create(card *model.VisitCard) (*model.VisitCard, error) {
	const q = `
		INSERT INTO visit_cards (room_id, hospital_id, proposed_date, proposed_time, note, status)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, room_id, hospital_id, proposed_date, proposed_time, note, status, created_at, responded_at`

	created := &model.VisitCard{}
	err := r.db.QueryRow(q,
		card.RoomID,
		card.HospitalID,
		card.ProposedDate,
		card.ProposedTime,
		card.Note,
		model.VisitCardStatusProposed,
	).Scan(
		&created.ID,
		&created.RoomID,
		&created.HospitalID,
		&created.ProposedDate,
		&created.ProposedTime,
		&created.Note,
		&created.Status,
		&created.CreatedAt,
		&created.RespondedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("create visit card: %w", err)
	}
	return created, nil
}

// GetByID fetches a single visit card by its primary key.
func (r *visitCardRepository) GetByID(id int64) (*model.VisitCard, error) {
	const q = `
		SELECT id, room_id, hospital_id, proposed_date, proposed_time, note, status, created_at, responded_at
		FROM visit_cards
		WHERE id = $1`

	vc := &model.VisitCard{}
	err := r.db.QueryRow(q, id).Scan(
		&vc.ID,
		&vc.RoomID,
		&vc.HospitalID,
		&vc.ProposedDate,
		&vc.ProposedTime,
		&vc.Note,
		&vc.Status,
		&vc.CreatedAt,
		&vc.RespondedAt,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get visit card by id: %w", err)
	}
	return vc, nil
}

// UpdateStatus transitions a visit card to accepted or declined and stamps responded_at.
func (r *visitCardRepository) UpdateStatus(id int64, status string) error {
	const q = `
		UPDATE visit_cards
		SET status = $2, responded_at = $3
		WHERE id = $1 AND status = 'proposed'`

	result, err := r.db.Exec(q, id, status, time.Now())
	if err != nil {
		return fmt.Errorf("update visit card status: %w", err)
	}
	n, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if n == 0 {
		// Either the card does not exist or it is no longer in proposed state.
		return ErrNotFound
	}
	return nil
}

// ListByRoom returns all visit cards for the given chat room, newest first.
func (r *visitCardRepository) ListByRoom(roomID int64) ([]*model.VisitCard, error) {
	const q = `
		SELECT id, room_id, hospital_id, proposed_date, proposed_time, note, status, created_at, responded_at
		FROM visit_cards
		WHERE room_id = $1
		ORDER BY created_at DESC`

	rows, err := r.db.Query(q, roomID)
	if err != nil {
		return nil, fmt.Errorf("list visit cards by room: %w", err)
	}
	defer rows.Close()

	var cards []*model.VisitCard
	for rows.Next() {
		vc := &model.VisitCard{}
		if err := rows.Scan(
			&vc.ID,
			&vc.RoomID,
			&vc.HospitalID,
			&vc.ProposedDate,
			&vc.ProposedTime,
			&vc.Note,
			&vc.Status,
			&vc.CreatedAt,
			&vc.RespondedAt,
		); err != nil {
			return nil, fmt.Errorf("scan visit card: %w", err)
		}
		cards = append(cards, vc)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	if cards == nil {
		cards = []*model.VisitCard{}
	}
	return cards, nil
}
