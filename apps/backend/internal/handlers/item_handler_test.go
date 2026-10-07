package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"go.uber.org/zap"

	"wh-logique/backend/internal/middleware"
	"wh-logique/backend/internal/models"
	"wh-logique/backend/internal/services"
	"wh-logique/backend/pkg/response"
)

type itemServiceStub struct {
	createCalls int
	updateCalls int
	getCalls    int
	deleteCalls int
	createErr   error
	updateErr   error
	getErr      error
	deleteErr   error
}

func (s *itemServiceStub) Create(context.Context, models.CreateItemInput) (models.Item, error) {
	s.createCalls++
	return models.Item{}, s.createErr
}

func (s *itemServiceStub) List(context.Context, models.ListItemsInput) ([]models.Item, int64, error) {
	return nil, 0, nil
}

func (s *itemServiceStub) GetByID(context.Context, uuid.UUID) (models.Item, error) {
	s.getCalls++
	return models.Item{}, s.getErr
}

func (s *itemServiceStub) Update(context.Context, models.UpdateItemInput) (models.Item, error) {
	s.updateCalls++
	return models.Item{}, s.updateErr
}

func (s *itemServiceStub) Delete(context.Context, uuid.UUID) error {
	s.deleteCalls++
	return s.deleteErr
}

func TestItemHandlerCreateRejectsInvalidInputBeforeService(t *testing.T) {
	tests := []struct {
		name          string
		body          string
		expectedField string
	}{
		{
			name:          "missing required name",
			body:          `{"sku":"SKU-001","category":"raw_material","unit":"pcs"}`,
			expectedField: "name",
		},
		{
			name:          "invalid category",
			body:          `{"sku":"SKU-001","name":"Item","category":"invalid","unit":"pcs"}`,
			expectedField: "category",
		},
		{
			name:          "invalid unit",
			body:          `{"sku":"SKU-001","name":"Item","category":"raw_material","unit":"invalid"}`,
			expectedField: "unit",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			service := &itemServiceStub{}
			recorder := performItemRequest(t, service, http.MethodPost, "/items", tt.body)

			if recorder.Code != http.StatusBadRequest {
				t.Fatalf("status = %d, want %d; body = %s", recorder.Code, http.StatusBadRequest, recorder.Body.String())
			}
			if service.createCalls != 0 {
				t.Fatalf("service Create() calls = %d, want 0", service.createCalls)
			}

			envelope := decodeEnvelope(t, recorder)
			if envelope.Success {
				t.Fatal("success = true, want false")
			}
			if envelope.Message != "Invalid request" {
				t.Fatalf("message = %q, want %q", envelope.Message, "Invalid request")
			}
			if !hasErrorField(envelope.Errors, tt.expectedField) {
				t.Fatalf("errors = %#v, want field %q", envelope.Errors, tt.expectedField)
			}
		})
	}
}

func TestItemHandlerReturnsConflictForDuplicateSKU(t *testing.T) {
	const validBody = `{"sku":"SKU-001","name":"Item","category":"raw_material","unit":"pcs"}`
	itemID := uuid.NewString()

	tests := []struct {
		name      string
		method    string
		path      string
		configure func(*itemServiceStub)
		calls     func(*itemServiceStub) int
	}{
		{
			name:   "create",
			method: http.MethodPost,
			path:   "/items",
			configure: func(service *itemServiceStub) {
				service.createErr = services.ErrItemSKUConflict
			},
			calls: func(service *itemServiceStub) int { return service.createCalls },
		},
		{
			name:   "update",
			method: http.MethodPut,
			path:   "/items/" + itemID,
			configure: func(service *itemServiceStub) {
				service.updateErr = services.ErrItemSKUConflict
			},
			calls: func(service *itemServiceStub) int { return service.updateCalls },
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			service := &itemServiceStub{}
			tt.configure(service)
			recorder := performItemRequest(t, service, tt.method, tt.path, validBody)

			if recorder.Code != http.StatusConflict {
				t.Fatalf("status = %d, want %d; body = %s", recorder.Code, http.StatusConflict, recorder.Body.String())
			}
			if tt.calls(service) != 1 {
				t.Fatalf("service calls = %d, want 1", tt.calls(service))
			}

			envelope := decodeEnvelope(t, recorder)
			if envelope.Success {
				t.Fatal("success = true, want false")
			}
			if envelope.Message != "SKU already exists" {
				t.Fatalf("message = %q, want %q", envelope.Message, "SKU already exists")
			}
			if len(envelope.Errors) != 1 || envelope.Errors[0].Field != "sku" || envelope.Errors[0].Reason != "Duplicate entry" {
				t.Fatalf("errors = %#v, want duplicate sku detail", envelope.Errors)
			}
		})
	}
}

