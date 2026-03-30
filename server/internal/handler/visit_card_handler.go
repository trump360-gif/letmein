package handler

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/letmein/server/internal/model"
	"github.com/letmein/server/internal/repository"
)

// VisitCardHandler handles HTTP endpoints for visit booking cards.
type VisitCardHandler struct {
	visitCardRepo repository.VisitCardRepository
	chatRepo      repository.ChatRepository
}

// NewVisitCardHandler constructs a VisitCardHandler.
func NewVisitCardHandler(
	visitCardRepo repository.VisitCardRepository,
	chatRepo repository.ChatRepository,
) *VisitCardHandler {
	return &VisitCardHandler{
		visitCardRepo: visitCardRepo,
		chatRepo:      chatRepo,
	}
}

// POST /api/v1/chat/rooms/:id/visit-card
// Hospital-only. Proposes a visit booking card inside the chat room.
// Body: { "proposedDate": "2026-04-15", "proposedTime": "14:30", "note": "optional" }
func (h *VisitCardHandler) CreateVisitCard(c *gin.Context) {
	hospitalID, ok := mustHospitalID(c)
	if !ok {
		return
	}

	roomID, ok := mustParamID(c, "id")
	if !ok {
		return
	}

	// Verify the room exists and the hospital is a participant.
	room, err := h.chatRepo.GetRoomByID(roomID)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "chat room not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to verify chat room"})
		return
	}
	if room.HospitalID != hospitalID {
		c.JSON(http.StatusForbidden, gin.H{"error": "access denied"})
		return
	}
	if room.Status != "active" {
		c.JSON(http.StatusConflict, gin.H{"error": "chat room is closed"})
		return
	}

	var req struct {
		ProposedDate string  `json:"proposedDate" binding:"required"`
		ProposedTime string  `json:"proposedTime" binding:"required"`
		Note         *string `json:"note"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "proposedDate and proposedTime are required"})
		return
	}

	card := &model.VisitCard{
		RoomID:       roomID,
		HospitalID:   hospitalID,
		ProposedDate: req.ProposedDate,
		ProposedTime: req.ProposedTime,
		Note:         req.Note,
	}

	created, err := h.visitCardRepo.Create(card)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create visit card"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": created})
}

// POST /api/v1/chat/rooms/:id/visit-card/:cardId/accept
// User-only. Accepts a proposed visit card.
func (h *VisitCardHandler) AcceptVisitCard(c *gin.Context) {
	h.respondVisitCard(c, model.VisitCardStatusAccepted)
}

// POST /api/v1/chat/rooms/:id/visit-card/:cardId/decline
// User-only. Declines a proposed visit card.
func (h *VisitCardHandler) DeclineVisitCard(c *gin.Context) {
	h.respondVisitCard(c, model.VisitCardStatusDeclined)
}

// respondVisitCard is the shared implementation for accept/decline endpoints.
func (h *VisitCardHandler) respondVisitCard(c *gin.Context, status string) {
	userID, ok := mustUserID(c)
	if !ok {
		return
	}

	roomID, ok := mustParamID(c, "id")
	if !ok {
		return
	}

	cardID, ok := mustParamID(c, "cardId")
	if !ok {
		return
	}

	// Verify the room exists and the caller is the room's user (not the hospital).
	room, err := h.chatRepo.GetRoomByID(roomID)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "chat room not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to verify chat room"})
		return
	}
	if room.UserID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "access denied"})
		return
	}

	// Verify the card belongs to this room.
	card, err := h.visitCardRepo.GetByID(cardID)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "visit card not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get visit card"})
		return
	}
	if card.RoomID != roomID {
		c.JSON(http.StatusNotFound, gin.H{"error": "visit card not found"})
		return
	}

	if err := h.visitCardRepo.UpdateStatus(cardID, status); err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			// Card no longer in proposed state or does not exist.
			c.JSON(http.StatusConflict, gin.H{"error": "visit card is no longer pending"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update visit card"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "visit card " + status})
}

// GET /api/v1/chat/rooms/:id/visit-cards
// Returns all visit cards for the given chat room.
// Accessible by both the room's user (auth required) and hospital (hospital required).
// This endpoint uses auth-required; access check is done against room participants.
func (h *VisitCardHandler) ListVisitCards(c *gin.Context) {
	userID, ok := mustUserID(c)
	if !ok {
		return
	}

	roomID, ok := mustParamID(c, "id")
	if !ok {
		return
	}

	// Verify the room exists and the caller is a participant.
	room, err := h.chatRepo.GetRoomByID(roomID)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "chat room not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to verify chat room"})
		return
	}
	// Allow access for the room's user. Hospital participants are expected to use
	// the hospital-role variant of this endpoint (see routes.go).
	if room.UserID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "access denied"})
		return
	}

	cards, err := h.visitCardRepo.ListByRoom(roomID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list visit cards"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": cards})
}

// ListVisitCardsHospital is the hospital-role variant of ListVisitCards.
// GET /api/v1/chat/rooms/:id/visit-cards  (hospital middleware applied at route level)
func (h *VisitCardHandler) ListVisitCardsHospital(c *gin.Context) {
	hospitalID, ok := mustHospitalID(c)
	if !ok {
		return
	}

	roomID, ok := mustParamID(c, "id")
	if !ok {
		return
	}

	room, err := h.chatRepo.GetRoomByID(roomID)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "chat room not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to verify chat room"})
		return
	}
	if room.HospitalID != hospitalID {
		c.JSON(http.StatusForbidden, gin.H{"error": "access denied"})
		return
	}

	cards, err := h.visitCardRepo.ListByRoom(roomID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list visit cards"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": cards})
}
