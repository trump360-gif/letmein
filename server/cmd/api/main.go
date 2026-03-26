package main

import (
	"log"

	"github.com/gin-gonic/gin"
	"github.com/letmein/server/internal/config"
	"github.com/letmein/server/internal/handler"
	"github.com/letmein/server/internal/middleware"
)

func main() {
	cfg := config.Load()
	db := config.NewDB(cfg.DatabaseURL)
	defer db.Close()
	rdb := config.NewRedis(cfg.RedisAddr)
	defer rdb.Close()

	r := gin.Default()
	r.Use(middleware.CORS())

	handler.RegisterRoutes(r, db, rdb, cfg)

	log.Printf("Server starting on :%s", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatal(err)
	}
}
