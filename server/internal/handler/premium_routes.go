package handler

import (
	"database/sql"

	"github.com/gin-gonic/gin"
	"github.com/letmein/server/internal/middleware"
	"github.com/letmein/server/internal/repository"
	"github.com/letmein/server/internal/service"
	pkgauth "github.com/letmein/server/pkg/auth"
)

// RegisterPremiumRoutes wires premium subscription and doctor routes into the router.
// It must be called from RegisterRoutes after the hospitalRepo dependency is available.
//
// Injected dependencies:
//   - db          — shared *sql.DB
//   - jwtManager  — for auth middleware
//   - hospitalRepo — to resolve hospitalID in HospitalRequired middleware
//   - adminRequired — pre-built admin middleware handler func
func RegisterPremiumRoutes(
	v1 *gin.RouterGroup,
	db *sql.DB,
	jwtManager *pkgauth.JWTManager,
	hospitalRepo repository.HospitalRepository,
	adminRequired gin.HandlerFunc,
) {
	premiumRepo := repository.NewPremiumRepository(db)
	doctorRepo := repository.NewDoctorRepository(db)
	premiumSvc := service.NewPremiumService(premiumRepo, doctorRepo, hospitalRepo)
	premiumH := NewPremiumHandler(premiumSvc)

	hospitalOnly := middleware.HospitalRequired(jwtManager, hospitalRepo)

	// ---------------------------------------------------------------------------
	// Hospital-role-required routes
	// ---------------------------------------------------------------------------
	hospitals := v1.Group("/hospitals")
	{
		// Premium subscription lifecycle
		hospitals.PUT("/premium/subscribe", hospitalOnly, premiumH.Subscribe)
		hospitals.DELETE("/premium/subscribe", hospitalOnly, premiumH.CancelSubscription)
		hospitals.GET("/premium/status", hospitalOnly, premiumH.GetStatus)

		// Doctor management (premium only)
		hospitals.POST("/doctors", hospitalOnly, premiumH.AddDoctor)
		hospitals.GET("/doctors", hospitalOnly, premiumH.ListDoctors)
		hospitals.PUT("/doctors/:id", hospitalOnly, premiumH.UpdateDoctor)
		hospitals.DELETE("/doctors/:id", hospitalOnly, premiumH.DeleteDoctor)

		// Public discovery
		hospitals.GET("/premium/search", premiumH.SearchPremium)
		hospitals.GET("/recommended", premiumH.GetRecommended)
	}

	// ---------------------------------------------------------------------------
	// Admin routes
	// ---------------------------------------------------------------------------
	admin := v1.Group("/admin", adminRequired)
	{
		admin.GET("/subscriptions", premiumH.AdminListSubscriptions)
		admin.POST("/subscriptions/:id/grant", premiumH.AdminGrantSubscription)
		admin.DELETE("/subscriptions/:id", premiumH.AdminCancelSubscription)
	}
}
