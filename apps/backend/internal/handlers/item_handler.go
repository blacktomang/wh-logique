package handlers

import (
	"context"
	"errors"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"wh-logique/backend/internal/models"
	"wh-logique/backend/internal/services"
	"wh-logique/backend/internal/validation"
	apperrors "wh-logique/backend/pkg/errors"
	"wh-logique/backend/pkg/response"
)

const (
	defaultItemsPage  = 1
	defaultItemsLimit = 10
	maximumItemsLimit = 100
)

var allowedItemCategories = []string{
	string(models.ItemCategoryRawMaterial),
	string(models.ItemCategoryFinishedGoods),
	string(models.ItemCategoryPackaging),
	string(models.ItemCategorySparePart),
	string(models.ItemCategoryConsumable),
	string(models.ItemCategoryEquipment),
}

var allowedItemUnits = []string{
	string(models.ItemUnitPieces),
	string(models.ItemUnitKg),
	string(models.ItemUnitGram),
	string(models.ItemUnitLiter),
	string(models.ItemUnitBox),
	string(models.ItemUnitCarton),
	string(models.ItemUnitPallet),
}

type ItemService interface {
	Create(ctx context.Context, input models.CreateItemInput) (models.Item, error)
	List(ctx context.Context, input models.ListItemsInput) ([]models.Item, int64, error)
	CheckSKUAvailability(ctx context.Context, input models.SKUAvailabilityInput) (models.SKUAvailability, error)
	GetByID(ctx context.Context, id uuid.UUID) (models.Item, error)
	Update(ctx context.Context, input models.UpdateItemInput) (models.Item, error)
	Delete(ctx context.Context, id uuid.UUID) error
}

type ItemHandler struct {
	service ItemService
}

type itemRequest struct {
	SKU      string `json:"sku"`
	Name     string `json:"name"`
	Category string `json:"category"`
	Unit     string `json:"unit"`
}

func NewItemHandler(service ItemService) *ItemHandler {
	return &ItemHandler{service: service}
}

// Create creates an item.
// @Summary Create item
// @Description Creates an item after trimming fields and normalizing its SKU to uppercase.
// @Tags items
// @Accept json
// @Produce json
// @Param item body itemRequest true "Item fields"
// @Success 201 {object} response.Envelope
// @Failure 400 {object} response.Envelope
// @Failure 409 {object} response.Envelope
// @Failure 500 {object} response.Envelope
// @Router /api/v1/items [post]
func (h *ItemHandler) Create(c *gin.Context) {
	request, details := bindItemRequest(c)
	if len(details) > 0 {
		response.Error(c, http.StatusBadRequest, "Invalid request", details)
		return
	}

	item, err := h.service.Create(c.Request.Context(), models.CreateItemInput{
		SKU:      request.SKU,
		Name:     request.Name,
		Category: models.ItemCategory(request.Category),
		Unit:     models.ItemUnit(request.Unit),
	})
	if err != nil {
		handleItemServiceError(c, err, "Failed to create item")
		return
	}

	response.Success(c, http.StatusCreated, "Item created successfully", item)
}

// List returns active items using optional category filtering and pagination.
// @Summary List items
// @Description Returns non-deleted items with optional category filtering and pagination.
// @Tags items
// @Produce json
// @Param category query string false "Item category" Enums(raw_material, finished_goods, packaging, spare_part, consumable, equipment)
// @Param q query string false "Search by SKU or name"
// @Param page query int false "Page number" default(1) minimum(1)
// @Param limit query int false "Items per page" default(10) minimum(1) maximum(100)
// @Success 200 {object} response.Envelope
// @Failure 400 {object} response.Envelope
// @Failure 500 {object} response.Envelope
// @Router /api/v1/items [get]
func (h *ItemHandler) List(c *gin.Context) {
	input, details := bindItemListInput(c)
	if len(details) > 0 {
		response.Error(c, http.StatusBadRequest, "Invalid request", details)
		return
	}

	items, total, err := h.service.List(c.Request.Context(), input)
	if err != nil {
		c.Error(apperrors.New(http.StatusInternalServerError, "Failed to retrieve items", err))
		return
	}

	response.SuccessWithMeta(
		c,
		http.StatusOK,
		"Items retrieved successfully",
		items,
		response.PaginationMeta{Page: input.Page, Limit: input.Limit, Total: total},
	)
}

