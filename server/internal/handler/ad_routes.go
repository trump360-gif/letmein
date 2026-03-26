package handler

import (
	"database/sql"

	"github.com/gin-gonic/gin"
	"github.com/letmein/server/internal/middleware"
	"github.com/letmein/server/internal/repository"
	"github.com/letmein/server/internal/service"
	pkgauth "github.com/letmein/server/pkg/auth"
)

// RegisterAdRoutes wires native ad system routes into the router.
// It must be called from RegisterRoutes.
//
// Injected dependencies:
//   - db             — shared *sql.DB
//   - jwtManager     — for auth middleware
//   - hospitalRepo   — to resolve hospitalID in HospitalRequired middleware
//   - adminRequired  — pre-built admin middleware handler func
func RegisterAdRoutes(
	v1 *gin.RouterGroup,
	db *sql.DB,
	jwtManager *pkgauth.JWTManager,
	hospitalRepo repository.HospitalRepository,
	adminRequired gin.HandlerFunc,
) {
	adRepo := repository.NewAdRepository(db)
	adSvc := service.NewAdService(adRepo, hospitalRepo)
	adH := NewAdHandler(adSvc)

	hospitalOnly := middleware.HospitalRequired(jwtManager, hospitalRepo)

	// ---------------------------------------------------------------------------
	// Hospital-role-required ad routes
	// ---------------------------------------------------------------------------
	ads := v1.Group("/ads")
	{
		// Credit
		ads.GET("/credit", hospitalOnly, adH.GetCredit)
		ads.POST("/credit/charge", hospitalOnly, adH.ChargeCredit)

		// Creatives
		ads.POST("/creatives", hospitalOnly, adH.CreateCreative)
		ads.GET("/creatives", hospitalOnly, adH.ListCreatives)

		// Campaigns
		ads.POST("/campaigns", hospitalOnly, adH.CreateCampaign)
		ads.GET("/campaigns", hospitalOnly, adH.ListCampaigns)
		ads.PATCH("/campaigns/:id/pause", hospitalOnly, adH.PauseCampaign)
		ads.GET("/campaigns/:id/report", hospitalOnly, adH.GetCampaignReport)

		// Public feed injection
		ads.GET("/feed", adH.GetFeedAds)

		// Interaction tracking (public — no auth required, best-effort)
		ads.POST("/campaigns/:id/impression", adH.RecordImpression)
		ads.POST("/campaigns/:id/click", adH.RecordClick)
	}

	// ---------------------------------------------------------------------------
	// Admin routes
	// ---------------------------------------------------------------------------
	admin := v1.Group("/admin", adminRequired)
	{
		admin.GET("/ads/creatives", adH.AdminListPendingCreatives)
		admin.POST("/ads/creatives/:id/review", adH.AdminReviewCreative)
	}
}
