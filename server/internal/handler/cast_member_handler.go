package handler

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/letmein/server/internal/model"
	"github.com/letmein/server/internal/service"
)

type CastMemberHandler struct {
	castSvc service.CastMemberService
}

func NewCastMemberHandler(castSvc service.CastMemberService) *CastMemberHandler {
	return &CastMemberHandler{castSvc: castSvc}
}

// ──────────────────────────────────────────────
// GET /api/v1/cast-members
// ──────────────────────────────────────────────

func (h *CastMemberHandler) ListCastMembers(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	items, total, err := h.castSvc.ListCastMembers(page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list cast members"})
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
// GET /api/v1/cast-members/:id
// ──────────────────────────────────────────────

func (h *CastMemberHandler) GetCastMember(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid cast member id"})
		return
	}

	member, err := h.castSvc.GetCastMember(id)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrCastMemberNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": "cast member not found"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get cast member"})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": member})
}

// ──────────────────────────────────────────────
// POST /api/v1/cast-members/apply
// ──────────────────────────────────────────────

func (h *CastMemberHandler) ApplyForVerification(c *gin.Context) {
	userID, ok := mustUserID(c)
	if !ok {
		return
	}

	var req model.CastVerificationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	id, err := h.castSvc.ApplyForVerification(userID, req)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrCastMemberAlreadyExists):
			c.JSON(http.StatusConflict, gin.H{"error": "cast member application already exists"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to apply for verification"})
		}
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": gin.H{"id": id}})
}

// ──────────────────────────────────────────────
// POST /api/v1/cast-members/:id/follow
// ──────────────────────────────────────────────

func (h *CastMemberHandler) FollowCastMember(c *gin.Context) {
	userID, ok := mustUserID(c)
	if !ok {
		return
	}

	castMemberID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid cast member id"})
		return
	}

	if err := h.castSvc.FollowCastMember(userID, castMemberID); err != nil {
		switch {
		case errors.Is(err, service.ErrCastMemberNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": "cast member not found"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to follow cast member"})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "followed"})
}

// ──────────────────────────────────────────────
// DELETE /api/v1/cast-members/:id/follow
// ──────────────────────────────────────────────

func (h *CastMemberHandler) UnfollowCastMember(c *gin.Context) {
	userID, ok := mustUserID(c)
	if !ok {
		return
	}

	castMemberID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid cast member id"})
		return
	}

	if err := h.castSvc.UnfollowCastMember(userID, castMemberID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to unfollow cast member"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "unfollowed"})
}

// ──────────────────────────────────────────────
// GET /api/v1/cast-members/following
// ──────────────────────────────────────────────

func (h *CastMemberHandler) GetFollowingList(c *gin.Context) {
	userID, ok := mustUserID(c)
	if !ok {
		return
	}

	items, err := h.castSvc.GetFollowingList(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get following list"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": items})
}

// ──────────────────────────────────────────────
// GET /api/v1/cast-stories
// ──────────────────────────────────────────────

func (h *CastMemberHandler) ListStoryFeed(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	items, total, err := h.castSvc.GetStoryFeed(page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get story feed"})
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
// GET /api/v1/cast-stories/:id
// ──────────────────────────────────────────────

func (h *CastMemberHandler) GetStory(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid story id"})
		return
	}

	story, err := h.castSvc.GetStory(id)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrStoryNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": "story not found"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get story"})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": story})
}

// ──────────────────────────────────────────────
// POST /api/v1/cast-stories
// ──────────────────────────────────────────────

func (h *CastMemberHandler) CreateStory(c *gin.Context) {
	userID, ok := mustUserID(c)
	if !ok {
		return
	}

	var req model.CastStoryCreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	id, err := h.castSvc.CreateStory(userID, req)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrNotACastMember):
			c.JSON(http.StatusForbidden, gin.H{"error": "only approved cast members can post stories"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create story"})
		}
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": gin.H{"id": id}})
}

// ──────────────────────────────────────────────
// GET /api/v1/episodes
// ──────────────────────────────────────────────

func (h *CastMemberHandler) ListEpisodes(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	episodes, total, err := h.castSvc.ListEpisodes(page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list episodes"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": episodes,
		"meta": gin.H{
			"total": total,
			"page":  page,
			"limit": limit,
		},
	})
}

// ──────────────────────────────────────────────
// GET /api/v1/episodes/hero
// ──────────────────────────────────────────────

func (h *CastMemberHandler) GetHeroEpisodes(c *gin.Context) {
	episodes, err := h.castSvc.GetHeroEpisodes()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get hero episodes"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": episodes})
}

// ──────────────────────────────────────────────
// Admin: GET /api/v1/admin/cast-members
// ──────────────────────────────────────────────

func (h *CastMemberHandler) AdminListPending(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	items, total, err := h.castSvc.ListPendingCastMembers(page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list pending cast members"})
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
// Admin: POST /api/v1/admin/cast-members/:id/approve
// ──────────────────────────────────────────────

func (h *CastMemberHandler) AdminApprove(c *gin.Context) {
	adminUserID, ok := mustUserID(c)
	if !ok {
		return
	}

	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid cast member id"})
		return
	}

	if err := h.castSvc.ApproveVerification(adminUserID, id); err != nil {
		switch {
		case errors.Is(err, service.ErrCastMemberNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": "cast member not found"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to approve cast member"})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "cast member approved"})
}

// ──────────────────────────────────────────────
// Admin: POST /api/v1/admin/cast-members/:id/reject
// ──────────────────────────────────────────────

type adminRejectRequest struct {
	Reason string `json:"reason" binding:"required"`
}

func (h *CastMemberHandler) AdminReject(c *gin.Context) {
	adminUserID, ok := mustUserID(c)
	if !ok {
		return
	}

	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid cast member id"})
		return
	}

	var req adminRejectRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.castSvc.RejectVerification(adminUserID, id, req.Reason); err != nil {
		switch {
		case errors.Is(err, service.ErrCastMemberNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": "cast member not found"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to reject cast member"})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "cast member rejected"})
}

// ──────────────────────────────────────────────
// Admin: POST /api/v1/admin/episodes
// ──────────────────────────────────────────────

func (h *CastMemberHandler) AdminCreateEpisode(c *gin.Context) {
	var req model.YouTubeEpisodeCreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	id, err := h.castSvc.CreateEpisode(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create episode"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": gin.H{"id": id}})
}

// ──────────────────────────────────────────────
// Admin: POST /api/v1/admin/episodes/:id/cast-members
// ──────────────────────────────────────────────

type linkCastMemberRequest struct {
	CastMemberID int64 `json:"cast_member_id" binding:"required"`
}

func (h *CastMemberHandler) AdminLinkEpisodeCastMember(c *gin.Context) {
	episodeID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid episode id"})
		return
	}

	var req linkCastMemberRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.castSvc.LinkEpisodeCastMember(episodeID, req.CastMemberID); err != nil {
		switch {
		case errors.Is(err, service.ErrEpisodeNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": "episode not found"})
		case errors.Is(err, service.ErrCastMemberNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": "cast member not found"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to link cast member to episode"})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "cast member linked to episode"})
}
