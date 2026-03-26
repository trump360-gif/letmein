package handler

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/letmein/server/internal/repository"
	"github.com/letmein/server/internal/service"
)

// AdminHandler handles all admin-only API endpoints.
type AdminHandler struct {
	adminRepo    repository.AdminRepository
	coordinatorSvc service.CoordinatorService
}

// NewAdminHandler constructs an AdminHandler.
func NewAdminHandler(adminRepo repository.AdminRepository) *AdminHandler {
	return &AdminHandler{adminRepo: adminRepo}
}

// NewAdminHandlerWithCoordinator constructs an AdminHandler with coordinator matching support.
func NewAdminHandlerWithCoordinator(adminRepo repository.AdminRepository, coordinatorSvc service.CoordinatorService) *AdminHandler {
	return &AdminHandler{adminRepo: adminRepo, coordinatorSvc: coordinatorSvc}
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

// GET /api/v1/admin/dashboard/stats
func (h *AdminHandler) DashboardStats(c *gin.Context) {
	stats, err := h.adminRepo.DashboardStats()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get dashboard stats"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": stats})
}

// GET /api/v1/admin/dashboard/todo
func (h *AdminHandler) DashboardTodo(c *gin.Context) {
	stats, err := h.adminRepo.DashboardStats()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get todo items"})
		return
	}

	items := []gin.H{
		{"type": "hospital_approval", "count": stats.PendingHospitals},
		{"type": "report_pending", "count": stats.PendingReports},
	}
	c.JSON(http.StatusOK, gin.H{"data": gin.H{"items": items}})
}

// GET /api/v1/admin/dashboard/activity
func (h *AdminHandler) DashboardActivity(c *gin.Context) {
	items, err := h.adminRepo.RecentActivity(10)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get recent activity"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": gin.H{"items": items}})
}

// GET /api/v1/admin/dashboard/chart?days=7
func (h *AdminHandler) DashboardChart(c *gin.Context) {
	days := 7
	if v, err := strconv.Atoi(c.Query("days")); err == nil && v > 0 && v <= 90 {
		days = v
	}

	data, err := h.adminRepo.ChartData(days)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get chart data"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": data})
}

// ---------------------------------------------------------------------------
// Hospitals
// ---------------------------------------------------------------------------

// GET /api/v1/admin/hospitals?status=&page=&limit=
func (h *AdminHandler) ListHospitals(c *gin.Context) {
	status := c.Query("status")
	page, limit := parsePagination(c)

	hospitals, total, err := h.adminRepo.ListAllHospitals(status, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list hospitals"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": hospitals,
		"meta": gin.H{
			"total": total,
			"page":  page,
			"limit": limit,
		},
	})
}

