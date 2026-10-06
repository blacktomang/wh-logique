package config

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/joho/godotenv"
)

type Config struct {
	Environment        string
	HTTPPort           string
	DatabaseURL        string
	CORSAllowedOrigins []string
}

func Load() (Config, error) {
	loadDotEnv()

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

// loadDotEnv loads a `.env` file from the repository root, walking up from the
// current working directory until one is found. This lets the backend be run
// from any directory (`go run ./cmd/server` in apps/backend or the repo root).
// A missing file is not an error: when absent (e.g. inside a container), the
// process simply falls back to its existing environment.
func loadDotEnv() {
	dir, err := os.Getwd()
	if err != nil {
		return
	}

	for {
		if _, statErr := os.Stat(filepath.Join(dir, ".env")); statErr == nil {
			_ = godotenv.Load(filepath.Join(dir, ".env"))
			return
		}

		parent := filepath.Dir(dir)
		if parent == dir {
			return
		}
		dir = parent
	}
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
