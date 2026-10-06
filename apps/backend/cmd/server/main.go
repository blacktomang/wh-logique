package main

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"

	"wh-logique/backend/internal/config"
	"wh-logique/backend/internal/handlers"
	"wh-logique/backend/internal/middleware"
	"wh-logique/backend/internal/repository"
	"wh-logique/backend/internal/services"
	"wh-logique/backend/pkg/database"
)

func main() {
	logger, err := zap.NewProduction()
	if err != nil {
		panic(fmt.Sprintf("create logger: %v", err))
	}
	defer logger.Sync()

	cfg, err := config.Load()
	if err != nil {
		logger.Fatal("load configuration", zap.Error(err))
	}

	if cfg.Environment == "development" {
		gin.SetMode(gin.DebugMode)
	} else {
		gin.SetMode(gin.ReleaseMode)
	}

	ctx := context.Background()
	db, err := database.Open(ctx, cfg.DatabaseURL)
	if err != nil {
		logger.Fatal("connect to database", zap.Error(err))
	}
	defer db.Close()

	locationRepository := repository.NewLocationRepository(db)
	locationService := services.NewLocationService(locationRepository)
	locationHandler := handlers.NewLocationHandler(locationService)

	itemRepository := repository.NewItemRepository(db)
	itemService := services.NewItemService(itemRepository)
	itemHandler := handlers.NewItemHandler(itemService)

	stockRepository := repository.NewStockRepository(db)
	stockService := services.NewStockService(stockRepository)
	stockHandler := handlers.NewStockHandler(stockService)

	router := gin.New()
	router.Use(
		middleware.RequestID(),
		middleware.Logger(logger),
		middleware.ErrorHandler(logger),
		middleware.Recovery(logger),
	)
	router.GET("/locations", locationHandler.List)
	router.POST("/items", itemHandler.Create)
	router.GET("/items", itemHandler.List)
	router.GET("/items/:id", itemHandler.Get)
	router.PUT("/items/:id", itemHandler.Update)
	router.DELETE("/items/:id", itemHandler.Delete)
	router.POST("/stock/receive", stockHandler.Receive)
	router.GET("/stock/:item_id", stockHandler.Get)

	server := &http.Server{
		Addr:              ":" + cfg.HTTPPort,
		Handler:           router,
		ReadHeaderTimeout: 5 * time.Second,
	}

	serverErrors := make(chan error, 1)
	go func() {
		logger.Info("server started", zap.String("address", server.Addr))
		serverErrors <- server.ListenAndServe()
	}()

	signals := make(chan os.Signal, 1)
	signal.Notify(signals, syscall.SIGINT, syscall.SIGTERM)

	select {
	case signal := <-signals:
		logger.Info("shutdown signal received", zap.String("signal", signal.String()))
	case err := <-serverErrors:
		if !errors.Is(err, http.ErrServerClosed) {
			logger.Fatal("server stopped unexpectedly", zap.Error(err))
		}
	}

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := server.Shutdown(shutdownCtx); err != nil {
		logger.Error("graceful shutdown failed", zap.Error(err))
	}
}
