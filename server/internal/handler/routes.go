package handler

import (
	"database/sql"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/letmein/server/internal/config"
	"github.com/letmein/server/internal/middleware"
	"github.com/letmein/server/internal/repository"
	"github.com/letmein/server/internal/scheduler"
	"github.com/letmein/server/internal/service"
	pkgauth "github.com/letmein/server/pkg/auth"
	"github.com/redis/go-redis/v9"
)

func RegisterRoutes(r *gin.Engine, db *sql.DB, rdb *redis.Client, cfg *config.Config) {
	r.GET("/", func(c *gin.Context) {
		c.Data(http.StatusOK, "text/html; charset=utf-8", []byte(`<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Black Label API</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#0D0D0D;color:#fff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh}
.container{text-align:center;padding:40px}
.logo{font-size:48px;font-weight:700;letter-spacing:-1px;margin-bottom:8px}
.logo span{color:#C62828}
.sub{color:#888;font-size:14px;margin-bottom:40px}
.version{display:inline-block;background:#1A1A1A;border:1px solid #333;border-radius:20px;padding:4px 14px;font-size:12px;color:#aaa;margin-bottom:32px}
.endpoints{text-align:left;background:#1A1A1A;border-radius:12px;padding:24px 32px;margin-top:20px}
.endpoints h3{color:#888;font-size:11px;text-transform:uppercase;letter-spacing:2px;margin-bottom:16px}
.ep{display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid #222}
.ep:last-child{border:none}
.ep .method{background:#C62828;color:#fff;font-size:11px;font-weight:600;padding:2px 8px;border-radius:4px;min-width:36px;text-align:center}
.ep .path{color:#ddd;font-size:14px;font-family:monospace}
.ep .desc{color:#666;font-size:12px}
.status{margin-top:32px;display:flex;gap:16px;justify-content:center}
.dot{width:8px;height:8px;border-radius:50%;background:#4CAF50;display:inline-block;margin-right:6px}
.status span{color:#888;font-size:12px}
</style>
</head>
<body>
<div class="container">
<div class="logo">BLACK <span>LABEL</span></div>
<div class="sub">Premium Beauty Consultation Platform</div>
<div class="version">API v2.1</div>
<div class="endpoints">
<h3>Endpoints</h3>
<div class="ep"><span class="method">GET</span><span class="path">/health</span><span class="desc">서버 상태</span></div>
<div class="ep"><span class="method">GET</span><span class="path">/api/v1/categories</span><span class="desc">시술 카테고리</span></div>
<div class="ep"><span class="method">GET</span><span class="path">/api/v1/hospitals</span><span class="desc">병원 검색</span></div>
<div class="ep"><span class="method">GET</span><span class="path">/api/v1/posts</span><span class="desc">커뮤니티</span></div>
<div class="ep"><span class="method">GET</span><span class="path">/api/v1/cast-members</span><span class="desc">출연자</span></div>
<div class="ep"><span class="method">GET</span><span class="path">/api/v1/episodes/hero</span><span class="desc">히어로 에피소드</span></div>
<div class="ep"><span class="method">GET</span><span class="path">/api/v1/ads/feed</span><span class="desc">피드 광고</span></div>
</div>
<div class="status"><span><span class="dot"></span>Server Running</span><span><span class="dot"></span>DB Connected</span><span><span class="dot"></span>Redis Connected</span></div>
</div>
</body>
</html>`))
	})

	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	// Static file serving for uploaded assets.
	r.Static("/uploads", cfg.UploadDir)

	// Dependencies
	userRepo := repository.NewUserRepository(db)
	jwtManager := pkgauth.NewJWTManager(cfg.JWTSecret)
	authSvc := service.NewAuthService(userRepo, jwtManager, rdb)
	authHandler := NewAuthHandler(authSvc, userRepo)

	// Hospital & category dependencies
	hospitalRepo := repository.NewHospitalRepository(db)
	categoryRepo := repository.NewCategoryRepository(db)
	hospitalSvc := service.NewHospitalService(hospitalRepo, categoryRepo)
	categorySvc := service.NewCategoryService(categoryRepo)
	hospitalH := NewHospitalHandler(hospitalSvc)
	categoryH := NewCategoryHandler(categorySvc)

	// Admin dependencies
	adminRepo := repository.NewAdminRepository(db)

	// Coordinator matching dependencies (Phase coordinator)
	consultRepo := repository.NewConsultationRepository(db)
	coordinatorRepo := repository.NewCoordinatorRepository(db)
	chatRepoForCoord := repository.NewChatRepository(db)
	consultSvc := service.NewConsultationService(consultRepo, hospitalRepo, chatRepoForCoord)
	coordinatorSvc := service.NewCoordinatorService(coordinatorRepo, consultRepo, chatRepoForCoord)

	adminH := NewAdminHandlerWithCoordinator(adminRepo, coordinatorSvc)

	v1 := r.Group("/api/v1")
	{
		v1.GET("/ping", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"message": "pong"})
		})

		// Auth routes (Phase 1-2)
		auth := v1.Group("/auth")
		{
			// Public endpoints
			auth.POST("/kakao", authHandler.KakaoLogin)
			auth.POST("/apple", authHandler.AppleLogin)
			auth.POST("/dev-login", authHandler.DevLogin) // DEV ONLY
			auth.POST("/refresh", authHandler.RefreshToken)
			auth.GET("/nickname/check", authHandler.CheckNickname)

			// Protected endpoints
			authRequired := middleware.AuthRequired(jwtManager)
			auth.GET("/me", authRequired, authHandler.GetMe)
			auth.POST("/logout", authRequired, authHandler.Logout)
			auth.POST("/nickname", authRequired, authHandler.UpdateNickname)
			auth.DELETE("/account", authRequired, authHandler.DeleteAccount)
			auth.POST("/restore", authRequired, authHandler.RestoreAccount)
		}

		// Media routes (Phase 1-4)
		imageRepo := repository.NewImageRepository(db)
		mediaSvc := service.NewMediaService(imageRepo, cfg)
		mediaH := NewMediaHandler(mediaSvc)

		authRequired := middleware.AuthRequired(jwtManager)
		media := v1.Group("/media")
		{
			media.POST("/upload", authRequired, mediaH.Upload)
			media.GET("/:id", mediaH.GetByID)
			media.DELETE("/:id", authRequired, mediaH.Delete)
		}

		// Hospital routes (Phase 2)
		reviewRepo := repository.NewReviewRepository(db)
		reviewSvc := service.NewReviewService(reviewRepo, consultRepo)
		reviewH := NewReviewHandler(reviewSvc)

		hospitals := v1.Group("/hospitals")
		{
			// Public endpoints
			hospitals.GET("", hospitalH.Search)
			hospitals.GET("/:id", hospitalH.GetByID)
			hospitals.GET("/:id/reviews", reviewH.ListByHospital)

			// Any authenticated user can register as a hospital
			hospitals.POST("/register", authRequired, hospitalH.Register)

			// Hospital-role-only endpoints (approved hospitals)
			hospitalOnly := middleware.HospitalRequired(jwtManager, hospitalRepo)
			hospitals.GET("/profile", hospitalOnly, hospitalH.GetProfile)
			hospitals.PUT("/profile", hospitalOnly, hospitalH.UpdateProfile)
			hospitals.GET("/dashboard", hospitalOnly, hospitalH.GetDashboard)
		}

		// Review routes
		reviews := v1.Group("/reviews")
		{
			reviews.POST("", authRequired, reviewH.CreateReview)
			reviews.PUT("/:id", authRequired, reviewH.UpdateReview)
			reviews.DELETE("/:id", authRequired, reviewH.DeleteReview)
		}

		// Category routes (Phase 2)
		categories := v1.Group("/categories")
		{
			categories.GET("", categoryH.List)
			categories.GET("/:id/details", categoryH.GetDetails)
		}

		// Auction routes (Phase 3)
		consultH := NewConsultationHandler(consultSvc).WithCoordinatorService(coordinatorSvc)
		consultHospitalOnly := middleware.HospitalRequired(jwtManager, hospitalRepo)

		consultations := v1.Group("/consultations")
		{
			// User endpoints (auth required)
			consultations.POST("", authRequired, consultH.CreateRequest)
			consultations.GET("", authRequired, consultH.GetUserRequests)
			consultations.GET("/:id", authRequired, consultH.GetRequestDetail)
			consultations.POST("/:id/select", authRequired, consultH.SelectHospital)
			consultations.DELETE("/:id", authRequired, consultH.CancelRequest)
			consultations.GET("/:id/matches", authRequired, consultH.GetMatches)

			// Hospital endpoints (hospital role required)
			consultations.GET("/hospital", consultHospitalOnly, consultH.GetHospitalRequests)
			consultations.GET("/:id/detail", consultHospitalOnly, consultH.GetRequestDetailForHospital)
			consultations.POST("/:id/respond", consultHospitalOnly, consultH.SendResponse)
		}

		// Chat routes (Phase 4)
		chatRepo := repository.NewChatRepository(db)
		centrifugoMgr := pkgauth.NewCentrifugoManager(cfg.CentrifugoTokenSecret)
		chatSvc := service.NewChatService(chatRepo, hospitalRepo, centrifugoMgr, cfg.CentrifugoAPIURL, cfg.CentrifugoAPIKey)
		chatH := NewChatHandler(chatSvc)

		// Visit card dependencies (Phase 4 extension)
		visitCardRepo := repository.NewVisitCardRepository(db)
		visitCardH := NewVisitCardHandler(visitCardRepo, chatRepo)

		chat := v1.Group("/chat")
		{
			// User endpoints (auth required)
			chat.POST("/rooms", authRequired, chatH.CreateRoom)
			chat.GET("/rooms", authRequired, chatH.GetUserRooms)
			chat.GET("/rooms/:id/messages", authRequired, chatH.GetMessages)
			chat.POST("/rooms/:id/messages", authRequired, chatH.SendMessage)
			chat.POST("/rooms/:id/read", authRequired, chatH.MarkRead)
			chat.POST("/rooms/:id/close", authRequired, chatH.CloseRoom)
			chat.GET("/token", authRequired, chatH.GetCentrifugoToken)

			// Visit card - user endpoints (auth required)
			chat.GET("/rooms/:id/visit-cards", authRequired, visitCardH.ListVisitCards)
			chat.POST("/rooms/:id/visit-card/:cardId/accept", authRequired, visitCardH.AcceptVisitCard)
			chat.POST("/rooms/:id/visit-card/:cardId/decline", authRequired, visitCardH.DeclineVisitCard)

			// Hospital endpoints (hospital role required)
			chatHospitalOnly := middleware.HospitalRequired(jwtManager, hospitalRepo)
			chat.GET("/rooms/hospital", chatHospitalOnly, chatH.GetHospitalRooms)

			// Visit card - hospital endpoints (hospital role required)
			chat.POST("/rooms/:id/visit-card", chatHospitalOnly, visitCardH.CreateVisitCard)
			chat.GET("/rooms/:id/visit-cards/hospital", chatHospitalOnly, visitCardH.ListVisitCardsHospital)
		}

		// Community routes (Phase 5)
		postRepo := repository.NewPostRepository(db)
		postSvc := service.NewPostService(postRepo)
		postH := NewPostHandler(postSvc)

		posts := v1.Group("/posts")
		{
			// Public endpoints
			posts.GET("", postH.ListPosts)
			posts.GET("/:id", postH.GetPost)
			posts.GET("/:id/comments", postH.GetComments)

			// Auth-required endpoints
			posts.POST("", authRequired, postH.CreatePost)
			posts.DELETE("/:id", authRequired, postH.DeletePost)
			posts.POST("/:id/comments", authRequired, postH.AddComment)
			posts.POST("/:id/like", authRequired, postH.ToggleLike)
		}

		reports := v1.Group("/reports")
		{
			reports.POST("", authRequired, postH.CreateReport)
		}

		// Poll routes (Phase MVP-B)
		pollRepo := repository.NewPollRepository(db)
		pollSvc := service.NewPollService(pollRepo)
		pollH := NewPollHandler(pollSvc)

		polls := v1.Group("/polls")
		{
			// Public endpoints
			polls.GET("", pollH.ListPolls)
			polls.GET("/:id", pollH.GetPoll)

			// Auth-required endpoints
			polls.POST("", authRequired, pollH.CreatePoll)
			polls.POST("/:id/vote", authRequired, pollH.Vote)
			polls.POST("/:id/close", authRequired, pollH.ClosePoll)
		}

		// Cast member routes (Phase MVP-C)
		castMemberRepo := repository.NewCastMemberRepository(db)
		castStoryRepo := repository.NewCastStoryRepository(db)
		castFollowRepo := repository.NewCastFollowRepository(db)
		episodeRepo := repository.NewYouTubeEpisodeRepository(db)
		castSvc := service.NewCastMemberService(castMemberRepo, castStoryRepo, castFollowRepo, episodeRepo)
		castH := NewCastMemberHandler(castSvc)

		castMembers := v1.Group("/cast-members")
		{
			// Public endpoints
			castMembers.GET("", castH.ListCastMembers)
			castMembers.GET("/:id", castH.GetCastMember)

			// Auth-required endpoints
			castMembers.POST("/apply", authRequired, castH.ApplyForVerification)
			castMembers.GET("/following", authRequired, castH.GetFollowingList)
			castMembers.POST("/:id/follow", authRequired, castH.FollowCastMember)
			castMembers.DELETE("/:id/follow", authRequired, castH.UnfollowCastMember)
		}

		castStories := v1.Group("/cast-stories")
		{
			// Public endpoints
			castStories.GET("", castH.ListStoryFeed)
			castStories.GET("/:id", castH.GetStory)

			// Auth-required endpoints (cast member only)
			castStories.POST("", authRequired, castH.CreateStory)
		}

		episodes := v1.Group("/episodes")
		{
			// Public endpoints
			episodes.GET("", castH.ListEpisodes)
			episodes.GET("/hero", castH.GetHeroEpisodes)
		}

		// Notification routes
			notifRepo := repository.NewNotificationRepository(db)
			notifSvc := service.NewNotificationService(notifRepo)
			notifH := NewNotificationHandler(notifSvc)

			notifs := v1.Group("/notifications")
			{
				notifs.GET("", authRequired, notifH.ListNotifications)
				notifs.PUT("/:id/read", authRequired, notifH.MarkRead)
				notifs.GET("/unread-count", authRequired, notifH.GetUnreadCount)
				notifs.GET("/settings", authRequired, notifH.GetSettings)
				notifs.PUT("/settings", authRequired, notifH.UpdateSettings)
			}

			// Background schedulers (non-blocking)
		scheduler.StartAll(scheduler.Dependencies{
			UserRepo:    userRepo,
			ConsultRepo: consultRepo,
			ChatSvc:     chatSvc,
		})

		// Premium & Ad routes (defined in premium_routes.go and ad_routes.go)
		adminRequired := middleware.AdminRequired(jwtManager)
		RegisterPremiumRoutes(v1, db, jwtManager, hospitalRepo, adminRequired)
		RegisterAdRoutes(v1, db, jwtManager, hospitalRepo, adminRequired)

		// Admin routes (admin role required)
		admin := v1.Group("/admin", adminRequired)
		{
			admin.GET("/dashboard/stats", adminH.DashboardStats)
			admin.GET("/dashboard/todo", adminH.DashboardTodo)
			admin.GET("/dashboard/activity", adminH.DashboardActivity)
			admin.GET("/dashboard/chart", adminH.DashboardChart)

			admin.GET("/hospitals", adminH.ListHospitals)
			admin.POST("/hospitals/:id/approve", adminH.ApproveHospital)
			admin.POST("/hospitals/:id/reject", adminH.RejectHospital)

			admin.GET("/consultations", adminH.ListConsultations)
			admin.GET("/consultations/:id", adminH.GetConsultation)
			admin.POST("/consultations/:id/match", adminH.MatchHospitals)

			admin.POST("/categories", adminH.CreateCategory)
			admin.PATCH("/categories/:id", adminH.UpdateCategory)
			admin.DELETE("/categories/:id", adminH.DeleteCategory)
			admin.POST("/categories/:id/procedures", adminH.CreateProcedure)
			admin.PATCH("/procedures/:id", adminH.UpdateProcedure)
			admin.DELETE("/procedures/:id", adminH.DeleteProcedure)

			// Cast member management
			admin.GET("/cast-members", castH.AdminListPending)
			admin.POST("/cast-members/:id/approve", castH.AdminApprove)
			admin.POST("/cast-members/:id/reject", castH.AdminReject)
			admin.POST("/episodes", castH.AdminCreateEpisode)
			admin.POST("/episodes/:id/cast-members", castH.AdminLinkEpisodeCastMember)
		}
	}
}
