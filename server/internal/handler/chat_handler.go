package handler

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/letmein/server/internal/middleware"
	"github.com/letmein/server/internal/service"
)

// ChatHandler handles all chat-related HTTP endpoints.
type ChatHandler struct {
	chatSvc service.ChatService
}

// NewChatHandler constructs a ChatHandler.
func NewChatHandler(chatSvc service.ChatService) *ChatHandler {
	return &ChatHandler{chatSvc: chatSvc}
}

// POST /api/v1/chat/rooms
// Creates a chat room after a hospital is selected from an auction.
// Body: { "requestId": int64, "hospitalId": int64 }
func (h *ChatHandler) CreateRoom(c *gin.Context) {
	userID, ok := mustUserID(c)
	if !ok {
		return
	}

	var req struct {
		RequestID  int64 `json:"requestId"  binding:"required,min=1"`
		HospitalID int64 `json:"hospitalId" binding:"required,min=1"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "requestId and hospitalId are required"})
		return
	}

	room, err := h.chatSvc.CreateRoom(req.RequestID, userID, req.HospitalID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create chat room"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": room})
}

// GET /api/v1/chat/rooms
// Returns the authenticated user's chat room list.
func (h *ChatHandler) GetUserRooms(c *gin.Context) {
	userID, ok := mustUserID(c)
	if !ok {
		return
	}

	rooms, err := h.chatSvc.GetUserRooms(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get chat rooms"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": rooms})
}

// GET /api/v1/chat/rooms/hospital
// Returns the hospital's chat room list. Requires hospital role.
func (h *ChatHandler) GetHospitalRooms(c *gin.Context) {
	hospitalID, ok := mustHospitalID(c)
	if !ok {
		return
	}

	rooms, err := h.chatSvc.GetHospitalRooms(hospitalID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get chat rooms"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": rooms})
}

// GET /api/v1/chat/rooms/:id/messages
// Returns messages for a room using cursor-based pagination.
// Query params: before (message ID cursor), limit (default 50, max 100)
func (h *ChatHandler) GetMessages(c *gin.Context) {
	userID, ok := mustUserID(c)
	if !ok {
		return
	}

	roomID, ok := mustParamID(c, "id")
	if !ok {
		return
	}

	var before int64
	if v, err := strconv.ParseInt(c.Query("before"), 10, 64); err == nil && v > 0 {
		before = v
	}

	limit := 50
	if v, err := strconv.Atoi(c.Query("limit")); err == nil && v > 0 && v <= 100 {
		limit = v
	}

	msgs, err := h.chatSvc.GetMessages(roomID, userID, before, limit)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrChatRoomNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": "chat room not found"})
		case errors.Is(err, service.ErrChatForbidden):
			c.JSON(http.StatusForbidden, gin.H{"error": "access denied"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get messages"})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": msgs})
}

// POST /api/v1/chat/rooms/:id/messages
// Sends a message to the room.
// Body: { "type": "text"|"image", "content": string }
func (h *ChatHandler) SendMessage(c *gin.Context) {
	userID, ok := mustUserID(c)
	if !ok {
		return
	}

	roomID, ok := mustParamID(c, "id")
	if !ok {
		return
	}

	var req struct {
		Type    string `json:"type"    binding:"required,oneof=text image"`
		Content string `json:"content" binding:"required,min=1,max=4000"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "type (text|image) and content are required"})
		return
	}

	msg, err := h.chatSvc.SendMessage(roomID, userID, req.Type, req.Content)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrChatRoomNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": "chat room not found"})
		case errors.Is(err, service.ErrChatForbidden):
			c.JSON(http.StatusForbidden, gin.H{"error": "access denied"})
		case errors.Is(err, service.ErrChatRoomClosed):
			c.JSON(http.StatusConflict, gin.H{"error": "chat room is closed"})
		case errors.Is(err, service.ErrChatMessageFilter):
			c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error()})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to send message"})
		}
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": msg})
}

// POST /api/v1/chat/rooms/:id/read
// Marks all unread messages in the room as read for the caller.
func (h *ChatHandler) MarkRead(c *gin.Context) {
	userID, ok := mustUserID(c)
	if !ok {
		return
	}

	roomID, ok := mustParamID(c, "id")
	if !ok {
		return
	}

	if err := h.chatSvc.MarkRead(roomID, userID); err != nil {
		switch {
		case errors.Is(err, service.ErrChatRoomNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": "chat room not found"})
		case errors.Is(err, service.ErrChatForbidden):
			c.JSON(http.StatusForbidden, gin.H{"error": "access denied"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to mark messages as read"})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "messages marked as read"})
}

// POST /api/v1/chat/rooms/:id/close
// Closes the chat room. Caller must be a participant.
func (h *ChatHandler) CloseRoom(c *gin.Context) {
	userID, ok := mustUserID(c)
	if !ok {
		return
	}

	roomID, ok := mustParamID(c, "id")
	if !ok {
		return
	}

	if err := h.chatSvc.CloseRoom(roomID, userID, "closed"); err != nil {
		switch {
		case errors.Is(err, service.ErrChatRoomNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": "chat room not found"})
		case errors.Is(err, service.ErrChatForbidden):
			c.JSON(http.StatusForbidden, gin.H{"error": "access denied"})
		case errors.Is(err, service.ErrChatRoomClosed):
			c.JSON(http.StatusConflict, gin.H{"error": "chat room is already closed"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to close chat room"})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "chat room closed"})
}

// GET /api/v1/chat/token
// Returns a Centrifugo connection token for the authenticated user.
func (h *ChatHandler) GetCentrifugoToken(c *gin.Context) {
	userID, exists := c.Get(middleware.ContextKeyUserID)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	uid, ok := userID.(int64)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	token, err := h.chatSvc.GetCentrifugoToken(uid)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": gin.H{"token": token}})
}
