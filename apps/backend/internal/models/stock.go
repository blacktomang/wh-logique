package models

import (
	"time"

	"github.com/google/uuid"
)

type Stock struct {
	ID         uuid.UUID `json:"id"`
	ItemID     uuid.UUID `json:"item_id"`
	LocationID uuid.UUID `json:"location_id"`
	Qty        int       `json:"qty"`
	UpdatedAt  time.Time `json:"updated_at"`
}

type StockLog struct {
	ID         uuid.UUID `json:"id"`
	ItemID     uuid.UUID `json:"item_id"`
	LocationID uuid.UUID `json:"location_id"`
	Qty        int       `json:"qty"`
	CreatedAt  time.Time `json:"created_at"`
}

type ReceiveStockLine struct {
	ItemID     uuid.UUID
	LocationID uuid.UUID
	Qty        int
}

type ReceiveStockInput struct {
	Lines []ReceiveStockLine
}
