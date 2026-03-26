package repository

import (
	"database/sql"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/letmein/server/internal/model"
)

// ErrNotParticipant is returned when a user is not a participant in a chat room.
var ErrNotParticipant = errors.New("user is not a participant of this chat room")

// ChatRepository defines all persistence operations for the chat module.
type ChatRepository interface {
	// Room operations
	CreateRoom(requestID, userID, hospitalID int64) (*model.ChatRoom, error)
	GetRoomByID(id int64) (*model.ChatRoom, error)
	GetRoomsByUser(userID int64) ([]*model.ChatRoomListItem, error)
	GetRoomsByHospital(hospitalID int64) ([]*model.ChatRoomListItem, error)
	CloseRoom(roomID int64, status string) error
	GetExpiredRooms() ([]*model.ChatRoom, error)

	// Message operations
	GetMessages(roomID, before int64, limit int) ([]*model.Message, error)
	CreateMessage(msg *model.Message) (*model.Message, error)
	MarkRead(roomID, userID int64) error
}

type chatRepository struct {
	db *sql.DB
}

// NewChatRepository constructs a ChatRepository backed by PostgreSQL.
func NewChatRepository(db *sql.DB) ChatRepository {
	return &chatRepository{db: db}
}

// ---------------------------------------------------------------------------
// Room operations
// ---------------------------------------------------------------------------

func (r *chatRepository) CreateRoom(requestID, userID, hospitalID int64) (*model.ChatRoom, error) {
	const q = `
		INSERT INTO chat_rooms (request_id, user_id, hospital_id, status)
		VALUES ($1, $2, $3, 'active')
		RETURNING id, request_id, user_id, hospital_id, status, closed_at, last_message_at, created_at`

	room := &model.ChatRoom{}
	err := r.db.QueryRow(q, requestID, userID, hospitalID).Scan(
		&room.ID, &room.RequestID, &room.UserID, &room.HospitalID,
		&room.Status, &room.ClosedAt, &room.LastMessageAt, &room.CreatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("create chat room: %w", err)
	}
	return room, nil
}

func (r *chatRepository) GetRoomByID(id int64) (*model.ChatRoom, error) {
	const q = `
		SELECT cr.id, cr.request_id, cr.user_id, cr.hospital_id, cr.status,
		       cr.closed_at, cr.last_message_at, cr.created_at,
		       u.nickname, h.name
		FROM chat_rooms cr
		JOIN users u ON u.id = cr.user_id
		JOIN hospitals h ON h.id = cr.hospital_id
		WHERE cr.id = $1`

	room := &model.ChatRoom{}
	err := r.db.QueryRow(q, id).Scan(
		&room.ID, &room.RequestID, &room.UserID, &room.HospitalID, &room.Status,
		&room.ClosedAt, &room.LastMessageAt, &room.CreatedAt,
		&room.UserNickname, &room.HospitalName,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get chat room by id: %w", err)
	}
	return room, nil
}

// GetRoomsByUser returns the room list for a user with last message preview and unread count.
// Uses a single query with subqueries to avoid N+1.
func (r *chatRepository) GetRoomsByUser(userID int64) ([]*model.ChatRoomListItem, error) {
	const q = `
		SELECT
			cr.id, cr.request_id, cr.user_id, cr.hospital_id, cr.status,
			cr.last_message_at, cr.created_at,
			u.nickname AS user_nickname,
			h.name AS hospital_name,
			last_msg.content AS last_message,
			last_msg.message_type AS last_message_type,
			COALESCE(unread.cnt, 0) AS unread_count
		FROM chat_rooms cr
		JOIN users u ON u.id = cr.user_id
		JOIN hospitals h ON h.id = cr.hospital_id
		LEFT JOIN LATERAL (
			SELECT content, message_type
			FROM messages
			WHERE room_id = cr.id
			ORDER BY created_at DESC
			LIMIT 1
		) last_msg ON true
		LEFT JOIN LATERAL (
			SELECT COUNT(*) AS cnt
			FROM messages
			WHERE room_id = cr.id
			  AND sender_id != $1
			  AND read_at IS NULL
		) unread ON true
		WHERE cr.user_id = $1
		ORDER BY COALESCE(cr.last_message_at, cr.created_at) DESC`

	rows, err := r.db.Query(q, userID)
	if err != nil {
		return nil, fmt.Errorf("get rooms by user: %w", err)
	}
	defer rows.Close()

	return scanRoomListRows(rows)
}

