package handler

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/letmein/server/internal/service"
)

type ReviewHandler struct {
	reviewSvc service.ReviewService
}

func NewReviewHandler(reviewSvc service.ReviewService) *ReviewHandler {
	return &ReviewHandler{reviewSvc: reviewSvc}
}

// ──────────────────────────────────────────────
// POST /api/v1/reviews
// ──────────────────────────────────────────────

type createReviewRequest struct {
	HospitalID int64    `json:"hospitalId"  binding:"required"`
	RequestID  int64    `json:"requestId"   binding:"required"`
	Rating     int      `json:"rating"      binding:"required,min=1,max=5"`
	Content    string   `json:"content"     binding:"required,min=30,max=1000"`
	ImageURLs  []string `json:"imageUrls"`
}

func (h *ReviewHandler) CreateReview(c *gin.Context) {
	userID, ok := mustUserID(c)
	if !ok {
		return
	}

	var req createReviewRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	review, err := h.reviewSvc.CreateReview(userID, service.CreateReviewInput{
		HospitalID: req.HospitalID,
		RequestID:  req.RequestID,
		Rating:     req.Rating,
		Content:    req.Content,
		ImageURLs:  req.ImageURLs,
	})
	if err != nil {
		switch {
		case errors.Is(err, service.ErrReviewIneligible):
			c.JSON(http.StatusForbidden, gin.H{"error": "not eligible to review: no completed consultation with this hospital"})
		case errors.Is(err, service.ErrReviewDuplicate):
			c.JSON(http.StatusConflict, gin.H{"error": "review already exists for this consultation"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create review"})
		}
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": review})
}

// ──────────────────────────────────────────────
// PUT /api/v1/reviews/:id
// ──────────────────────────────────────────────

type updateReviewRequest struct {
	Rating    int      `json:"rating"   binding:"required,min=1,max=5"`
	Content   string   `json:"content"  binding:"required,min=30,max=1000"`
	ImageURLs []string `json:"imageUrls"`
}

func (h *ReviewHandler) UpdateReview(c *gin.Context) {
	userID, ok := mustUserID(c)
	if !ok {
		return
	}

	reviewID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid review id"})
		return
	}

	var req updateReviewRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	review, err := h.reviewSvc.UpdateReview(userID, reviewID, service.UpdateReviewInput{
		Rating:    req.Rating,
		Content:   req.Content,
		ImageURLs: req.ImageURLs,
	})
	if err != nil {
		switch {
		case errors.Is(err, service.ErrReviewNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": "review not found"})
		case errors.Is(err, service.ErrReviewForbidden):
			c.JSON(http.StatusForbidden, gin.H{"error": "not the review owner"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update review"})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": review})
}

// ──────────────────────────────────────────────
// DELETE /api/v1/reviews/:id
// ──────────────────────────────────────────────

func (h *ReviewHandler) DeleteReview(c *gin.Context) {
	userID, ok := mustUserID(c)
	if !ok {
		return
	}

	reviewID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid review id"})
		return
	}

	if err := h.reviewSvc.DeleteReview(userID, reviewID); err != nil {
		switch {
		case errors.Is(err, service.ErrReviewNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": "review not found"})
		case errors.Is(err, service.ErrReviewForbidden):
			c.JSON(http.StatusForbidden, gin.H{"error": "not the review owner"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete review"})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "review deleted"})
}

// ──────────────────────────────────────────────
// GET /api/v1/hospitals/:id/reviews
// ──────────────────────────────────────────────

func (h *ReviewHandler) ListByHospital(c *gin.Context) {
	hospitalID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid hospital id"})
		return
	}

	cursor, _ := strconv.ParseInt(c.DefaultQuery("cursor", "0"), 10, 64)
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	items, err := h.reviewSvc.ListByHospital(hospitalID, cursor, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list reviews"})
		return
	}

	// Determine the next cursor value (ID of the last item in the current page).
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