// POST /api/v1/admin/hospitals/:id/approve
func (h *AdminHandler) ApproveHospital(c *gin.Context) {
	id, ok := mustParamID(c, "id")
	if !ok {
		return
	}

	if err := h.adminRepo.ApproveHospital(id); err != nil {
		switch {
		case errors.Is(err, repository.ErrNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": "hospital not found"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to approve hospital"})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": gin.H{"id": id, "status": "approved"}})
}

// POST /api/v1/admin/hospitals/:id/reject
func (h *AdminHandler) RejectHospital(c *gin.Context) {
	id, ok := mustParamID(c, "id")
	if !ok {
		return
	}

	if err := h.adminRepo.RejectHospital(id); err != nil {
		switch {
		case errors.Is(err, repository.ErrNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": "hospital not found"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to reject hospital"})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": gin.H{"id": id, "status": "rejected"}})
}

// ---------------------------------------------------------------------------
// Consultations
// ---------------------------------------------------------------------------

// GET /api/v1/admin/consultations?status=&page=&limit=
func (h *AdminHandler) ListConsultations(c *gin.Context) {
	status := c.Query("status")
	page, limit := parsePagination(c)

	items, total, err := h.adminRepo.ListAllConsultations(status, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list consultations"})
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

// GET /api/v1/admin/consultations/:id
func (h *AdminHandler) GetConsultation(c *gin.Context) {
	id, ok := mustParamID(c, "id")
	if !ok {
		return
	}

	item, err := h.adminRepo.GetConsultationAdmin(id)
	if err != nil {
		switch {
		case errors.Is(err, repository.ErrNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": "consultation not found"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get consultation"})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": item})
}

// ---------------------------------------------------------------------------
// Categories (CRUD)
// ---------------------------------------------------------------------------

// POST /api/v1/admin/categories
func (h *AdminHandler) CreateCategory(c *gin.Context) {
	var req struct {
		Name      string `json:"name"       binding:"required,min=1,max=50"`
		Icon      string `json:"icon"`
		SortOrder int    `json:"sort_order"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "name is required (max 50 chars)"})
		return
	}

	cat, err := h.adminRepo.CreateCategory(req.Name, req.Icon, req.SortOrder)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create category"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": cat})
}

// PATCH /api/v1/admin/categories/:id
func (h *AdminHandler) UpdateCategory(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil || id < 1 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid category id"})
		return
	}

	var req struct {
		Name      string `json:"name"       binding:"required,min=1,max=50"`
		Icon      string `json:"icon"`
		SortOrder int    `json:"sort_order"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "name is required (max 50 chars)"})
		return
	}

	cat, err := h.adminRepo.UpdateCategory(id, req.Name, req.Icon, req.SortOrder)
	if err != nil {
		switch {
		case errors.Is(err, repository.ErrNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": "category not found"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update category"})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": cat})
}

// DELETE /api/v1/admin/categories/:id
func (h *AdminHandler) DeleteCategory(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil || id < 1 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid category id"})
		return
	}

	if err := h.adminRepo.DeleteCategory(id); err != nil {
		switch {
		case errors.Is(err, repository.ErrNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": "category not found"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete category"})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": gin.H{"id": id, "deleted": true}})
}

// ---------------------------------------------------------------------------
// Procedure details (CRUD)
// ---------------------------------------------------------------------------

// POST /api/v1/admin/categories/:id/procedures
func (h *AdminHandler) CreateProcedure(c *gin.Context) {
	idStr := c.Param("id")
	categoryID, err := strconv.Atoi(idStr)
	if err != nil || categoryID < 1 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid category id"})
		return
	}

	var req struct {
		Name      string `json:"name"       binding:"required,min=1,max=100"`
		SortOrder int    `json:"sort_order"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "name is required (max 100 chars)"})
		return
	}

	detail, err := h.adminRepo.CreateProcedureDetail(categoryID, req.Name, req.SortOrder)
	if err != nil {
		switch {
		case errors.Is(err, repository.ErrNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": "category not found"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create procedure detail"})
		}
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": detail})
}

// PATCH /api/v1/admin/procedures/:id
func (h *AdminHandler) UpdateProcedure(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil || id < 1 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid procedure id"})
		return
	}

	var req struct {
		Name      string `json:"name"       binding:"required,min=1,max=100"`
		SortOrder int    `json:"sort_order"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "name is required (max 100 chars)"})
		return
	}

	detail, err := h.adminRepo.UpdateProcedureDetail(id, req.Name, req.SortOrder)
	if err != nil {
		switch {
		case errors.Is(err, repository.ErrNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": "procedure detail not found"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update procedure detail"})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": detail})
}

// DELETE /api/v1/admin/procedures/:id
func (h *AdminHandler) DeleteProcedure(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil || id < 1 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid procedure id"})
		return
	}

	if err := h.adminRepo.DeleteProcedureDetail(id); err != nil {
		switch {
		case errors.Is(err, repository.ErrNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": "procedure detail not found"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete procedure detail"})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": gin.H{"id": id, "deleted": true}})
}

// ---------------------------------------------------------------------------
// Coordinator matching
// ---------------------------------------------------------------------------

// POST /api/v1/admin/consultations/:id/match
func (h *AdminHandler) MatchHospitals(c *gin.Context) {
	if h.coordinatorSvc == nil {
		c.JSON(http.StatusNotImplemented, gin.H{"error": "coordinator service not configured"})
		return
	}

	coordinatorID, ok := mustUserID(c)
	if !ok {
		return
	}

	requestID, ok := mustParamID(c, "id")
	if !ok {
		return
	}

	var req struct {
		HospitalIDs []int64 `json:"hospital_ids" binding:"required,min=2,max=3,dive,min=1"`
		Note        string  `json:"note"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "hospital_ids is required (2–3 hospital IDs)"})
		return
	}

	result, err := h.coordinatorSvc.MatchHospitals(requestID, req.HospitalIDs, coordinatorID, req.Note)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrConsultationNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": "consultation request not found"})
		case errors.Is(err, service.ErrCoordinatorRequestNotActive):
			c.JSON(http.StatusConflict, gin.H{"error": "consultation request is not in an active state"})
		case errors.Is(err, service.ErrCoordinatorAlreadyMatched):
			c.JSON(http.StatusConflict, gin.H{"error": "one or more hospitals are already matched to this request"})
		case errors.Is(err, service.ErrCoordinatorInvalidHospitals):
			c.JSON(http.StatusBadRequest, gin.H{"error": "between 2 and 3 hospitals must be provided"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to match hospitals"})
		}
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": result})
}
