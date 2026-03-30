package handler

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/letmein/server/internal/repository"
	"github.com/letmein/server/internal/service"
)

type PostHandler struct {
	postSvc service.PostService
}

func NewPostHandler(postSvc service.PostService) *PostHandler {
	return &PostHandler{postSvc: postSvc}
}

// ──────────────────────────────────────────────
// POST /api/v1/posts
// ──────────────────────────────────────────────

type createPostRequest struct {
	BoardType     string  `json:"boardType"     binding:"required"`
	CategoryID    *int    `json:"categoryId"`
	Title         *string `json:"title"`
	Content       string  `json:"content"       binding:"required,min=20"`
	HospitalID    *int64  `json:"hospitalId"`
	ProcedureDate *string `json:"procedureDate"`
	IsAnonymous   bool    `json:"isAnonymous"`
	ImageIDs      []int64 `json:"imageIds"`
}

func (h *PostHandler) CreatePost(c *gin.Context) {
	userID, ok := mustUserID(c)
	if !ok {
		return
	}

	var req createPostRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	post, err := h.postSvc.CreatePost(userID, service.CreatePostInput{
		BoardType:     req.BoardType,
		CategoryID:    req.CategoryID,
		Title:         req.Title,
		Content:       req.Content,
		HospitalID:    req.HospitalID,
		ProcedureDate: req.ProcedureDate,
		IsAnonymous:   req.IsAnonymous,
		ImageIDs:      req.ImageIDs,
	})
	if err != nil {
		switch {
		case errors.Is(err, service.ErrInvalidBoardType):
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid board_type"})
		case errors.Is(err, service.ErrPostBlocked):
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create post"})
		}
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": post})
}

// ──────────────────────────────────────────────
// GET /api/v1/posts
// Query params:
//   cursor=<id>   — return posts with id < cursor (omit or 0 for first page)
//   limit=20      — max items per page (1–100)
//   board_type, sort, category_id, hospital_id — existing filters unchanged
//   page=1        — legacy param: treated as first page (other values ignored)
// ──────────────────────────────────────────────

func (h *PostHandler) ListPosts(c *gin.Context) {
	boardType := c.DefaultQuery("board_type", "before_after")
	sortBy := c.DefaultQuery("sort", "latest")

	limit := 20
	if v, err := strconv.Atoi(c.Query("limit")); err == nil && v > 0 && v <= 100 {
		limit = v
	}

	// cursor param: 0 means first page.
	var cursor int64
	if v, err := strconv.ParseInt(c.Query("cursor"), 10, 64); err == nil && v > 0 {
		cursor = v
	}

	var categoryID *int
	if v := c.Query("category_id"); v != "" {
		n, err := strconv.Atoi(v)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid category_id"})
			return
		}
		categoryID = &n
	}

	var hospitalID *int64
	if v := c.Query("hospital_id"); v != "" {
		n, err := strconv.ParseInt(v, 10, 64)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid hospital_id"})
			return
		}
		hospitalID = &n
	}

	params := repository.PostListParams{
		BoardType:  boardType,
		CategoryID: categoryID,
		HospitalID: hospitalID,
		SortBy:     sortBy,
		Cursor:     cursor,
		Limit:      limit,
	}

	items, nextCursor, err := h.postSvc.ListPosts(params)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list posts"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": items,
		"meta": gin.H{
			"next_cursor": nextCursor,
			"limit":       limit,
		},
	})
}

// ──────────────────────────────────────────────
// GET /api/v1/posts/:id
// ──────────────────────────────────────────────

func (h *PostHandler) GetPost(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid post id"})
		return
	}

	post, err := h.postSvc.GetPost(id)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrPostNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": "post not found"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get post"})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": post})
}

// ──────────────────────────────────────────────
// DELETE /api/v1/posts/:id
// ──────────────────────────────────────────────

func (h *PostHandler) DeletePost(c *gin.Context) {
	userID, ok := mustUserID(c)
	if !ok {
		return
	}

	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid post id"})
		return
	}

	if err := h.postSvc.DeletePost(userID, id); err != nil {
		switch {
		case errors.Is(err, service.ErrPostNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": "post not found"})
		case errors.Is(err, service.ErrForbidden):
			c.JSON(http.StatusForbidden, gin.H{"error": "not the post owner"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete post"})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "post deleted"})
}

// ──────────────────────────────────────────────
// POST /api/v1/posts/:id/comments
// ──────────────────────────────────────────────

type addCommentRequest struct {
	Content     string `json:"content"     binding:"required,min=1"`
	ParentID    *int64 `json:"parentId"`
	IsAnonymous bool   `json:"isAnonymous"`
}

func (h *PostHandler) AddComment(c *gin.Context) {
	userID, ok := mustUserID(c)
	if !ok {
		return
	}

	postID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid post id"})
		return
	}

	var req addCommentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	comment, err := h.postSvc.AddComment(userID, service.CreateCommentInput{
		PostID:      postID,
		ParentID:    req.ParentID,
		Content:     req.Content,
		IsAnonymous: req.IsAnonymous,
	})
	if err != nil {
		switch {
		case errors.Is(err, service.ErrPostNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": "post not found"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to add comment"})
		}
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": comment})
}

// ──────────────────────────────────────────────
// GET /api/v1/posts/:id/comments
// ──────────────────────────────────────────────

func (h *PostHandler) GetComments(c *gin.Context) {
	postID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid post id"})
		return
	}

	comments, err := h.postSvc.GetComments(postID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get comments"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": comments})
}

// ──────────────────────────────────────────────
// POST /api/v1/posts/:id/like
// ──────────────────────────────────────────────

func (h *PostHandler) ToggleLike(c *gin.Context) {
	userID, ok := mustUserID(c)
	if !ok {
		return
	}

	postID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid post id"})
		return
	}

	liked, count, err := h.postSvc.ToggleLike(userID, postID)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrPostNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": "post not found"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to toggle like"})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": gin.H{
			"liked": liked,
			"count": count,
		},
	})
}

// ──────────────────────────────────────────────
// POST /api/v1/reports
// ──────────────────────────────────────────────

type createReportRequest struct {
	TargetType  string  `json:"targetType"  binding:"required,oneof=post comment"`
	TargetID    int64   `json:"targetId"    binding:"required"`
	Reason      string  `json:"reason"      binding:"required"`
	Description *string `json:"description"`
}

func (h *PostHandler) CreateReport(c *gin.Context) {
	userID, ok := mustUserID(c)
	if !ok {
		return
	}

	var req createReportRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	report, err := h.postSvc.ReportContent(userID, service.CreateReportInput{
		TargetType:  req.TargetType,
		TargetID:    req.TargetID,
		Reason:      req.Reason,
		Description: req.Description,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to submit report"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": report})
}
