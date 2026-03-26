package service

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/letmein/server/internal/model"
	"github.com/letmein/server/internal/repository"
	pkgauth "github.com/letmein/server/pkg/auth"
	"github.com/letmein/server/pkg/filter"
)

// Sentinel errors for the chat domain.
var (
	ErrChatRoomNotFound  = errors.New("chat room not found")
	ErrChatForbidden     = errors.New("access to this chat room is not allowed")
	ErrChatRoomClosed    = errors.New("chat room is not active")
	ErrChatMessageFilter = errors.New("message contains forbidden content")
)

const (
	systemMsgStart      = "상담이 시작되었습니다"
	systemMsgDisclaimer = "이 채팅은 의료 진단·처방이 아닌 상담 안내 목적입니다. 정확한 진단은 대면 진료를 통해 받으시기 바랍니다."
	systemMsgClosed     = "상담이 종료되었습니다"
	systemMsgAutoClosed = "30일 동안 대화가 없어 자동으로 종료되었습니다"
	systemSenderID      = 0 // system messages have no real sender
)

// ChatService defines all business-logic operations for the chat module.
type ChatService interface {
	CreateRoom(requestID, userID, hospitalID int64) (*model.ChatRoom, error)
	GetUserRooms(userID int64) ([]*model.ChatRoomListItem, error)
	GetHospitalRooms(hospitalID int64) ([]*model.ChatRoomListItem, error)
	GetMessages(roomID, userID, before int64, limit int) ([]*model.Message, error)
	SendMessage(roomID, senderID int64, messageType, content string) (*model.Message, error)
	MarkRead(roomID, userID int64) error
	CloseRoom(roomID, userID int64, status string) error
	AutoCloseExpired() error
	GetCentrifugoToken(userID int64) (string, error)
}

type chatService struct {
	chatRepo        repository.ChatRepository
	hospitalRepo    repository.HospitalRepository
	centrifugoMgr   *pkgauth.CentrifugoManager
	centrifugoURL   string
	centrifugoKey   string
	httpClient      *http.Client
}

// NewChatService constructs a ChatService.
func NewChatService(
	chatRepo repository.ChatRepository,
	hospitalRepo repository.HospitalRepository,
	centrifugoMgr *pkgauth.CentrifugoManager,
	centrifugoURL string,
	centrifugoKey string,
) ChatService {
	return &chatService{
		chatRepo:      chatRepo,
		hospitalRepo:  hospitalRepo,
		centrifugoMgr: centrifugoMgr,
		centrifugoURL: centrifugoURL,
		centrifugoKey: centrifugoKey,
		httpClient:    &http.Client{Timeout: 5 * time.Second},
	}
}

func (s *chatService) CreateRoom(requestID, userID, hospitalID int64) (*model.ChatRoom, error) {
	room, err := s.chatRepo.CreateRoom(requestID, userID, hospitalID)
	if err != nil {
		return nil, fmt.Errorf("create room: %w", err)
	}

	// Send initial system messages: greeting + disclaimer.
	if err := s.sendSystemMessage(room.ID, systemMsgStart); err != nil {
		// Non-fatal: room was created; log and continue.
		_ = err
	}
	if err := s.sendSystemMessage(room.ID, systemMsgDisclaimer); err != nil {
		_ = err
	}

	return room, nil
}

func (s *chatService) GetUserRooms(userID int64) ([]*model.ChatRoomListItem, error) {
	rooms, err := s.chatRepo.GetRoomsByUser(userID)
	if err != nil {
		return nil, fmt.Errorf("get user rooms: %w", err)
	}
	return rooms, nil
}

func (s *chatService) GetHospitalRooms(hospitalID int64) ([]*model.ChatRoomListItem, error) {
	rooms, err := s.chatRepo.GetRoomsByHospital(hospitalID)
	if err != nil {
		return nil, fmt.Errorf("get hospital rooms: %w", err)
	}
	return rooms, nil
}

func (s *chatService) GetMessages(roomID, userID, before int64, limit int) ([]*model.Message, error) {
	room, err := s.chatRepo.GetRoomByID(roomID)
	if errors.Is(err, repository.ErrNotFound) {
		return nil, ErrChatRoomNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get room: %w", err)
	}

	if !s.isParticipant(room, userID) {
		return nil, ErrChatForbidden
	}

	msgs, err := s.chatRepo.GetMessages(roomID, before, limit)
	if err != nil {
		return nil, fmt.Errorf("get messages: %w", err)
	}
	return msgs, nil
}

func (s *chatService) SendMessage(roomID, senderID int64, messageType, content string) (*model.Message, error) {
	room, err := s.chatRepo.GetRoomByID(roomID)
	if errors.Is(err, repository.ErrNotFound) {
		return nil, ErrChatRoomNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get room: %w", err)
	}

	if !s.isParticipant(room, senderID) {
		return nil, ErrChatForbidden
	}

	if room.Status != "active" {
		return nil, ErrChatRoomClosed
	}

	// Apply keyword filter on text messages.
	if messageType == "text" {
		clean, reason := filter.FilterMessage(content)
		if !clean {
			return nil, fmt.Errorf("%w: %s", ErrChatMessageFilter, reason)
		}
	}

	msg := &model.Message{
		RoomID:      roomID,
		SenderID:    senderID,
		MessageType: messageType,
		Content:     content,
	}

	created, err := s.chatRepo.CreateMessage(msg)
	if err != nil {
		return nil, fmt.Errorf("create message: %w", err)
	}

	// Publish to Centrifugo asynchronously; failure does not block the response.
	go func() {
		_ = s.publishToCentrifugo(roomID, created)
	}()

	return created, nil
}

