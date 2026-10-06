package services

import (
	"context"
	"fmt"

	"wh-logique/backend/internal/models"
)

type LocationLister interface {
	List(ctx context.Context) ([]models.Location, error)
}

type LocationService struct {
	repository LocationLister
}

func NewLocationService(repository LocationLister) *LocationService {
	return &LocationService{repository: repository}
}

func (s *LocationService) List(ctx context.Context) ([]models.Location, error) {
	locations, err := s.repository.List(ctx)
	if err != nil {
		return nil, fmt.Errorf("list locations: %w", err)
	}

	return locations, nil
}
