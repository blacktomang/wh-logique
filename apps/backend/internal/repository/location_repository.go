package repository

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"

	"wh-logique/backend/internal/models"
)

type LocationRepository struct {
	db *pgxpool.Pool
}

func NewLocationRepository(db *pgxpool.Pool) *LocationRepository {
	return &LocationRepository{db: db}
}

func (r *LocationRepository) List(ctx context.Context) ([]models.Location, error) {
	const query = `
		SELECT id, code, zone, type
		FROM locations
		ORDER BY zone, type, code
	`

	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("query locations: %w", err)
	}
	defer rows.Close()

	locations := make([]models.Location, 0)
	for rows.Next() {
		var location models.Location
		if err := rows.Scan(&location.ID, &location.Code, &location.Zone, &location.Type); err != nil {
			return nil, fmt.Errorf("scan location: %w", err)
		}
		locations = append(locations, location)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate locations: %w", err)
	}

	return locations, nil
}