func (s *chatService) MarkRead(roomID, userID int64) error {
	room, err := s.chatRepo.GetRoomByID(roomID)
	if errors.Is(err, repository.ErrNotFound) {
		return ErrChatRoomNotFound
	}
	if err != nil {
		return fmt.Errorf("get room: %w", err)
	}

	if !s.isParticipant(room, userID) {
		return ErrChatForbidden
	}

	if err := s.chatRepo.MarkRead(roomID, userID); err != nil {
		return fmt.Errorf("mark read: %w", err)
	}
	return nil
}

func (s *chatService) CloseRoom(roomID, userID int64, status string) error {
	room, err := s.chatRepo.GetRoomByID(roomID)
	if errors.Is(err, repository.ErrNotFound) {
		return ErrChatRoomNotFound
	}
	if err != nil {
		return fmt.Errorf("get room: %w", err)
	}

	if !s.isParticipant(room, userID) {
		return ErrChatForbidden
	}

	if room.Status != "active" {
		return ErrChatRoomClosed
	}

	if err := s.chatRepo.CloseRoom(roomID, status); err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return ErrChatRoomNotFound
		}
		return fmt.Errorf("close room: %w", err)
	}

	// Send system closure message.
	_ = s.sendSystemMessage(roomID, systemMsgClosed)

	return nil
}

func (s *chatService) AutoCloseExpired() error {
	rooms, err := s.chatRepo.GetExpiredRooms()
	if err != nil {
		return fmt.Errorf("get expired rooms: %w", err)
	}

	for _, room := range rooms {
		if err := s.chatRepo.CloseRoom(room.ID, "auto_closed"); err != nil {
			// Skip rooms that may have been closed concurrently.
			if errors.Is(err, repository.ErrNotFound) {
				continue
			}
			return fmt.Errorf("auto-close room %d: %w", room.ID, err)
		}
		_ = s.sendSystemMessage(room.ID, systemMsgAutoClosed)
	}

	return nil
}

func (s *chatService) GetCentrifugoToken(userID int64) (string, error) {
	expireAt := time.Now().Add(24 * time.Hour)
	token, err := s.centrifugoMgr.GenerateCentrifugoToken(strconv.FormatInt(userID, 10), expireAt)
	if err != nil {
		return "", fmt.Errorf("generate centrifugo token: %w", err)
	}
	return token, nil
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

// isParticipant checks whether the given userID matches either the room's user
// or the hospital's owning user. For hospital participants, the senderID stored
// in messages corresponds to the hospital's user account ID (role=hospital).
// The room stores hospital_id (hospitals.id), not the user_id behind it.
// We identify hospital participation by looking up the hospital's user_id.
func (s *chatService) isParticipant(room *model.ChatRoom, userID int64) bool {
	if room.UserID == userID {
		return true
	}
	// Check if userID is the hospital owner.
	hospital, err := s.hospitalRepo.GetByUserID(userID)
	if err != nil {
		return false
	}
	return hospital.ID == room.HospitalID
}

// sendSystemMessage creates a system-type message in the room and publishes it.
func (s *chatService) sendSystemMessage(roomID int64, content string) error {
	msg := &model.Message{
		RoomID:      roomID,
		SenderID:    systemSenderID,
		MessageType: "system",
		Content:     content,
	}
	created, err := s.chatRepo.CreateMessage(msg)
	if err != nil {
		return fmt.Errorf("create system message: %w", err)
	}
	go func() {
		_ = s.publishToCentrifugo(roomID, created)
	}()
	return nil
}

// centrifugoPublishPayload is the Centrifugo HTTP API publish request body.
type centrifugoPublishPayload struct {
	Method string                 `json:"method"`
	Params centrifugoPublishParam `json:"params"`
}

type centrifugoPublishParam struct {
	Channel string      `json:"channel"`
	Data    interface{} `json:"data"`
}

// publishToCentrifugo sends a message to Centrifugo via its HTTP API.
func (s *chatService) publishToCentrifugo(roomID int64, msg *model.Message) error {
	channel := fmt.Sprintf("chat:room_%d", roomID)
	payload := centrifugoPublishPayload{
		Method: "publish",
		Params: centrifugoPublishParam{
			Channel: channel,
			Data:    msg,
		},
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("marshal centrifugo payload: %w", err)
	}

	req, err := http.NewRequest(http.MethodPost, s.centrifugoURL, bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("create centrifugo request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-API-Key", s.centrifugoKey)

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("centrifugo publish: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		return fmt.Errorf("centrifugo publish returned status %d", resp.StatusCode)
	}
	return nil
}
