package handlers

import (
	"context"
	"net/http"

	"github.com/gin-gonic/gin"

	"wh-logique/backend/internal/models"
	apperrors "wh-logique/backend/pkg/errors"
	"wh-logique/backend/pkg/response"
)

type LocationService interface {
	List(ctx context.Context) ([]models.Location, error)
}

type LocationHandler struct {
	service LocationService
}

func NewLocationHandler(service LocationService) *LocationHandler {
	return &LocationHandler{service: service}
}

// List returns every configured warehouse location.
// @Summary List locations
// @Description Returns all seeded warehouse locations without pagination.
// @Tags locations
// @Produce json
// @Success 200 {object} response.Envelope
// @Failure 500 {object} response.Envelope
// @Router /locations [get]
func (h *LocationHandler) List(c *gin.Context) {
	locations, err := h.service.List(c.Request.Context())
	if err != nil {
		c.Error(apperrors.New(http.StatusInternalServerError, "Failed to retrieve locations", err))
		return
	}

	response.Success(c, http.StatusOK, "Locations retrieved successfully", locations)
}
