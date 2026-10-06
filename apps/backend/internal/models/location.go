package models

import "github.com/google/uuid"

type LocationZone string

const (
	LocationZoneA LocationZone = "A"
	LocationZoneB LocationZone = "B"
	LocationZoneC LocationZone = "C"
)

type LocationType string

const (
	LocationTypeRack        LocationType = "rack"
	LocationTypeShelf       LocationType = "shelf"
	LocationTypeBin         LocationType = "bin"
	LocationTypeFloor       LocationType = "floor"
	LocationTypeColdStorage LocationType = "cold_storage"
)

type Location struct {
	ID   uuid.UUID    `json:"id"`
	Code string       `json:"code"`
	Zone LocationZone `json:"zone"`
	Type LocationType `json:"type"`
}
