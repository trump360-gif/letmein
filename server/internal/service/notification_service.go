package service

import (
	"errors"
	"log"

	"github.com/letmein/server/internal/model"
	"github.com/letmein/server/internal/repository"
)

var ErrNotificationNotFound = errors.New("notification not found")

// ──────────────────────────────────────────────
// Input structs
// ──────────────────────────────────────────────

type CreateNotificationInput struct {
	UserID   int64
	Type     string
	Title    string
	Body     string
	Data     []byte
	DeepLink *string
}

type UpdateSettingsInput struct {
	ConsultationArrived bool
	ChatMessage         bool
	ChatExpiry          bool
	CommunityActivity   bool
	EventNotice         bool
	Marketing           bool
}

// ──────────────────────────────────────────────
// Interface
// ──────────────────────────────────────────────

type NotificationService interface {
	CreateNotification(input CreateNotificationInput) (*model.Notification, error)
	ListByUser(userID int64, cursor int64, limit int) ([]*model.NotificationListItem, error)
	MarkRead(id, userID int64) error
	GetUnreadCount(userID int64) (int, error)
	GetSettings(userID int64) (*model.NotificationSettings, error)
	UpdateSettings(userID int64, input UpdateSettingsInput) (*model.NotificationSettings, error)
}

// ──────────────────────────────────────────────
// Implementation
// ──────────────────────────────────────────────

type notificationService struct {
	notifRepo repository.NotificationRepository
}

func NewNotificationService(notifRepo repository.NotificationRepository) NotificationService {
	return &notificationService{notifRepo: notifRepo}
}

func (s *notificationService) CreateNotification(input CreateNotificationInput) (*model.Notification, error) {
	notif := &model.Notification{
		UserID:   input.UserID,
		Type:     input.Type,
		Title:    input.Title,
		Body:     input.Body,
		Data:     input.Data,
		DeepLink: input.DeepLink,
	}

	created, err := s.notifRepo.Create(notif)
	if err != nil {
		return nil, err
	}

	// Dispatch push notification asynchronously.
	// Actual FCM/APNs integration is a future enhancement — log for now.
	go s.sendPush(created)

	return created, nil
}

// sendPush is a placeholder for the real FCM/APNs push delivery.
// It will be replaced with firebase-admin-go (or equivalent) calls
// once FCM credentials are provisioned.
func (s *notificationService) sendPush(notif *model.Notification) {
	log.Printf("[push] user=%d type=%s title=%q body=%q deepLink=%v",
		notif.UserID, notif.Type, notif.Title, notif.Body, notif.DeepLink)
}

func (s *notificationService) ListByUser(userID int64, cursor int64, limit int) ([]*model.NotificationListItem, error) {
	return s.notifRepo.ListByUser(userID, cursor, limit)
}

func (s *notificationService) MarkRead(id, userID int64) error {
	err := s.notifRepo.MarkRead(id, userID)
	if errors.Is(err, repository.ErrNotFound) {
		return ErrNotificationNotFound
	}
	return err
}

func (s *notificationService) GetUnreadCount(userID int64) (int, error) {
	return s.notifRepo.GetUnreadCount(userID)
}

func (s *notificationService) GetSettings(userID int64) (*model.NotificationSettings, error) {
	return s.notifRepo.GetSettings(userID)
}

func (s *notificationService) UpdateSettings(userID int64, input UpdateSettingsInput) (*model.NotificationSettings, error) {
	settings := &model.NotificationSettings{
		UserID:              userID,
		ConsultationArrived: input.ConsultationArrived,
		ChatMessage:         input.ChatMessage,
		ChatExpiry:          input.ChatExpiry,
		CommunityActivity:   input.CommunityActivity,
		EventNotice:         input.EventNotice,
		Marketing:           input.Marketing,
	}

	if err := s.notifRepo.UpdateSettings(userID, settings); err != nil {
		return nil, err
	}

	return s.notifRepo.GetSettings(userID)
}
