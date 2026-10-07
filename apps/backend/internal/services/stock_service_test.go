package services

import (
	"context"
	"errors"
	"testing"

	"github.com/google/uuid"

	"wh-logique/backend/internal/models"
)

type stockStoreStub struct {
	receiveCalls int
	receiveLines []models.ReceiveStockLine
	stocks       []models.Stock
}

func (s *stockStoreStub) Receive(_ context.Context, lines []models.ReceiveStockLine) ([]models.Stock, error) {
	s.receiveCalls++
	s.receiveLines = lines
	return s.stocks, nil
}

func (s *stockStoreStub) ListByItem(context.Context, uuid.UUID) ([]models.Stock, error) {
	return nil, nil
}

func (s *stockStoreStub) ListLogsByItem(context.Context, uuid.UUID) ([]models.StockLog, error) {
	return nil, nil
}

func TestStockServiceReceiveRejectsNonPositiveQuantity(t *testing.T) {
	tests := []struct {
		name string
		qty  int
	}{
		{name: "zero", qty: 0},
		{name: "negative", qty: -1},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			store := &stockStoreStub{}
			service := NewStockService(store)

			stocks, err := service.Receive(context.Background(), models.ReceiveStockInput{
				Lines: []models.ReceiveStockLine{{Qty: tt.qty}},
			})

			if !errors.Is(err, ErrInvalidStockQuantity) {
				t.Fatalf("Receive() error = %v, want %v", err, ErrInvalidStockQuantity)
			}
			if stocks != nil {
				t.Fatalf("Receive() stocks = %#v, want nil", stocks)
			}
			if store.receiveCalls != 0 {
				t.Fatalf("repository Receive() calls = %d, want 0", store.receiveCalls)
			}
		})
	}
}

func TestStockServiceReceiveRejectsBatchBeforeRepositoryCall(t *testing.T) {
	store := &stockStoreStub{}
	service := NewStockService(store)

	_, err := service.Receive(context.Background(), models.ReceiveStockInput{
		Lines: []models.ReceiveStockLine{
			{Qty: 2},
			{Qty: 0},
		},
	})

	if !errors.Is(err, ErrInvalidStockQuantity) {
		t.Fatalf("Receive() error = %v, want %v", err, ErrInvalidStockQuantity)
	}
	if store.receiveCalls != 0 {
		t.Fatalf("repository Receive() calls = %d, want 0", store.receiveCalls)
	}
}

func TestStockServiceReceiveAcceptsPositiveQuantity(t *testing.T) {
	want := []models.Stock{{Qty: 3}}
	store := &stockStoreStub{stocks: want}
	service := NewStockService(store)
	line := models.ReceiveStockLine{Qty: 3}

	stocks, err := service.Receive(context.Background(), models.ReceiveStockInput{
		Lines: []models.ReceiveStockLine{line},
	})

	if err != nil {
		t.Fatalf("Receive() error = %v, want nil", err)
	}
	if store.receiveCalls != 1 {
		t.Fatalf("repository Receive() calls = %d, want 1", store.receiveCalls)
	}
	if len(store.receiveLines) != 1 || store.receiveLines[0] != line {
		t.Fatalf("repository Receive() lines = %#v, want %#v", store.receiveLines, []models.ReceiveStockLine{line})
	}
	if len(stocks) != 1 || stocks[0].Qty != want[0].Qty {
		t.Fatalf("Receive() stocks = %#v, want %#v", stocks, want)
	}
}
