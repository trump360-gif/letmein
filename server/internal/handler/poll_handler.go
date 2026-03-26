package handler

import (
	"errors"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/letmein/server/internal/service"
)

type PollHandler struct {
	pollSvc service.PollService
}

func NewPollHandler(pollSvc service.PollService) *PollHandler {
	return &PollHandler{pollSvc: pollSvc}
}

// ──────────────────────────────────────────────
// POST /api/v1/polls
// ──────────────────────────────────────────────

type createPollOptionReq struct {
	Text     string `json:"text"     binding:"required,min=1,max=200"`
	ImageURL string `json:"imageUrl"`
}

type createPollRequest struct {
	Title       string                `json:"title"       binding:"required,min=1,max=200"`
	Description string                `json:"description"`
	PollType    string                `json:"pollType"    binding:"required,oneof=single multiple"`
	Options     []createPollOptionReq `json:"options"     binding:"required,min=2"`
	EndsAt      *time.Time            `json:"endsAt"`
}

func (h *PollHandler) CreatePoll(c *gin.Context) {
	userID, ok := mustUserID(c)
	if !ok {
		return
	}

	var req createPollRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	opts := make([]service.CreatePollOptionInput, 0, len(req.Options))
	for _, o := range req.Options {
		opts = append(opts, service.CreatePollOptionInput{
			Text:     o.Text,
			ImageURL: o.ImageURL,
		})
	}

	poll, err := h.pollSvc.CreatePoll(userID, service.CreatePollInput{
		Title:       req.Title,
		Description: req.Description,
		PollType:    req.PollType,
		Options:     opts,
		EndsAt:      req.EndsAt,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create poll"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": poll})
}

// ──────────────────────────────────────────────
// GET /api/v1/polls
// ──────────────────────────────────────────────

func (h *PollHandler) ListPolls(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	items, total, err := h.pollSvc.ListPolls(page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list polls"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": items,
		"meta": gin.H{
			"total": total,
			"page":  page,
			"limit": limit,
		},
	})
}

// ──────────────────────────────────────────────
// GET /api/v1/polls/:id
// ──────────────────────────────────────────────

func (h *PollHandler) GetPoll(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid poll id"})
		return
	}

	// currentUserID may be 0 for unauthenticated requests.
	currentUserID, _ := getUserID(c)

	poll, err := h.pollSvc.GetPoll(id, currentUserID)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrPollNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": "poll not found"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get poll"})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": poll})
}

// ──────────────────────────────────────────────
// POST /api/v1/polls/:id/vote
// ──────────────────────────────────────────────

type votePollRequest struct {
	OptionID int64 `json:"optionId" binding:"required"`
}

func (h *PollHandler) Vote(c *gin.Context) {
	userID, ok := mustUserID(c)
	if !ok {
		return
	}

	pollID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid poll id"})
		return
	}

	var req votePollRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.pollSvc.Vote(pollID, req.OptionID, userID); err != nil {
		switch {
		case errors.Is(err, service.ErrPollNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": "poll not found"})
		case errors.Is(err, service.ErrAlreadyVoted):
			c.JSON(http.StatusConflict, gin.H{"error": "already voted"})
		case errors.Is(err, service.ErrPollClosed):
			c.JSON(http.StatusUnprocessableEntity, gin.H{"error": "poll is closed"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to vote"})
		}
		return
	}

	// Return updated poll detail.
	poll, err := h.pollSvc.GetPoll(pollID, userID)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"message": "voted"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": poll})
}

// ──────────────────────────────────────────────
// POST /api/v1/polls/:id/close
// ──────────────────────────────────────────────

func (h *PollHandler) ClosePoll(c *gin.Context) {
	userID, ok := mustUserID(c)
	if !ok {
		return
	}

	pollID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid poll id"})
		return
	}

	if err := h.pollSvc.ClosePoll(pollID, userID); err != nil {
		switch {
		case errors.Is(err, service.ErrPollNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": "poll not found"})
		case errors.Is(err, service.ErrForbidden):
			c.JSON(http.StatusForbidden, gin.H{"error": "only the poll creator can close it"})
		case errors.Is(err, service.ErrPollClosed):
			c.JSON(http.StatusUnprocessableEntity, gin.H{"error": "poll is already closed"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to close poll"})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "poll closed"})
}

// ──────────────────────────────────────────────
// helpers
// ──────────────────────────────────────────────

// getUserID extracts userID from context without sending a 401 on failure.
func getUserID(c *gin.Context) (int64, bool) {
	v, exists := c.Get("userID")
	if !exists {
		return 0, false
	}
	id, ok := v.(int64)
	return id, ok
}
