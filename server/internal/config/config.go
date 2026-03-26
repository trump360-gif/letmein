package config

import "os"

type Config struct {
	Port                   string
	DatabaseURL            string
	RedisAddr              string
	JWTSecret              string
	KakaoRestAPIKey        string
	UploadDir              string
	CentrifugoAPIURL       string
	CentrifugoAPIKey       string
	CentrifugoTokenSecret  string
}

func Load() *Config {
	return &Config{
		Port:                  getEnv("PORT", "8080"),
		DatabaseURL:           getEnv("DATABASE_URL", "postgres://letmein:letmein@localhost:15432/letmein?sslmode=disable"),
		RedisAddr:             getEnv("REDIS_ADDR", "localhost:6379"),
		JWTSecret:             getEnv("JWT_SECRET", "dev-secret-change-in-production"),
		KakaoRestAPIKey:       getEnv("KAKAO_REST_API_KEY", ""),
		UploadDir:             getEnv("UPLOAD_DIR", "./uploads"),
		CentrifugoAPIURL:      getEnv("CENTRIFUGO_API_URL", "http://localhost:8000/api"),
		CentrifugoAPIKey:      getEnv("CENTRIFUGO_API_KEY", "dev-api-key"),
		CentrifugoTokenSecret: getEnv("CENTRIFUGO_TOKEN_SECRET", "dev-centrifugo-secret"),
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