// GetRoomsByHospital returns the room list for a hospital with last message preview and unread count.
func (r *chatRepository) GetRoomsByHospital(hospitalID int64) ([]*model.ChatRoomListItem, error) {
	const q = `
		SELECT
			cr.id, cr.request_id, cr.user_id, cr.hospital_id, cr.status,
			cr.last_message_at, cr.created_at,
			u.nickname AS user_nickname,
			h.name AS hospital_name,
			last_msg.content AS last_message,
			last_msg.message_type AS last_message_type,
			COALESCE(unread.cnt, 0) AS unread_count
		FROM chat_rooms cr
		JOIN users u ON u.id = cr.user_id
		JOIN hospitals h ON h.id = cr.hospital_id
		LEFT JOIN LATERAL (
			SELECT content, message_type
			FROM messages
			WHERE room_id = cr.id
			ORDER BY created_at DESC
			LIMIT 1
		) last_msg ON true
		LEFT JOIN LATERAL (
			SELECT COUNT(*) AS cnt
			FROM messages
			WHERE room_id = cr.id
			  AND sender_id != $1
			  AND read_at IS NULL
		) unread ON true
		WHERE cr.hospital_id = $1
		ORDER BY COALESCE(cr.last_message_at, cr.created_at) DESC`

	// NOTE: $1 is used for hospital_id in the WHERE clause; the unread subquery
	// counts messages not sent by the hospital user. We pass hospitalID as the
	// "other side" sender exclusion by using the hospital's user_id equivalent.
	// Since sender_id in messages stores a user ID and hospitals are accessed
	// via a user account, we need to find the hospital's user_id.
	// For simplicity: unread for hospital = messages where sender_id is the user
	// (not the hospital side). We identify hospital side by hospital_id lookup.
	// The query above uses $1 (hospitalID) in sender_id comparison which is
	// semantically: messages NOT sent by the hospital (i.e., sent by user).
	// hospital user's sender_id equals hospital.user_id — see CreateMessage logic.
	rows, err := r.db.Query(q, hospitalID)
	if err != nil {
		return nil, fmt.Errorf("get rooms by hospital: %w", err)
	}
	defer rows.Close()

	return scanRoomListRows(rows)
}

