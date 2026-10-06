package config

import (
	"fmt"
	"os"
	"strings"
)

type Config struct {
	Environment        string
	HTTPPort           string
	DatabaseURL        string
	CORSAllowedOrigins []string
}

func Load() (Config, error) {
	cfg := Config{
		Environment:        getEnv("APP_ENV", "development"),
		HTTPPort:           getEnv("HTTP_PORT", "8080"),
		DatabaseURL:        os.Getenv("DATABASE_URL"),
		CORSAllowedOrigins: parseAllowedOrigins(getEnv("CORS_ALLOWED_ORIGINS", "*")),
	}

	if cfg.DatabaseURL == "" {
		return Config{}, fmt.Errorf("DATABASE_URL is required")
	}

	return cfg, nil
}

func parseAllowedOrigins(value string) []string {
	origins := make([]string, 0)
	for _, origin := range strings.Split(value, ",") {
		if trimmed := strings.TrimSpace(origin); trimmed != "" {
			origins = append(origins, trimmed)
		}
	}

	return origins
}

func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}

	return fallback
}
