package handler

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/letmein/server/internal/service"
)

// ConsultationHandler handles all reverse-auction consultation endpoints.
type ConsultationHandler struct {
	consultSvc     service.ConsultationService
	coordinatorSvc service.CoordinatorService
}

// NewConsultationHandler constructs a ConsultationHandler.
func NewConsultationHandler(consultSvc service.ConsultationService) *ConsultationHandler {
	return &ConsultationHandler{consultSvc: consultSvc}
}

// WithCoordinatorService attaches a CoordinatorService to support the matches endpoint.
func (h *ConsultationHandler) WithCoordinatorService(svc service.CoordinatorService) *ConsultationHandler {
	h.coordinatorSvc = svc
	return h
}

// ---------------------------------------------------------------------------
// User endpoints
// ---------------------------------------------------------------------------

// POST /api/v1/consultations
func (h *ConsultationHandler) CreateRequest(c *gin.Context) {
	userID, ok := mustUserID(c)
	if !ok {
		return
	}

	var req struct {
		CategoryID      int     `json:"categoryId"      binding:"required,min=1"`
		DetailIDs       []int   `json:"detailIds"`
		Description     string  `json:"description"     binding:"max=500"`
		PreferredPeriod string  `json:"preferredPeriod"`
		PhotoPublic     *bool   `json:"photoPublic"`
		ImageIDs        []int64 `json:"imageIds"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "categoryId is required"})
		return
	}

	photoPublic := true
	if req.PhotoPublic != nil {
		photoPublic = *req.PhotoPublic
	}

	created, err := h.consultSvc.CreateRequest(userID, service.CreateRequestInput{
		CategoryID:      req.CategoryID,
		DetailIDs:       req.DetailIDs,
		Description:     req.Description,
		PreferredPeriod: req.PreferredPeriod,
		PhotoPublic:     photoPublic,
		ImageIDs:        req.ImageIDs,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create consultation request"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": created})
}

// GET /api/v1/consultations
func (h *ConsultationHandler) GetUserRequests(c *gin.Context) {
	userID, ok := mustUserID(c)
	if !ok {
		return
	}

	status := c.Query("status")
	page, limit := parsePagination(c)

	result, err := h.consultSvc.GetUserRequests(userID, status, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get consultation requests"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": result.Data,
		"meta": result.Meta,
	})
}

// GET /api/v1/consultations/:id
func (h *ConsultationHandler) GetRequestDetail(c *gin.Context) {
	userID, ok := mustUserID(c)
	if !ok {
		return
	}

	requestID, ok := mustParamID(c, "id")
	if !ok {
		return
	}

	item, err := h.consultSvc.GetRequestDetail(userID, requestID)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrConsultationNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": "consultation request not found"})
		case errors.Is(err, service.ErrConsultationForbidden):
			c.JSON(http.StatusForbidden, gin.H{"error": "access denied"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get consultation request"})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": item})
}

// POST /api/v1/consultations/:id/select
func (h *ConsultationHandler) SelectHospital(c *gin.Context) {
	userID, ok := mustUserID(c)
	if !ok {
		return
	}

	requestID, ok := mustParamID(c, "id")
	if !ok {
		return
	}

	var req struct {
		ResponseID int64 `json:"responseId" binding:"required,min=1"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "responseId is required"})
		return
	}

	result, err := h.consultSvc.SelectHospital(userID, requestID, req.ResponseID)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrConsultationNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": "consultation request or response not found"})
		case errors.Is(err, service.ErrConsultationForbidden):
			c.JSON(http.StatusForbidden, gin.H{"error": "access denied"})
		case errors.Is(err, service.ErrConsultationNotActive):
			c.JSON(http.StatusConflict, gin.H{"error": "consultation request is no longer active"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to select hospital"})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": result})
}

// DELETE /api/v1/consultations/:id
func (h *ConsultationHandler) CancelRequest(c *gin.Context) {
	userID, ok := mustUserID(c)
	if !ok {
		return
	}

	requestID, ok := mustParamID(c, "id")
	if !ok {
		return
	}

	if err := h.consultSvc.CancelRequest(userID, requestID); err != nil {
		switch {
		case errors.Is(err, service.ErrConsultationNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": "consultation request not found or already cancelled"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to cancel consultation request"})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "consultation request cancelled"})
}

// ---------------------------------------------------------------------------
// Hospital endpoints
// ---------------------------------------------------------------------------

