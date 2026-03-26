package handler

import (
	"errors"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/letmein/server/internal/model"
	"github.com/letmein/server/internal/service"
)

// PremiumHandler handles premium subscription and doctor management endpoints.
type PremiumHandler struct {
	premiumSvc service.PremiumService
}

func NewPremiumHandler(premiumSvc service.PremiumService) *PremiumHandler {
	return &PremiumHandler{premiumSvc: premiumSvc}
}

// PUT /api/v1/hospitals/premium/subscribe
func (h *PremiumHandler) Subscribe(c *gin.Context) {
	hospitalID, ok := mustHospitalID(c)
	if !ok {
		return
	}

	var req struct {
		Tier         string    `json:"tier"          binding:"required,oneof=basic pro"`
		MonthlyPrice int       `json:"monthly_price" binding:"required,min=1"`
		ExpiresAt    time.Time `json:"expires_at"    binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "tier (basic|pro), monthly_price, and expires_at are required"})
		return
	}

	sub, err := h.premiumSvc.SubscribePremium(hospitalID, req.Tier, req.MonthlyPrice, req.ExpiresAt)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrAlreadySubscribed):
			c.JSON(http.StatusConflict, gin.H{"error": "hospital already has an active premium subscription"})
		case errors.Is(err, service.ErrHospitalNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": "hospital not found"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to subscribe to premium"})
		}
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": sub})
}

// DELETE /api/v1/hospitals/premium/subscribe
func (h *PremiumHandler) CancelSubscription(c *gin.Context) {
	hospitalID, ok := mustHospitalID(c)
	if !ok {
		return
	}

	if err := h.premiumSvc.CancelPremium(hospitalID); err != nil {
		switch {
		case errors.Is(err, service.ErrSubscriptionNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": "no active premium subscription found"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to cancel subscription"})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "premium subscription cancelled"})
}

// GET /api/v1/hospitals/premium/status
func (h *PremiumHandler) GetStatus(c *gin.Context) {
	hospitalID, ok := mustHospitalID(c)
	if !ok {
		return
	}

	sub, err := h.premiumSvc.GetPremiumStatus(hospitalID)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrSubscriptionNotFound):
			c.JSON(http.StatusOK, gin.H{"data": nil, "is_premium": false})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get premium status"})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": sub, "is_premium": true})
}

// POST /api/v1/hospitals/doctors
func (h *PremiumHandler) AddDoctor(c *gin.Context) {
	hospitalID, ok := mustHospitalID(c)
	if !ok {
		return
	}

	var req model.DoctorCreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "name is required (max 50 chars)"})
		return
	}

	doctor, err := h.premiumSvc.AddDoctor(hospitalID, req)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrPremiumRequired):
			c.JSON(http.StatusForbidden, gin.H{"error": "premium subscription required to add doctors"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to add doctor"})
		}
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": doctor})
}

// GET /api/v1/hospitals/doctors
func (h *PremiumHandler) ListDoctors(c *gin.Context) {
	hospitalID, ok := mustHospitalID(c)
	if !ok {
		return
	}

	doctors, err := h.premiumSvc.ListDoctors(hospitalID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list doctors"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": doctors})
}

// PUT /api/v1/hospitals/doctors/:id
func (h *PremiumHandler) UpdateDoctor(c *gin.Context) {
	hospitalID, ok := mustHospitalID(c)
	if !ok {
		return
	}

	doctorID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil || doctorID < 1 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid doctor id"})
		return
	}

	var req model.DoctorCreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "name is required (max 50 chars)"})
		return
	}

	if err := h.premiumSvc.UpdateDoctor(hospitalID, doctorID, req); err != nil {
		switch {
		case errors.Is(err, service.ErrDoctorNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": "doctor not found"})
		case errors.Is(err, service.ErrDoctorAccessDenied):
			c.JSON(http.StatusForbidden, gin.H{"error": "access denied"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update doctor"})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "doctor updated"})
}

// DELETE /api/v1/hospitals/doctors/:id
func (h *PremiumHandler) DeleteDoctor(c *gin.Context) {
	hospitalID, ok := mustHospitalID(c)
	if !ok {
		return
	}

	doctorID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil || doctorID < 1 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid doctor id"})
		return
	}

	if err := h.premiumSvc.DeleteDoctor(hospitalID, doctorID); err != nil {
		switch {
		case errors.Is(err, service.ErrDoctorNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": "doctor not found"})
		case errors.Is(err, service.ErrDoctorAccessDenied):
			c.JSON(http.StatusForbidden, gin.H{"error": "access denied"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete doctor"})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "doctor deleted"})
}

// GET /api/v1/hospitals/premium/search
func (h *PremiumHandler) SearchPremium(c *gin.Context) {
	var categoryID int
	if catStr := c.Query("category_id"); catStr != "" {
		v, err := strconv.Atoi(catStr)
		if err != nil || v < 1 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid category_id"})
			return
		}
		categoryID = v
	}

	limit := 20
	if limitStr := c.Query("limit"); limitStr != "" {
		if v, err := strconv.Atoi(limitStr); err == nil && v > 0 && v <= 100 {
			limit = v
		}
	}

	items, err := h.premiumSvc.GetPremiumHospitalsForSearch(categoryID, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to search premium hospitals"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": items})
}

// GET /api/v1/hospitals/recommended
func (h *PremiumHandler) GetRecommended(c *gin.Context) {
	limit := 10
	if limitStr := c.Query("limit"); limitStr != "" {
		if v, err := strconv.Atoi(limitStr); err == nil && v > 0 && v <= 50 {
			limit = v
		}
	}

	items, err := h.premiumSvc.GetRecommendedHospitals(limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get recommended hospitals"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": items})
}

// ---------------------------------------------------------------------------
// Admin handlers
// ---------------------------------------------------------------------------

// GET /api/v1/admin/subscriptions
func (h *PremiumHandler) AdminListSubscriptions(c *gin.Context) {
	page := 1
	if pageStr := c.Query("page"); pageStr != "" {
		if v, err := strconv.Atoi(pageStr); err == nil && v > 0 {
			page = v
		}
	}
	limit := 20
	if limitStr := c.Query("limit"); limitStr != "" {
		if v, err := strconv.Atoi(limitStr); err == nil && v > 0 && v <= 100 {
			limit = v
		}
	}

	items, total, err := h.premiumSvc.AdminListSubscriptions(page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list subscriptions"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": items,
		"meta": gin.H{"total": total, "page": page, "limit": limit},
	})
}

// POST /api/v1/admin/subscriptions/:id/grant
func (h *PremiumHandler) AdminGrantSubscription(c *gin.Context) {
	idStr := c.Param("id")
	hospitalID, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil || hospitalID < 1 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid hospital id"})
		return
	}

	var req struct {
		Tier         string    `json:"tier"          binding:"required,oneof=basic pro"`
		MonthlyPrice int       `json:"monthly_price" binding:"required,min=0"`
		ExpiresAt    time.Time `json:"expires_at"    binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "tier, monthly_price, and expires_at are required"})
		return
	}

	sub, err := h.premiumSvc.AdminGrantSubscription(hospitalID, req.Tier, req.MonthlyPrice, req.ExpiresAt)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrAlreadySubscribed):
			c.JSON(http.StatusConflict, gin.H{"error": "hospital already has an active subscription"})
		case errors.Is(err, service.ErrHospitalNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": "hospital not found"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to grant subscription"})
		}
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": sub})
}

// DELETE /api/v1/admin/subscriptions/:id
func (h *PremiumHandler) AdminCancelSubscription(c *gin.Context) {
	idStr := c.Param("id")
	subID, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil || subID < 1 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid subscription id"})
		return
	}

	if err := h.premiumSvc.AdminCancelSubscription(subID); err != nil {
		switch {
		case errors.Is(err, service.ErrSubscriptionNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": "subscription not found"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to cancel subscription"})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "subscription cancelled"})
}