// CheckSKUAvailability reports whether a normalized SKU can be used.
// @Summary Check SKU availability
// @Description Checks exact SKU availability, including SKUs reserved by soft-deleted items. An item ID can be excluded while editing.
// @Tags items
// @Produce json
// @Param sku query string true "SKU to check" maxlength(64)
// @Param exclude_id query string false "Current item ID to exclude" format(uuid)
// @Success 200 {object} response.Envelope
// @Failure 400 {object} response.Envelope
// @Failure 500 {object} response.Envelope
// @Router /api/v1/items/sku-availability [get]
func (h *ItemHandler) CheckSKUAvailability(c *gin.Context) {
	input, details := bindSKUAvailabilityInput(c)
	if len(details) > 0 {
		response.Error(c, http.StatusBadRequest, "Invalid request", details)
		return
	}

	availability, err := h.service.CheckSKUAvailability(c.Request.Context(), input)
	if err != nil {
		c.Error(apperrors.New(http.StatusInternalServerError, "Failed to check SKU availability", err))
		return
	}

	response.Success(c, http.StatusOK, "SKU availability checked successfully", availability)
}

// Get returns one active item.
// @Summary Get item
// @Description Returns a non-deleted item by ID.
// @Tags items
// @Produce json
// @Param id path string true "Item ID" format(uuid)
// @Success 200 {object} response.Envelope
// @Failure 400 {object} response.Envelope
// @Failure 404 {object} response.Envelope
// @Failure 500 {object} response.Envelope
// @Router /api/v1/items/{id} [get]
func (h *ItemHandler) Get(c *gin.Context) {
	id, ok := bindItemID(c)
	if !ok {
		return
	}

	item, err := h.service.GetByID(c.Request.Context(), id)
	if err != nil {
		handleItemServiceError(c, err, "Failed to retrieve item")
		return
	}

	response.Success(c, http.StatusOK, "Item retrieved successfully", item)
}

// Update replaces all mutable fields on an active item.
// @Summary Update item
// @Description Fully replaces an active item's SKU, name, category, and unit.
// @Tags items
// @Accept json
// @Produce json
// @Param id path string true "Item ID" format(uuid)
// @Param item body itemRequest true "Item fields"
// @Success 200 {object} response.Envelope
// @Failure 400 {object} response.Envelope
// @Failure 404 {object} response.Envelope
// @Failure 409 {object} response.Envelope
// @Failure 500 {object} response.Envelope
// @Router /api/v1/items/{id} [put]
func (h *ItemHandler) Update(c *gin.Context) {
	id, ok := bindItemID(c)
	if !ok {
		return
	}

	request, details := bindItemRequest(c)
	if len(details) > 0 {
		response.Error(c, http.StatusBadRequest, "Invalid request", details)
		return
	}

	item, err := h.service.Update(c.Request.Context(), models.UpdateItemInput{
		ID:       id,
		SKU:      request.SKU,
		Name:     request.Name,
		Category: models.ItemCategory(request.Category),
		Unit:     models.ItemUnit(request.Unit),
	})
	if err != nil {
		handleItemServiceError(c, err, "Failed to update item")
		return
	}

	response.Success(c, http.StatusOK, "Item updated successfully", item)
}

// Delete soft-deletes an active item.
// @Summary Delete item
// @Description Soft-deletes an active item. Its SKU remains reserved.
// @Tags items
// @Produce json
// @Param id path string true "Item ID" format(uuid)
// @Success 200 {object} response.Envelope
// @Failure 400 {object} response.Envelope
// @Failure 404 {object} response.Envelope
// @Failure 500 {object} response.Envelope
// @Router /api/v1/items/{id} [delete]
func (h *ItemHandler) Delete(c *gin.Context) {
	id, ok := bindItemID(c)
	if !ok {
		return
	}

	if err := h.service.Delete(c.Request.Context(), id); err != nil {
		handleItemServiceError(c, err, "Failed to delete item")
		return
	}

	response.Success(c, http.StatusOK, "Item deleted successfully", nil)
}

