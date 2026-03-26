package handler

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/letmein/server/internal/service"
)

type CategoryHandler struct {
	categorySvc service.CategoryService
}

func NewCategoryHandler(categorySvc service.CategoryService) *CategoryHandler {
	return &CategoryHandler{categorySvc: categorySvc}
}

// GET /api/v1/categories
func (h *CategoryHandler) List(c *gin.Context) {
	cats, err := h.categorySvc.GetAllCategories()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get categories"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": cats})
}

// GET /api/v1/categories/:id/details
func (h *CategoryHandler) GetDetails(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil || id < 1 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid category id"})
		return
	}

	details, err := h.categorySvc.GetDetailsByCategory(id)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrCategoryNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": "category not found"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get procedure details"})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": details})
}
