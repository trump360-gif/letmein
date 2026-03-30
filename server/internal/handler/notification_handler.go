package handler

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/letmein/server/internal/service"
)

type NotificationHandler struct {
	notifSvc service.NotificationService
}

func NewNotificationHandler(notifSvc service.NotificationService) *NotificationHandler {
	return &NotificationHandler{notifSvc: notifSvc}
}

// ──────────────────────────────────────────────
// GET /api/v1/notifications?cursor=&limit=20
// ──────────────────────────────────────────────

func (h *NotificationHandler) ListNotifications(c *gin.Context) {
	userID, ok := mustUserID(c)
	if !ok {
		return
	}

	cursor, _ := strconv.ParseInt(c.DefaultQuery("cursor", "0"), 10, 64)
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	items, err := h.notifSvc.ListByUser(userID, cursor, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list notifications"})
		return
	}

	// Set next cursor to the last item's id for the client.
	var nextCursor int64
	if len(items) > 0 {
		nextCursor = items[len(items)-1].ID
	}

	c.JSON(http.StatusOK, gin.H{
		"data": items,
		"meta": gin.H{
			"next_cursor": nextCursor,
			"limit":       limit,
		},
	})
}

// ──────────────────────────────────────────────
// PUT /api/v1/notifications/:id/read
// ──────────────────────────────────────────────

func (h *NotificationHandler) MarkRead(c *gin.Context) {
	userID, ok := mustUserID(c)
	if !ok {
		return
	}

	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid notification id"})
		return
	}

	if err := h.notifSvc.MarkRead(id, userID); err != nil {
		switch {
		case errors.Is(err, service.ErrNotificationNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": "notification not found"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to mark notification as read"})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "notification marked as read"})
}

// ──────────────────────────────────────────────
// GET /api/v1/notifications/unread-count
// ──────────────────────────────────────────────

func (h *NotificationHandler) GetUnreadCount(c *gin.Context) {
	userID, ok := mustUserID(c)
	if !ok {
		return
	}

	count, err := h.notifSvc.GetUnreadCount(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get unread count"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": gin.H{"count": count},
	})
}

// ──────────────────────────────────────────────
// GET /api/v1/notifications/settings
// ──────────────────────────────────────────────

func (h *NotificationHandler) GetSettings(c *gin.Context) {
	userID, ok := mustUserID(c)
	if !ok {
		return
	}

	settings, err := h.notifSvc.GetSettings(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get notification settings"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": settings})
}

// ──────────────────────────────────────────────
// PUT /api/v1/notifications/settings
// ──────────────────────────────────────────────

type updateSettingsRequest struct {
	ConsultationArrived bool `json:"consultationArrived"`
	ChatMessage         bool `json:"chatMessage"`
	ChatExpiry          bool `json:"chatExpiry"`
	CommunityActivity   bool `json:"communityActivity"`
	EventNotice         bool `json:"eventNotice"`
	Marketing           bool `json:"marketing"`
}

func (h *NotificationHandler) UpdateSettings(c *gin.Context) {
	userID, ok := mustUserID(c)
	if !ok {
		return
	}

	var req updateSettingsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	settings, err := h.notifSvc.UpdateSettings(userID, service.UpdateSettingsInput{
		ConsultationArrived: req.ConsultationArrived,
		ChatMessage:         req.ChatMessage,
		ChatExpiry:          req.ChatExpiry,
		CommunityActivity:   req.CommunityActivity,
		EventNotice:         req.EventNotice,
		Marketing:           req.Marketing,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update notification settings"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": settings})
}