func bindItemRequest(c *gin.Context) (itemRequest, []response.ErrorDetail) {
	var request itemRequest
	if details := validation.DecodeJSON(c.Request.Body, &request); len(details) > 0 {
		return itemRequest{}, details
	}

	request.Category = strings.TrimSpace(request.Category)
	request.Unit = strings.TrimSpace(request.Unit)

	details := make([]response.ErrorDetail, 0)
	if normalized, detail := validation.RequiredString("sku", request.SKU, 64); detail != nil {
		details = append(details, *detail)
	} else {
		request.SKU = normalized
	}
	if normalized, detail := validation.RequiredString("name", request.Name, 255); detail != nil {
		details = append(details, *detail)
	} else {
		request.Name = normalized
	}
	if detail := validation.OneOf("category", request.Category, allowedItemCategories...); detail != nil {
		details = append(details, *detail)
	}
	if detail := validation.OneOf("unit", request.Unit, allowedItemUnits...); detail != nil {
		details = append(details, *detail)
	}

	return request, details
}

func bindItemListInput(c *gin.Context) (models.ListItemsInput, []response.ErrorDetail) {
	page, pageDetail := positiveIntQuery(c, "page", defaultItemsPage, 0)
	limit, limitDetail := positiveIntQuery(c, "limit", defaultItemsLimit, maximumItemsLimit)

	search := strings.TrimSpace(c.Query("q"))

	details := make([]response.ErrorDetail, 0, 3)
	if pageDetail != nil {
		details = append(details, *pageDetail)
	}
	if limitDetail != nil {
		details = append(details, *limitDetail)
	}

	var category *models.ItemCategory
	if value, exists := c.GetQuery("category"); exists {
		value = strings.TrimSpace(value)
		if detail := validation.OneOf("category", value, allowedItemCategories...); detail != nil {
			details = append(details, *detail)
		} else {
			typedCategory := models.ItemCategory(value)
			category = &typedCategory
		}
	}

	return models.ListItemsInput{Search: search, Category: category, Page: page, Limit: limit}, details
}

func bindSKUAvailabilityInput(c *gin.Context) (models.SKUAvailabilityInput, []response.ErrorDetail) {
	sku, skuDetail := validation.RequiredString("sku", c.Query("sku"), 64)
	details := make([]response.ErrorDetail, 0, 2)
	if skuDetail != nil {
		details = append(details, *skuDetail)
	}

	var excludeID *uuid.UUID
	if value, exists := c.GetQuery("exclude_id"); exists {
		parsed, err := uuid.Parse(strings.TrimSpace(value))
		if err != nil {
			details = append(details, response.ErrorDetail{
				Field:  "exclude_id",
				Reason: "Must be a valid UUID",
			})
		} else {
			excludeID = &parsed
		}
	}

	return models.SKUAvailabilityInput{SKU: sku, ExcludeID: excludeID}, details
}

func positiveIntQuery(c *gin.Context, field string, defaultValue, maximum int) (int, *response.ErrorDetail) {
	value, exists := c.GetQuery(field)
	if !exists {
		return defaultValue, nil
	}

	parsed, err := strconv.Atoi(value)
	if err != nil || parsed < 1 {
		return 0, &response.ErrorDetail{Field: field, Reason: "Must be a positive integer"}
	}
	if maximum > 0 && parsed > maximum {
		return 0, &response.ErrorDetail{
			Field:  field,
			Reason: "Must be at most " + strconv.Itoa(maximum),
		}
	}

	return parsed, nil
}

func bindItemID(c *gin.Context) (uuid.UUID, bool) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "Invalid request", []response.ErrorDetail{
			{Field: "id", Reason: "Must be a valid UUID"},
		})
		return uuid.Nil, false
	}

	return id, true
}

func handleItemServiceError(c *gin.Context, err error, internalMessage string) {
	switch {
	case errors.Is(err, services.ErrItemNotFound):
		c.Error(apperrors.New(http.StatusNotFound, "Item not found", nil))
	case errors.Is(err, services.ErrItemSKUConflict):
		c.Error(apperrors.NewWithDetails(
			http.StatusConflict,
			"SKU already exists",
			[]response.ErrorDetail{{Field: "sku", Reason: "Duplicate entry"}},
			nil,
		))
	default:
		c.Error(apperrors.New(http.StatusInternalServerError, internalMessage, err))
	}
}
