package services

import (
	"context"
	"errors"
	"testing"

	"github.com/google/uuid"

	"wh-logique/backend/internal/models"
	"wh-logique/backend/internal/repository"
)

type itemStoreStub struct {
	createdInput models.CreateItemInput
	updatedInput models.UpdateItemInput
	createErr    error
	getErr       error
	updateErr    error
	deleteErr    error
}

func (s *itemStoreStub) Create(_ context.Context, input models.CreateItemInput) (models.Item, error) {
	s.createdInput = input
	return models.Item{SKU: input.SKU, Name: input.Name}, s.createErr
}

func (s *itemStoreStub) List(context.Context, models.ListItemsInput) ([]models.Item, int64, error) {
	return nil, 0, nil
}

func (s *itemStoreStub) GetByID(context.Context, uuid.UUID) (models.Item, error) {
	return models.Item{}, s.getErr
}

func (s *itemStoreStub) Update(_ context.Context, input models.UpdateItemInput) (models.Item, error) {
	s.updatedInput = input
	return models.Item{ID: input.ID, SKU: input.SKU, Name: input.Name}, s.updateErr
}

func (s *itemStoreStub) SoftDelete(context.Context, uuid.UUID) error {
	return s.deleteErr
}

func TestItemServiceNormalizesCreateAndUpdateInput(t *testing.T) {
	tests := []struct {
		name string
		run  func(*ItemService, *itemStoreStub) error
	}{
		{
			name: "create",
			run: func(service *ItemService, store *itemStoreStub) error {
				item, err := service.Create(context.Background(), models.CreateItemInput{
					SKU:  "  sku-001  ",
					Name: "  Example item  ",
				})
				if err == nil && (item.SKU != "SKU-001" || item.Name != "Example item") {
					t.Fatalf("created item = %#v, want normalized values", item)
				}
				if store.createdInput.SKU != "SKU-001" || store.createdInput.Name != "Example item" {
					t.Fatalf("repository input = %#v, want normalized values", store.createdInput)
				}
				return err
			},
		},
		{
			name: "update",
			run: func(service *ItemService, store *itemStoreStub) error {
				item, err := service.Update(context.Background(), models.UpdateItemInput{
					ID:   uuid.New(),
					SKU:  "  sku-002  ",
					Name: "  Updated item  ",
				})
				if err == nil && (item.SKU != "SKU-002" || item.Name != "Updated item") {
					t.Fatalf("updated item = %#v, want normalized values", item)
				}
				if store.updatedInput.SKU != "SKU-002" || store.updatedInput.Name != "Updated item" {
					t.Fatalf("repository input = %#v, want normalized values", store.updatedInput)
				}
				return err
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			store := &itemStoreStub{}
			if err := tt.run(NewItemService(store), store); err != nil {
				t.Fatalf("service call returned error: %v", err)
			}
		})
	}
}

func TestItemServiceTranslatesRepositoryErrors(t *testing.T) {
	tests := []struct {
		name     string
		store    *itemStoreStub
		run      func(*ItemService) error
		expected error
	}{
		{
			name:  "create duplicate SKU",
			store: &itemStoreStub{createErr: repository.ErrItemSKUConflict},
			run: func(service *ItemService) error {
				_, err := service.Create(context.Background(), models.CreateItemInput{})
				return err
			},
			expected: ErrItemSKUConflict,
		},
		{
			name:  "get missing item",
			store: &itemStoreStub{getErr: repository.ErrItemNotFound},
			run: func(service *ItemService) error {
				_, err := service.GetByID(context.Background(), uuid.New())
				return err
			},
			expected: ErrItemNotFound,
		},
		{
			name:  "update duplicate SKU",
			store: &itemStoreStub{updateErr: repository.ErrItemSKUConflict},
			run: func(service *ItemService) error {
				_, err := service.Update(context.Background(), models.UpdateItemInput{})
				return err
			},
			expected: ErrItemSKUConflict,
		},
		{
			name:  "delete missing item",
			store: &itemStoreStub{deleteErr: repository.ErrItemNotFound},
			run: func(service *ItemService) error {
				return service.Delete(context.Background(), uuid.New())
			},
			expected: ErrItemNotFound,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := tt.run(NewItemService(tt.store))
			if !errors.Is(err, tt.expected) {
				t.Fatalf("error = %v, want %v", err, tt.expected)
			}
		})
	}
}
