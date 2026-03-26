package handler

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/letmein/server/internal/middleware"
	"github.com/letmein/server/internal/service"
)

type HospitalHandler struct {
	hospitalSvc service.HospitalService
}

func NewHospitalHandler(hospitalSvc service.HospitalService) *HospitalHandler {
	return &HospitalHandler{hospitalSvc: hospitalSvc}
}

// POST /api/v1/hospitals/register
func (h *HospitalHandler) Register(c *gin.Context) {
	userID, ok := mustUserID(c)
	if !ok {
		return
	}

	var req struct {
		Name           string `json:"name"           binding:"required,min=1,max=100"`
		BusinessNumber string `json:"businessNumber"`
		LicenseImage   string `json:"licenseImage"`
		Address        string `json:"address"`
		Phone          string `json:"phone"`
		OperatingHours string `json:"operatingHours"`
		Description    string `json:"description"`
		SpecialtyIDs   []int  `json:"specialtyIds"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "name is required (max 100 chars)"})
		return
	}

	hospital, err := h.hospitalSvc.Register(userID, service.RegisterInput{
		Name:           req.Name,
		BusinessNumber: req.BusinessNumber,
		LicenseImage:   req.LicenseImage,
		Address:        req.Address,
		Phone:          req.Phone,
		OperatingHours: req.OperatingHours,
		Description:    req.Description,
		SpecialtyIDs:   req.SpecialtyIDs,
	})
	if err != nil {
		switch {
		case errors.Is(err, service.ErrHospitalExists):
			c.JSON(http.StatusConflict, gin.H{"error": "hospital already registered for this account"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to register hospital"})
		}
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": hospital})
}

// GET /api/v1/hospitals/profile
func (h *HospitalHandler) GetProfile(c *gin.Context) {
	userID, ok := mustUserID(c)
	if !ok {
		return
	}

	hospital, err := h.hospitalSvc.GetProfileByUserID(userID)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrHospitalNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": "hospital not found"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get hospital profile"})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": hospital})
}

// PUT /api/v1/hospitals/profile
func (h *HospitalHandler) UpdateProfile(c *gin.Context) {
	userID, ok := mustUserID(c)
	if !ok {
		return
	}

	// First resolve the hospital owned by this user.
	existing, err := h.hospitalSvc.GetProfileByUserID(userID)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrHospitalNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": "hospital not found"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get hospital"})
		}
		return
	}

	var req struct {
		Name           string  `json:"name"           binding:"required,min=1,max=100"`
		Description    *string `json:"description"`
		Address        *string `json:"address"`
		Phone          *string `json:"phone"`
		OperatingHours *string `json:"operatingHours"`
		ProfileImage   *string `json:"profileImage"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "name is required (max 100 chars)"})
		return
	}

	updated, err := h.hospitalSvc.UpdateProfile(existing.ID, service.UpdateProfileInput{
		Name:           req.Name,
		Description:    req.Description,
		Address:        req.Address,
		Phone:          req.Phone,
		OperatingHours: req.OperatingHours,
		ProfileImage:   req.ProfileImage,
	})
	if err != nil {
		switch {
		case errors.Is(err, service.ErrHospitalNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": "hospital not found"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update hospital profile"})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": updated})
}

// GET /api/v1/hospitals/dashboard
func (h *HospitalHandler) GetDashboard(c *gin.Context) {
	userID, ok := mustUserID(c)
	if !ok {
		return
	}

	hospital, err := h.hospitalSvc.GetProfileByUserID(userID)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrHospitalNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": "hospital not found"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get hospital"})
		}
		return
	}

	stats, err := h.hospitalSvc.GetDashboard(hospital.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get dashboard stats"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": stats})
}

// GET /api/v1/hospitals
func (h *HospitalHandler) Search(c *gin.Context) {
	params := service.HospitalSearchParams{
		Query:  c.Query("q"),
		Region: c.Query("region"),
		SortBy: c.Query("sort"),
	}

	if catStr := c.Query("category_id"); catStr != "" {
		catID, err := strconv.Atoi(catStr)
		if err != nil || catID < 1 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid category_id"})
			return
		}
		params.CategoryID = &catID
	}

	page := 1
	if pageStr := c.Query("page"); pageStr != "" {
		if v, err := strconv.Atoi(pageStr); err == nil && v > 0 {
			page = v
		}
	}
	params.Page = page

	limit := 20
	if limitStr := c.Query("limit"); limitStr != "" {
		if v, err := strconv.Atoi(limitStr); err == nil && v > 0 && v <= 100 {
			limit = v
		}
	}
	params.Limit = limit

	result, err := h.hospitalSvc.Search(params)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to search hospitals"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": result.Data,
		"meta": result.Meta,
	})
}

// GET /api/v1/hospitals/:id
func (h *HospitalHandler) GetByID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil || id < 1 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid hospital id"})
		return
	}

	hospital, err := h.hospitalSvc.GetProfile(id)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrHospitalNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": "hospital not found"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get hospital"})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": hospital})
}

// mustUserID extracts the authenticated user ID from the Gin context.
// It writes a 401 and returns false if not present.
func mustUserID(c *gin.Context) (int64, bool) {
	raw, exists := c.Get(middleware.ContextKeyUserID)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return 0, false
	}
	uid, ok := raw.(int64)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return 0, false
	}
	return uid, true
}
