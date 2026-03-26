package handler

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/letmein/server/internal/repository"
	"github.com/letmein/server/internal/service"
)

// MediaHandler holds the media service dependency.
type MediaHandler struct {
	svc service.MediaService
}

func NewMediaHandler(svc service.MediaService) *MediaHandler {
	return &MediaHandler{svc: svc}
}

// Upload handles POST /api/v1/media/upload
// Multipart form fields: file, bucket, entity_type, entity_id (optional)
func (h *MediaHandler) Upload(c *gin.Context) {
	uploaderID, ok := uploaderIDFromContext(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	// Limit total request body to 10 MB.
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, 10<<20)

	file, header, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "file is required"})
		return
	}
	defer file.Close()

	bucket := c.PostForm("bucket")
	if bucket == "" {
		bucket = "public"
	}
	if bucket != "public" && bucket != "private" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "bucket must be public or private"})
		return
	}

	entityType := c.PostForm("entity_type")
	var entityID *int64
	if idStr := c.PostForm("entity_id"); idStr != "" {
		id, convErr := strconv.ParseInt(idStr, 10, 64)
		if convErr != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "entity_id must be an integer"})
			return
		}
		entityID = &id
	}

	img, err := h.svc.Upload(file, header, uploaderID, bucket, entityType, entityID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": img})
}

// GetByID handles GET /api/v1/media/:id
func (h *MediaHandler) GetByID(c *gin.Context) {
	id, err := parseIDParam(c, "id")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	img, err := h.svc.GetByID(id)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "image not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": img})
}

// Delete handles DELETE /api/v1/media/:id
// Only the original uploader or an admin may delete.
func (h *MediaHandler) Delete(c *gin.Context) {
	uploaderID, ok := uploaderIDFromContext(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	id, err := parseIDParam(c, "id")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	img, err := h.svc.GetByID(id)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "image not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}

	// Authorization: uploader or admin.
	role, _ := c.Get("role")
	if img.UploaderID != uploaderID && role != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
		return
	}

	if err := h.svc.Delete(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete image"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}

// --- context helpers ---

// uploaderIDFromContext reads the authenticated user ID from the Gin context.
// The auth middleware sets "userID" (int64) via middleware.ContextKeyUserID.
func uploaderIDFromContext(c *gin.Context) (int64, bool) {
	v, exists := c.Get("userID")
	if !exists {
		return 0, false
	}
	switch id := v.(type) {
	case int64:
		return id, true
	case float64:
		return int64(id), true
	case int:
		return int64(id), true
	}
	return 0, false
}

func parseIDParam(c *gin.Context, param string) (int64, error) {
	return strconv.ParseInt(c.Param(param), 10, 64)
}