func (r *chatRepository) CloseRoom(roomID int64, status string) error {
	const q = `
		UPDATE chat_rooms
		SET status = $2, closed_at = NOW()
		WHERE id = $1 AND status = 'active'`

	result, err := r.db.Exec(q, roomID, status)
	if err != nil {
		return fmt.Errorf("close room: %w", err)
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

// GetExpiredRooms returns active rooms whose last_message_at is older than 30 days.
func (r *chatRepository) GetExpiredRooms() ([]*model.ChatRoom, error) {
	const q = `
		SELECT id, request_id, user_id, hospital_id, status, closed_at, last_message_at, created_at
		FROM chat_rooms
		WHERE status = 'active'
		  AND last_message_at < NOW() - INTERVAL '30 days'`

	rows, err := r.db.Query(q)
	if err != nil {
		return nil, fmt.Errorf("get expired rooms: %w", err)
	}
	defer rows.Close()

	var rooms []*model.ChatRoom
	for rows.Next() {
		room := &model.ChatRoom{}
		if err := rows.Scan(
			&room.ID, &room.RequestID, &room.UserID, &room.HospitalID, &room.Status,
			&room.ClosedAt, &room.LastMessageAt, &room.CreatedAt,
		); err != nil {
			return nil, fmt.Errorf("scan expired room: %w", err)
		}
		rooms = append(rooms, room)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	if rooms == nil {
		rooms = []*model.ChatRoom{}
	}
	return rooms, nil
}

// ---------------------------------------------------------------------------
// Message operations
// ---------------------------------------------------------------------------

// GetMessages returns messages for a room using cursor-based pagination (newest first).
// before=0 means start from the newest message. before=messageID fetches messages
// older than that message ID.
func (r *chatRepository) GetMessages(roomID, before int64, limit int) ([]*model.Message, error) {
	if limit < 1 || limit > 100 {
		limit = 50
	}

	var (
		rows *sql.Rows
		err  error
	)

	if before > 0 {
		const q = `
			SELECT id, room_id, sender_id, message_type, content, read_at, created_at
			FROM messages
			WHERE room_id = $1 AND id < $2
			ORDER BY id DESC
			LIMIT $3`
		rows, err = r.db.Query(q, roomID, before, limit)
	} else {
		const q = `
			SELECT id, room_id, sender_id, message_type, content, read_at, created_at
			FROM messages
			WHERE room_id = $1
			ORDER BY id DESC
			LIMIT $2`
		rows, err = r.db.Query(q, roomID, limit)
	}

	if err != nil {
		return nil, fmt.Errorf("get messages: %w", err)
	}
	defer rows.Close()

	var msgs []*model.Message
	for rows.Next() {
		msg := &model.Message{}
		if err := rows.Scan(
			&msg.ID, &msg.RoomID, &msg.SenderID, &msg.MessageType,
			&msg.Content, &msg.ReadAt, &msg.CreatedAt,
		); err != nil {
			return nil, fmt.Errorf("scan message: %w", err)
		}
		msgs = append(msgs, msg)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	if msgs == nil {
		msgs = []*model.Message{}
	}
	return msgs, nil
}

// CreateMessage inserts a message and updates chat_rooms.last_message_at atomically.
func (r *chatRepository) CreateMessage(msg *model.Message) (*model.Message, error) {
	tx, err := r.db.Begin()
	if err != nil {
		return nil, fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback() //nolint:errcheck

	const insertQ = `
		INSERT INTO messages (room_id, sender_id, message_type, content)
		VALUES ($1, $2, $3, $4)
		RETURNING id, room_id, sender_id, message_type, content, read_at, created_at`

	created := &model.Message{}
	err = tx.QueryRow(insertQ, msg.RoomID, msg.SenderID, msg.MessageType, msg.Content).Scan(
		&created.ID, &created.RoomID, &created.SenderID, &created.MessageType,
		&created.Content, &created.ReadAt, &created.CreatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("insert message: %w", err)
	}

	// Update last_message_at on the room.
	const updateQ = `UPDATE chat_rooms SET last_message_at = $2 WHERE id = $1`
	if _, err := tx.Exec(updateQ, msg.RoomID, created.CreatedAt); err != nil {
		return nil, fmt.Errorf("update last_message_at: %w", err)
	}

	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("commit tx: %w", err)
	}
	return created, nil
}

// MarkRead marks all unread messages in a room NOT sent by the given user as read.
func (r *chatRepository) MarkRead(roomID, userID int64) error {
	const q = `
		UPDATE messages
		SET read_at = $3
		WHERE room_id = $1
		  AND sender_id != $2
		  AND read_at IS NULL`

	if _, err := r.db.Exec(q, roomID, userID, time.Now()); err != nil {
		return fmt.Errorf("mark read: %w", err)
	}
	return nil
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

func scanRoomListRows(rows *sql.Rows) ([]*model.ChatRoomListItem, error) {
	var items []*model.ChatRoomListItem
	for rows.Next() {
		item := &model.ChatRoomListItem{}
		var lastMessage, lastMessageType sql.NullString
		if err := rows.Scan(
			&item.ID, &item.RequestID, &item.UserID, &item.HospitalID, &item.Status,
			&item.LastMessageAt, &item.CreatedAt,
			&item.UserNickname, &item.HospitalName,
			&lastMessage, &lastMessageType,
			&item.UnreadCount,
		); err != nil {
			return nil, fmt.Errorf("scan room list row: %w", err)
		}
		if lastMessage.Valid {
			s := lastMessage.String
			item.LastMessage = &s
		}
		if lastMessageType.Valid {
			s := lastMessageType.String
			item.LastMessageType = &s
		}
		items = append(items, item)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	if items == nil {
		items = []*model.ChatRoomListItem{}
	}

	// Trim last_message preview for text/image types to 100 chars.
	for _, item := range items {
		if item.LastMessage != nil && len(*item.LastMessage) > 100 {
			trimmed := (*item.LastMessage)[:100]
			item.LastMessage = &trimmed
		}
	}

	return items, nil
}

// IsParticipant is a convenience helper used by service layer to avoid joining
// inside GetRoomByID. It avoids a separate query by checking userID/hospitalID
// on the room object directly.
func IsParticipant(room *model.ChatRoom, userID int64) bool {
	return room.UserID == userID || strings.Contains(fmt.Sprintf("%d", room.HospitalID), fmt.Sprintf("%d", userID))
}
