package services

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"

	"wh-logique/backend/internal/models"
	"wh-logique/backend/internal/repository"
)

var (
	ErrStockItemNotFound     = errors.New("stock item not found")
	ErrStockLocationNotFound = errors.New("stock location not found")
)

type StockStore interface {
	Receive(ctx context.Context, lines []models.ReceiveStockLine) ([]models.Stock, error)
	ListByItem(ctx context.Context, itemID uuid.UUID) ([]models.Stock, error)
	ListLogsByItem(ctx context.Context, itemID uuid.UUID) ([]models.StockLog, error)
}

type StockService struct {
	repository StockStore
}

func NewStockService(repository StockStore) *StockService {
	return &StockService{repository: repository}
}

func (s *StockService) Receive(ctx context.Context, input models.ReceiveStockInput) ([]models.Stock, error) {
	stocks, err := s.repository.Receive(ctx, input.Lines)
	if err != nil {
		return nil, translateStockRepositoryError("receive stock", err)
	}

	return stocks, nil
}

func (s *StockService) ListByItem(ctx context.Context, itemID uuid.UUID) ([]models.Stock, error) {
	stocks, err := s.repository.ListByItem(ctx, itemID)
	if err != nil {
		return nil, fmt.Errorf("list stock: %w", err)
	}

	return stocks, nil
}

func (s *StockService) ListLogsByItem(ctx context.Context, itemID uuid.UUID) ([]models.StockLog, error) {
	logs, err := s.repository.ListLogsByItem(ctx, itemID)
	if err != nil {
		return nil, fmt.Errorf("list stock logs: %w", err)
	}

	return logs, nil
}

func translateStockRepositoryError(operation string, err error) error {
	switch {
	case errors.Is(err, repository.ErrStockItemNotFound):
		return ErrStockItemNotFound
	case errors.Is(err, repository.ErrStockLocationNotFound):
		return ErrStockLocationNotFound
	default:
		return fmt.Errorf("%s: %w", operation, err)
	}
}
