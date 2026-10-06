package response

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type Envelope struct {
	Success bool          `json:"success"`
	Message string        `json:"message"`
	Data    any           `json:"data,omitempty"`
	Meta    any           `json:"meta,omitempty"`
	Errors  []ErrorDetail `json:"errors,omitempty"`
}

type ErrorDetail struct {
	Field  string `json:"field,omitempty"`
	Reason string `json:"reason"`
}

func Success(c *gin.Context, status int, message string, data any) {
	c.JSON(status, Envelope{
		Success: true,
		Message: message,
		Data:    data,
	})
}

func Error(c *gin.Context, status int, message string, errors []ErrorDetail) {
	c.JSON(status, Envelope{
		Success: false,
		Message: message,
		Errors:  errors,
	})
}

func InternalError(c *gin.Context) {
	Error(c, http.StatusInternalServerError, "Internal server error", nil)
}
