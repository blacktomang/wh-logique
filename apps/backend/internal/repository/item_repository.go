package repository

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"

	"wh-logique/backend/internal/models"
)

var (
	ErrItemNotFound    = errors.New("item not found")
	ErrItemSKUConflict = errors.New("item SKU already exists")
)

const itemSKUUniqueConstraint = "items_sku_unique"

type ItemRepository struct {
	db *pgxpool.Pool
}

func NewItemRepository(db *pgxpool.Pool) *ItemRepository {
	return &ItemRepository{db: db}
}

func (r *ItemRepository) Create(ctx context.Context, input models.CreateItemInput) (models.Item, error) {
	const query = `
		INSERT INTO items (sku, name, category, unit)
		VALUES ($1, $2, $3, $4)
		RETURNING id, sku, name, category, unit, created_at, deleted_at
	`

	var item models.Item
	err := r.db.QueryRow(ctx, query, input.SKU, input.Name, input.Category, input.Unit).Scan(
		&item.ID,
		&item.SKU,
		&item.Name,
		&item.Category,
		&item.Unit,
		&item.CreatedAt,
		&item.DeletedAt,
	)
	if err != nil {
		return models.Item{}, mapItemWriteError("create item", err)
	}

	return item, nil
}

func (r *ItemRepository) List(ctx context.Context, input models.ListItemsInput) ([]models.Item, int64, error) {
	const query = `
		SELECT id, sku, name, category, unit, created_at, deleted_at,
		       COUNT(*) OVER () AS total
		FROM items
		WHERE deleted_at IS NULL
		  AND ($1::text IS NULL OR category = $1::text)
		  AND ($2::text IS NULL OR sku ILIKE '%' || $2::text || '%' OR name ILIKE '%' || $2::text || '%')
		ORDER BY created_at DESC, id DESC
		LIMIT $3 OFFSET $4
	`

	var category any
	if input.Category != nil {
		category = string(*input.Category)
	}

	var search any
	if strings.TrimSpace(input.Search) != "" {
		search = strings.TrimSpace(input.Search)
	}

	offset := (input.Page - 1) * input.Limit
	rows, err := r.db.Query(ctx, query, category, search, input.Limit, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("query items: %w", err)
	}
	defer rows.Close()

	items := make([]models.Item, 0)
	var total int64
	for rows.Next() {
		var item models.Item
		if err := rows.Scan(
			&item.ID,
			&item.SKU,
			&item.Name,
			&item.Category,
			&item.Unit,
			&item.CreatedAt,
			&item.DeletedAt,
			&total,
		); err != nil {
			return nil, 0, fmt.Errorf("scan item: %w", err)
		}
		items = append(items, item)
	}

	if err := rows.Err(); err != nil {
		return nil, 0, fmt.Errorf("iterate items: %w", err)
	}

	if len(items) == 0 {
		total, err = r.count(ctx, input.Category, input.Search)
		if err != nil {
			return nil, 0, err
		}
	}

	return items, total, nil
}

func (r *ItemRepository) IsSKUAvailable(ctx context.Context, sku string, excludeID *uuid.UUID) (bool, error) {
	const query = `
		SELECT NOT EXISTS (
			SELECT 1
			FROM items
			WHERE sku = $1
			  AND ($2::uuid IS NULL OR id <> $2)
		)
	`

	var excludedID any
	if excludeID != nil {
		excludedID = *excludeID
	}

	var available bool
	if err := r.db.QueryRow(ctx, query, sku, excludedID).Scan(&available); err != nil {
		return false, fmt.Errorf("check SKU availability: %w", err)
	}

	return available, nil
}

func (r *ItemRepository) GetByID(ctx context.Context, id uuid.UUID) (models.Item, error) {
	const query = `
		SELECT id, sku, name, category, unit, created_at, deleted_at
		FROM items
		WHERE id = $1 AND deleted_at IS NULL
	`

	var item models.Item
	err := r.db.QueryRow(ctx, query, id).Scan(
		&item.ID,
		&item.SKU,
		&item.Name,
		&item.Category,
		&item.Unit,
		&item.CreatedAt,
		&item.DeletedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return models.Item{}, ErrItemNotFound
	}
	if err != nil {
		return models.Item{}, fmt.Errorf("get item: %w", err)
	}

	return item, nil
}

func (r *ItemRepository) Update(ctx context.Context, input models.UpdateItemInput) (models.Item, error) {
	const query = `
		UPDATE items
		SET sku = $2, name = $3, category = $4, unit = $5
		WHERE id = $1 AND deleted_at IS NULL
		RETURNING id, sku, name, category, unit, created_at, deleted_at
	`

	var item models.Item
	err := r.db.QueryRow(
		ctx,
		query,
		input.ID,
		input.SKU,
		input.Name,
		input.Category,
		input.Unit,
	).Scan(
		&item.ID,
		&item.SKU,
		&item.Name,
		&item.Category,
		&item.Unit,
		&item.CreatedAt,
		&item.DeletedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return models.Item{}, ErrItemNotFound
	}
	if err != nil {
		return models.Item{}, mapItemWriteError("update item", err)
	}

	return item, nil
}

func (r *ItemRepository) SoftDelete(ctx context.Context, id uuid.UUID) error {
	const query = `
		UPDATE items
		SET deleted_at = NOW()
		WHERE id = $1 AND deleted_at IS NULL
		RETURNING id
	`

	var deletedID uuid.UUID
	if err := r.db.QueryRow(ctx, query, id).Scan(&deletedID); errors.Is(err, pgx.ErrNoRows) {
		return ErrItemNotFound
	} else if err != nil {
		return fmt.Errorf("soft delete item: %w", err)
	}

	return nil
}

func (r *ItemRepository) count(ctx context.Context, category *models.ItemCategory, search string) (int64, error) {
	const query = `
		SELECT COUNT(*)
		FROM items
		WHERE deleted_at IS NULL
		  AND ($1::text IS NULL OR category = $1::text)
		  AND ($2::text IS NULL OR sku ILIKE '%' || $2::text || '%' OR name ILIKE '%' || $2::text || '%')
	`

	var value any
	if category != nil {
		value = string(*category)
	}

	var searchValue any
	if strings.TrimSpace(search) != "" {
		searchValue = strings.TrimSpace(search)
	}

	var total int64
	if err := r.db.QueryRow(ctx, query, value, searchValue).Scan(&total); err != nil {
		return 0, fmt.Errorf("count items: %w", err)
	}

	return total, nil
}

func mapItemWriteError(operation string, err error) error {
	var postgresError *pgconn.PgError
	if errors.As(err, &postgresError) &&
		postgresError.Code == "23505" &&
		postgresError.ConstraintName == itemSKUUniqueConstraint {
		return ErrItemSKUConflict
	}

	return fmt.Errorf("%s: %w", operation, err)
}