// GET /api/v1/consultations/hospital
func (h *ConsultationHandler) GetHospitalRequests(c *gin.Context) {
	hospitalID, ok := mustHospitalID(c)
	if !ok {
		return
	}

	page, limit := parsePagination(c)

	result, err := h.consultSvc.GetHospitalRequests(hospitalID, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get consultation requests"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": result.Data,
		"meta": result.Meta,
	})
}

// GET /api/v1/consultations/:id/detail
func (h *ConsultationHandler) GetRequestDetailForHospital(c *gin.Context) {
	hospitalID, ok := mustHospitalID(c)
	if !ok {
		return
	}

	requestID, ok := mustParamID(c, "id")
	if !ok {
		return
	}

	item, err := h.consultSvc.GetRequestDetailForHospital(hospitalID, requestID)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrConsultationNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": "consultation request not found"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get consultation request"})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": item})
}

// POST /api/v1/consultations/:id/respond
func (h *ConsultationHandler) SendResponse(c *gin.Context) {
	hospitalID, ok := mustHospitalID(c)
	if !ok {
		return
	}

	requestID, ok := mustParamID(c, "id")
	if !ok {
		return
	}

	var req struct {
		Intro          string `json:"intro"          binding:"omitempty,max=60"`
		Experience     string `json:"experience"     binding:"omitempty,max=60"`
		Message        string `json:"message"        binding:"required,min=10,max=3000"`
		ConsultMethods string `json:"consultMethods"`
		ConsultHours   string `json:"consultHours"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "message is required (10-3000 chars); intro and experience are optional (max 60 chars each)"})
		return
	}

	resp, err := h.consultSvc.SendResponse(hospitalID, requestID, service.SendResponseInput{
		Intro:          req.Intro,
		Experience:     req.Experience,
		Message:        req.Message,
		ConsultMethods: req.ConsultMethods,
		ConsultHours:   req.ConsultHours,
	})
	if err != nil {
		switch {
		case errors.Is(err, service.ErrConsultationNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": "consultation request not found"})
		case errors.Is(err, service.ErrConsultationNotActive):
			c.JSON(http.StatusConflict, gin.H{"error": "consultation request is no longer active"})
		case errors.Is(err, service.ErrResponseSlotFull):
			c.JSON(http.StatusConflict, gin.H{"error": "consultation has reached the maximum number of responses (5)"})
		case errors.Is(err, service.ErrAlreadyResponded):
			c.JSON(http.StatusConflict, gin.H{"error": "hospital already responded to this consultation request"})
		case errors.Is(err, service.ErrMessageFiltered):
			c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error()})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to send response"})
		}
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": resp})
}

// ---------------------------------------------------------------------------
// Coordinator match endpoints
// ---------------------------------------------------------------------------

// GET /api/v1/consultations/:id/matches
func (h *ConsultationHandler) GetMatches(c *gin.Context) {
	if h.coordinatorSvc == nil {
		c.JSON(http.StatusNotImplemented, gin.H{"error": "coordinator service not configured"})
		return
	}

	userID, ok := mustUserID(c)
	if !ok {
		return
	}

	requestID, ok := mustParamID(c, "id")
	if !ok {
		return
	}

	matches, err := h.coordinatorSvc.GetMatchesForUser(userID, requestID)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrConsultationNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": "consultation request not found"})
		case errors.Is(err, service.ErrConsultationForbidden):
			c.JSON(http.StatusForbidden, gin.H{"error": "access denied"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get matches"})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": matches})
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// mustHospitalID extracts the hospitalID set by HospitalRequired middleware.
func mustHospitalID(c *gin.Context) (int64, bool) {
	raw, exists := c.Get("hospitalID")
	if !exists {
		c.JSON(http.StatusForbidden, gin.H{"error": "hospital role required"})
		return 0, false
	}
	hid, ok := raw.(int64)
	if !ok {
		c.JSON(http.StatusForbidden, gin.H{"error": "hospital role required"})
		return 0, false
	}
	return hid, true
}

// mustParamID parses a named route parameter as an int64.
func mustParamID(c *gin.Context, param string) (int64, bool) {
	idStr := c.Param(param)
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil || id < 1 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid " + param})
		return 0, false
	}
	return id, true
}

// parsePagination extracts page and limit query parameters with safe defaults.
func parsePagination(c *gin.Context) (page, limit int) {
	page = 1
	if v, err := strconv.Atoi(c.Query("page")); err == nil && v > 0 {
		page = v
	}
	limit = 20
	if v, err := strconv.Atoi(c.Query("limit")); err == nil && v > 0 && v <= 100 {
		limit = v
	}
	return page, limit
}