func TestItemHandlerReturnsNotFoundForMissingItem(t *testing.T) {
	itemID := uuid.NewString()
	const validBody = `{"sku":"SKU-001","name":"Item","category":"raw_material","unit":"pcs"}`

	tests := []struct {
		name      string
		method    string
		body      string
		configure func(*itemServiceStub)
		calls     func(*itemServiceStub) int
	}{
		{
			name:   "get",
			method: http.MethodGet,
			configure: func(service *itemServiceStub) {
				service.getErr = services.ErrItemNotFound
			},
			calls: func(service *itemServiceStub) int { return service.getCalls },
		},
		{
			name:   "update",
			method: http.MethodPut,
			body:   validBody,
			configure: func(service *itemServiceStub) {
				service.updateErr = services.ErrItemNotFound
			},
			calls: func(service *itemServiceStub) int { return service.updateCalls },
		},
		{
			name:   "delete",
			method: http.MethodDelete,
			configure: func(service *itemServiceStub) {
				service.deleteErr = services.ErrItemNotFound
			},
			calls: func(service *itemServiceStub) int { return service.deleteCalls },
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			service := &itemServiceStub{}
			tt.configure(service)
			recorder := performItemRequest(t, service, tt.method, "/items/"+itemID, tt.body)

			if recorder.Code != http.StatusNotFound {
				t.Fatalf("status = %d, want %d; body = %s", recorder.Code, http.StatusNotFound, recorder.Body.String())
			}
			if tt.calls(service) != 1 {
				t.Fatalf("service calls = %d, want 1", tt.calls(service))
			}

			envelope := decodeEnvelope(t, recorder)
			if envelope.Success {
				t.Fatal("success = true, want false")
			}
			if envelope.Message != "Item not found" {
				t.Fatalf("message = %q, want %q", envelope.Message, "Item not found")
			}
		})
	}
}

func performItemRequest(t *testing.T, service ItemService, method, path, body string) *httptest.ResponseRecorder {
	t.Helper()
	gin.SetMode(gin.TestMode)

	handler := NewItemHandler(service)
	router := gin.New()
	router.Use(middleware.ErrorHandler(zap.NewNop()))
	router.POST("/items", handler.Create)
	router.GET("/items/:id", handler.Get)
	router.PUT("/items/:id", handler.Update)
	router.DELETE("/items/:id", handler.Delete)

	request := httptest.NewRequest(method, path, bytes.NewBufferString(body))
	request.Header.Set("Content-Type", "application/json")
	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, request)
	return recorder
}

func decodeEnvelope(t *testing.T, recorder *httptest.ResponseRecorder) response.Envelope {
	t.Helper()
	var envelope response.Envelope
	if err := json.Unmarshal(recorder.Body.Bytes(), &envelope); err != nil {
		t.Fatalf("decode response envelope: %v; body = %s", err, recorder.Body.String())
	}
	return envelope
}

func hasErrorField(errors []response.ErrorDetail, field string) bool {
	for _, detail := range errors {
		if detail.Field == field {
			return true
		}
	}
	return false
}
