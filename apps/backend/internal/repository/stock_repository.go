package repository

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"

	"wh-logique/backend/internal/models"
)

var (
	ErrStockItemNotFound     = errors.New("stock item not found")
	ErrStockLocationNotFound = errors.New("stock location not found")
)

const (
	stockItemsForeignKeyConstraint     = "stocks_item_id_fkey"
	stockLogsItemsForeignKeyConstraint = "stock_logs_item_id_fkey"
	stockLocationsForeignKeyConstraint = "stocks_location_id_fkey"
)

type StockRepository struct {
	db *pgxpool.Pool
}

func NewStockRepository(db *pgxpool.Pool) *StockRepository {
	return &StockRepository{db: db}
}

func (r *StockRepository) Receive(ctx context.Context, lines []models.ReceiveStockLine) ([]models.Stock, error) {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("begin stock receive: %w", err)
	}
	defer tx.Rollback(ctx)

	updated := make([]models.Stock, 0, len(lines))
	for _, line := range lines {
		stock, err := receiveOne(ctx, tx, line)
		if err != nil {
			return nil, err
		}
		updated = append(updated, stock)
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("commit stock receive: %w", err)
	}

	return updated, nil
}

func (r *StockRepository) ListByItem(ctx context.Context, itemID uuid.UUID) ([]models.Stock, error) {
	const query = `
		SELECT id, item_id, location_id, qty, updated_at
		FROM stocks
		WHERE item_id = $1
		ORDER BY location_id
	`

	rows, err := r.db.Query(ctx, query, itemID)
	if err != nil {
		return nil, fmt.Errorf("query stocks: %w", err)
	}
	defer rows.Close()

	stocks := make([]models.Stock, 0)
	for rows.Next() {
		var stock models.Stock
		if err := rows.Scan(&stock.ID, &stock.ItemID, &stock.LocationID, &stock.Qty, &stock.UpdatedAt); err != nil {
			return nil, fmt.Errorf("scan stock: %w", err)
		}
		stocks = append(stocks, stock)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate stocks: %w", err)
	}

	return stocks, nil
}

func receiveOne(ctx context.Context, tx pgx.Tx, line models.ReceiveStockLine) (models.Stock, error) {
	stock, err := upsertStock(ctx, tx, line)
	if err != nil {
		return models.Stock{}, err
	}

	if err := insertStockLog(ctx, tx, stock, line.Qty); err != nil {
		return models.Stock{}, err
	}

	return stock, nil
}

func upsertStock(ctx context.Context, tx pgx.Tx, line models.ReceiveStockLine) (models.Stock, error) {
	const query = `
		INSERT INTO stocks (item_id, location_id, qty)
		VALUES ($1, $2, $3)
		ON CONFLICT (item_id, location_id)
		DO UPDATE SET qty = stocks.qty + EXCLUDED.qty, updated_at = NOW()
		RETURNING id, item_id, location_id, qty, updated_at
	`

	var stock models.Stock
	err := tx.QueryRow(ctx, query, line.ItemID, line.LocationID, line.Qty).Scan(
		&stock.ID,
		&stock.ItemID,
		&stock.LocationID,
		&stock.Qty,
		&stock.UpdatedAt,
	)
	if err != nil {
		return models.Stock{}, mapStockForeignKeyError("upsert stock", err)
	}

	return stock, nil
}

func insertStockLog(ctx context.Context, tx pgx.Tx, stock models.Stock, receivedQty int) error {
	const query = `
		INSERT INTO stock_logs (item_id, location_id, qty)
		VALUES ($1, $2, $3)
	`

	if _, err := tx.Exec(ctx, query, stock.ItemID, stock.LocationID, receivedQty); err != nil {
		return mapStockForeignKeyError("insert stock log", err)
	}

	return nil
}

func mapStockForeignKeyError(operation string, err error) error {
	var postgresError *pgconn.PgError
	if errors.As(err, &postgresError) && postgresError.Code == "23503" {
		switch postgresError.ConstraintName {
		case stockItemsForeignKeyConstraint, stockLogsItemsForeignKeyConstraint:
			return ErrStockItemNotFound
		case stockLocationsForeignKeyConstraint:
			return ErrStockLocationNotFound
		}
	}

	return fmt.Errorf("%s: %w", operation, err)
}
