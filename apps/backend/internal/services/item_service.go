package services

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/google/uuid"

	"wh-logique/backend/internal/models"
	"wh-logique/backend/internal/repository"
)

var (
	ErrItemNotFound    = errors.New("item not found")
	ErrItemSKUConflict = errors.New("item SKU already exists")
)

type ItemStore interface {
	Create(ctx context.Context, input models.CreateItemInput) (models.Item, error)
	List(ctx context.Context, input models.ListItemsInput) ([]models.Item, int64, error)
	GetByID(ctx context.Context, id uuid.UUID) (models.Item, error)
	Update(ctx context.Context, input models.UpdateItemInput) (models.Item, error)
	SoftDelete(ctx context.Context, id uuid.UUID) error
}

type ItemService struct {
	repository ItemStore
}

func NewItemService(repository ItemStore) *ItemService {
	return &ItemService{repository: repository}
}

func (s *ItemService) Create(ctx context.Context, input models.CreateItemInput) (models.Item, error) {
	input.SKU = normalizeSKU(input.SKU)
	input.Name = strings.TrimSpace(input.Name)

	item, err := s.repository.Create(ctx, input)
	if err != nil {
		return models.Item{}, translateItemRepositoryError("create item", err)
	}

	return item, nil
}

func (s *ItemService) List(ctx context.Context, input models.ListItemsInput) ([]models.Item, int64, error) {
	input.Search = strings.TrimSpace(input.Search)

	items, total, err := s.repository.List(ctx, input)
	if err != nil {
		return nil, 0, fmt.Errorf("list items: %w", err)
	}

	return items, total, nil
}

func (s *ItemService) GetByID(ctx context.Context, id uuid.UUID) (models.Item, error) {
	item, err := s.repository.GetByID(ctx, id)
	if err != nil {
		return models.Item{}, translateItemRepositoryError("get item", err)
	}

	return item, nil
}

func (s *ItemService) Update(ctx context.Context, input models.UpdateItemInput) (models.Item, error) {
	input.SKU = normalizeSKU(input.SKU)
	input.Name = strings.TrimSpace(input.Name)

	item, err := s.repository.Update(ctx, input)
	if err != nil {
		return models.Item{}, translateItemRepositoryError("update item", err)
	}

	return item, nil
}

func (s *ItemService) Delete(ctx context.Context, id uuid.UUID) error {
	if err := s.repository.SoftDelete(ctx, id); err != nil {
		return translateItemRepositoryError("delete item", err)
	}

	return nil
}

func normalizeSKU(sku string) string {
	return strings.ToUpper(strings.TrimSpace(sku))
}

func translateItemRepositoryError(operation string, err error) error {
	switch {
	case errors.Is(err, repository.ErrItemNotFound):
		return ErrItemNotFound
	case errors.Is(err, repository.ErrItemSKUConflict):
		return ErrItemSKUConflict
	default:
		return fmt.Errorf("%s: %w", operation, err)
	}
}
