package handler

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/letmein/server/internal/model"
	"github.com/letmein/server/internal/service"
)

// AdHandler handles native advertisement endpoints.
type AdHandler struct {
	adSvc service.AdService
}

func NewAdHandler(adSvc service.AdService) *AdHandler {
	return &AdHandler{adSvc: adSvc}
}

// ---------------------------------------------------------------------------
// Credit
// ---------------------------------------------------------------------------

// GET /api/v1/ads/credit
func (h *AdHandler) GetCredit(c *gin.Context) {
	hospitalID, ok := mustHospitalID(c)
	if !ok {
		return
	}

	credit, err := h.adSvc.GetCreditBalance(hospitalID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get credit balance"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": credit})
}

// POST /api/v1/ads/credit/charge
func (h *AdHandler) ChargeCredit(c *gin.Context) {
	hospitalID, ok := mustHospitalID(c)
	if !ok {
		return
	}

	var req struct {
		Amount      int    `json:"amount"      binding:"required,min=1"`
		Description string `json:"description"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "amount is required and must be positive"})
		return
	}

	credit, err := h.adSvc.ChargeCredit(hospitalID, req.Amount, req.Description)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to charge credit"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": credit})
}

// ---------------------------------------------------------------------------
// Creative
// ---------------------------------------------------------------------------

// POST /api/v1/ads/creatives
func (h *AdHandler) CreateCreative(c *gin.Context) {
	hospitalID, ok := mustHospitalID(c)
	if !ok {
		return
	}

	var req model.AdCreativeCreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "image_url and headline (max 60 chars) are required"})
		return
	}

	creative, err := h.adSvc.CreateCreative(hospitalID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create creative"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": creative})
}

// GET /api/v1/ads/creatives
func (h *AdHandler) ListCreatives(c *gin.Context) {
	hospitalID, ok := mustHospitalID(c)
	if !ok {
		return
	}

	creatives, err := h.adSvc.ListCreatives(hospitalID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list creatives"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": creatives})
}

// ---------------------------------------------------------------------------
// Campaign
// ---------------------------------------------------------------------------

// POST /api/v1/ads/campaigns
func (h *AdHandler) CreateCampaign(c *gin.Context) {
	hospitalID, ok := mustHospitalID(c)
	if !ok {
		return
	}

	var req model.AdCampaignCreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "creative_id, placement, daily_budget, cpm_price, start_date, end_date are required"})
		return
	}

	campaign, err := h.adSvc.CreateCampaign(hospitalID, req)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrCreativeNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": "creative not found"})
		case errors.Is(err, service.ErrCreativeAccessDenied):
			c.JSON(http.StatusForbidden, gin.H{"error": "creative does not belong to this hospital"})
		case errors.Is(err, service.ErrCreativeNotApproved):
			c.JSON(http.StatusUnprocessableEntity, gin.H{"error": "creative must be approved before creating a campaign"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create campaign"})
		}
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": campaign})
}

// GET /api/v1/ads/campaigns
func (h *AdHandler) ListCampaigns(c *gin.Context) {
	hospitalID, ok := mustHospitalID(c)
	if !ok {
		return
	}

	campaigns, err := h.adSvc.ListCampaigns(hospitalID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list campaigns"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": campaigns})
}

// PATCH /api/v1/ads/campaigns/:id/pause
func (h *AdHandler) PauseCampaign(c *gin.Context) {
	hospitalID, ok := mustHospitalID(c)
	if !ok {
		return
	}

	campaignID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil || campaignID < 1 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid campaign id"})
		return
	}

	if err := h.adSvc.PauseCampaign(hospitalID, campaignID); err != nil {
		switch {
		case errors.Is(err, service.ErrCampaignNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": "campaign not found"})
		case errors.Is(err, service.ErrCampaignAccessDenied):
			c.JSON(http.StatusForbidden, gin.H{"error": "access denied"})
		case errors.Is(err, service.ErrCampaignNotActive):
			c.JSON(http.StatusConflict, gin.H{"error": "campaign is not active"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to pause campaign"})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "campaign paused"})
}

// GET /api/v1/ads/campaigns/:id/report
func (h *AdHandler) GetCampaignReport(c *gin.Context) {
	hospitalID, ok := mustHospitalID(c)
	if !ok {
		return
	}

	campaignID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil || campaignID < 1 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid campaign id"})
		return
	}

	report, err := h.adSvc.GetCampaignReport(hospitalID, campaignID)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrCampaignNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": "campaign not found"})
		case errors.Is(err, service.ErrCampaignAccessDenied):
			c.JSON(http.StatusForbidden, gin.H{"error": "access denied"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get campaign report"})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": report})
}

// ---------------------------------------------------------------------------
// Feed (public)
// ---------------------------------------------------------------------------

// GET /api/v1/ads/feed
func (h *AdHandler) GetFeedAds(c *gin.Context) {
	placement := c.DefaultQuery("placement", "community_feed")

	count := 5
	if countStr := c.Query("count"); countStr != "" {
		if v, err := strconv.Atoi(countStr); err == nil && v > 0 && v <= 20 {
			count = v
		}
	}

	ads, err := h.adSvc.GetFeedAds(placement, count)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get feed ads"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": ads})
}

// POST /api/v1/ads/campaigns/:id/impression  (implicit — called by frontend)
func (h *AdHandler) RecordImpression(c *gin.Context) {
	campaignID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil || campaignID < 1 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid campaign id"})
		return
	}

	// Fire-and-forget; errors are non-fatal for the client.
	_ = h.adSvc.RecordAdImpression(campaignID)
	c.JSON(http.StatusNoContent, nil)
}

// POST /api/v1/ads/campaigns/:id/click  (implicit — called by frontend)
func (h *AdHandler) RecordClick(c *gin.Context) {
	campaignID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil || campaignID < 1 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid campaign id"})
		return
	}

	_ = h.adSvc.RecordAdClick(campaignID)
	c.JSON(http.StatusNoContent, nil)
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

// GET /api/v1/admin/ads/creatives
func (h *AdHandler) AdminListPendingCreatives(c *gin.Context) {
	creatives, err := h.adSvc.ListPendingCreatives()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list pending creatives"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": creatives})
}

// POST /api/v1/admin/ads/creatives/:id/review
func (h *AdHandler) AdminReviewCreative(c *gin.Context) {
	adminID, ok := mustUserID(c)
	if !ok {
		return
	}

	creativeID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil || creativeID < 1 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid creative id"})
		return
	}

	var req model.AdCreativeReviewRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "status (approved|rejected) is required"})
		return
	}

	if err := h.adSvc.ReviewCreative(adminID, creativeID, req); err != nil {
		switch {
		case errors.Is(err, service.ErrCreativeNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": "creative not found"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to review creative"})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "creative reviewed"})
}
