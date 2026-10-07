package handlers

import (
	"context"
	"errors"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"wh-logique/backend/internal/models"
	"wh-logique/backend/internal/services"
	"wh-logique/backend/internal/validation"
	apperrors "wh-logique/backend/pkg/errors"
	"wh-logique/backend/pkg/response"
)

const maximumReceiveLines = 100

type StockService interface {
	Receive(ctx context.Context, input models.ReceiveStockInput) ([]models.Stock, error)
	ListByItem(ctx context.Context, itemID uuid.UUID) ([]models.Stock, error)
	ListLogsByItem(ctx context.Context, itemID uuid.UUID) ([]models.StockLog, error)
}

type StockHandler struct {
	service StockService
}

type stockReceiveRequest struct {
	Lines []stockReceiveLineRequest `json:"lines"`
}

type stockReceiveLineRequest struct {
	ItemID     string `json:"item_id"`
	LocationID string `json:"location_id"`
	Qty        *int   `json:"qty"`
}

func NewStockHandler(service StockService) *StockHandler {
	return &StockHandler{service: service}
}

// Receive adds stock for the requested item and location pairs.
// @Summary Receive stock
// @Description Applies one or more stock receipts atomically. Each line adds the given quantity to an item-location balance and records an append-only stock log entry.
// @Tags stock
// @Accept json
// @Produce json
// @Param request body stockReceiveRequest true "Receive lines"
// @Success 200 {object} response.Envelope
// @Failure 400 {object} response.Envelope
// @Failure 404 {object} response.Envelope
// @Failure 500 {object} response.Envelope
// @Router /api/v1/stock/receive [post]
func (h *StockHandler) Receive(c *gin.Context) {
	lines, details := bindStockReceiveRequest(c)
	if len(details) > 0 {
		response.Error(c, http.StatusBadRequest, "Invalid request", details)
		return
	}

	stocks, err := h.service.Receive(c.Request.Context(), models.ReceiveStockInput{Lines: lines})
	if err != nil {
		handleStockServiceError(c, err, "Failed to receive stock")
		return
	}

	response.Success(c, http.StatusOK, "Stock received successfully", stocks)
}

// Get returns the stock balance for an item across all locations.
// @Summary Get stock by item
// @Description Returns every stock balance for a single item, grouped by location.
// @Tags stock
// @Produce json
// @Param item_id path string true "Item ID" format(uuid)
// @Success 200 {object} response.Envelope
// @Failure 400 {object} response.Envelope
// @Failure 404 {object} response.Envelope
// @Failure 500 {object} response.Envelope
// @Router /api/v1/stock/{item_id} [get]
func (h *StockHandler) Get(c *gin.Context) {
	itemID, ok := bindStockItemID(c)
	if !ok {
		return
	}

	stocks, err := h.service.ListByItem(c.Request.Context(), itemID)
	if err != nil {
		handleStockServiceError(c, err, "Failed to retrieve stock")
		return
	}

	response.Success(c, http.StatusOK, "Stock retrieved successfully", stocks)
}

// GetLogs returns the append-only receipt history for an item.
// @Summary Get stock logs by item
// @Description Returns every stock receipt for a single item, newest first.
// @Tags stock
// @Produce json
// @Param item_id path string true "Item ID" format(uuid)
// @Success 200 {object} response.Envelope
// @Failure 400 {object} response.Envelope
// @Failure 500 {object} response.Envelope
// @Router /api/v1/stock/{item_id}/logs [get]
func (h *StockHandler) GetLogs(c *gin.Context) {
	itemID, ok := bindStockItemID(c)
	if !ok {
		return
	}

	logs, err := h.service.ListLogsByItem(c.Request.Context(), itemID)
	if err != nil {
		handleStockServiceError(c, err, "Failed to retrieve stock logs")
		return
	}

	response.Success(c, http.StatusOK, "Stock logs retrieved successfully", logs)
}

func bindStockReceiveRequest(c *gin.Context) ([]models.ReceiveStockLine, []response.ErrorDetail) {
	var request stockReceiveRequest
	if details := validation.DecodeJSON(c.Request.Body, &request); len(details) > 0 {
		return nil, details
	}

	details := make([]response.ErrorDetail, 0)
	if len(request.Lines) == 0 {
		details = append(details, response.ErrorDetail{Field: "lines", Reason: "Must contain at least one line"})
		return nil, details
	}
	if len(request.Lines) > maximumReceiveLines {
		details = append(details, response.ErrorDetail{
			Field:  "lines",
			Reason: fmt.Sprintf("Must contain at most %d lines", maximumReceiveLines),
		})
		return nil, details
	}

	lines := make([]models.ReceiveStockLine, 0, len(request.Lines))
	for index, line := range request.Lines {
		field := fmt.Sprintf("lines[%d]", index)
		itemID, itemIDDetail := requiredUUID(field+".item_id", line.ItemID)
		locationID, locationIDDetail := requiredUUID(field+".location_id", line.LocationID)
		if itemIDDetail != nil {
			details = append(details, *itemIDDetail)
		}
		if locationIDDetail != nil {
			details = append(details, *locationIDDetail)
		}
		if line.Qty == nil || *line.Qty < 1 {
			details = append(details, response.ErrorDetail{
				Field:  field + ".qty",
				Reason: "Must be a positive integer",
			})
		}

		if itemIDDetail == nil && locationIDDetail == nil && line.Qty != nil && *line.Qty >= 1 {
			lines = append(lines, models.ReceiveStockLine{
				ItemID:     itemID,
				LocationID: locationID,
				Qty:        *line.Qty,
			})
		}
	}

	if len(details) > 0 {
		return nil, details
	}

	return lines, nil
}

func requiredUUID(field, value string) (uuid.UUID, *response.ErrorDetail) {
	id, err := uuid.Parse(value)
	if err != nil {
		return uuid.Nil, &response.ErrorDetail{Field: field, Reason: "Must be a valid UUID"}
	}

	return id, nil
}

func bindStockItemID(c *gin.Context) (uuid.UUID, bool) {
	id, err := uuid.Parse(c.Param("item_id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid request", []response.ErrorDetail{
			{Field: "item_id", Reason: "Must be a valid UUID"},
		})
		return uuid.Nil, false
	}

	return id, true
}

func handleStockServiceError(c *gin.Context, err error, internalMessage string) {
	switch {
	case errors.Is(err, services.ErrStockItemNotFound):
		c.Error(apperrors.NewWithDetails(
			http.StatusNotFound,
			"Item not found",
			[]response.ErrorDetail{{Field: "item_id", Reason: "Item does not exist"}},
			nil,
		))
	case errors.Is(err, services.ErrStockLocationNotFound):
		c.Error(apperrors.NewWithDetails(
			http.StatusNotFound,
			"Location not found",
			[]response.ErrorDetail{{Field: "location_id", Reason: "Location does not exist"}},
			nil,
		))
	default:
		c.Error(apperrors.New(http.StatusInternalServerError, internalMessage, err))
	}
}
