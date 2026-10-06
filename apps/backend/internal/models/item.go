package models

import (
	"time"

	"github.com/google/uuid"
)

type ItemCategory string

const (
	ItemCategoryRawMaterial   ItemCategory = "raw_material"
	ItemCategoryFinishedGoods ItemCategory = "finished_goods"
	ItemCategoryPackaging     ItemCategory = "packaging"
	ItemCategorySparePart     ItemCategory = "spare_part"
	ItemCategoryConsumable    ItemCategory = "consumable"
	ItemCategoryEquipment     ItemCategory = "equipment"
)

type ItemUnit string

const (
	ItemUnitPieces ItemUnit = "pcs"
	ItemUnitKg     ItemUnit = "kg"
	ItemUnitGram   ItemUnit = "gr"
	ItemUnitLiter  ItemUnit = "ltr"
	ItemUnitBox    ItemUnit = "box"
	ItemUnitCarton ItemUnit = "carton"
	ItemUnitPallet ItemUnit = "pallet"
)

type Item struct {
	ID        uuid.UUID    `json:"id"`
	SKU       string       `json:"sku"`
	Name      string       `json:"name"`
	Category  ItemCategory `json:"category"`
	Unit      ItemUnit     `json:"unit"`
	CreatedAt time.Time    `json:"created_at"`
	DeletedAt *time.Time   `json:"deleted_at"`
}

type CreateItemInput struct {
	SKU      string
	Name     string
	Category ItemCategory
	Unit     ItemUnit
}

type UpdateItemInput struct {
	ID       uuid.UUID
	SKU      string
	Name     string
	Category ItemCategory
	Unit     ItemUnit
}

type ListItemsInput struct {
	Search   string
	Category *ItemCategory
	Page     int
	Limit    int
}
