package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"

	"wh-logique/backend/pkg/response"
)

func Recovery(logger *zap.Logger) gin.HandlerFunc {
	return gin.CustomRecovery(func(c *gin.Context, recovered any) {
		logger.Error("panic recovered",
			zap.String("request_id", RequestIDFrom(c)),
			zap.Any("panic", recovered),
		)
		response.Error(c, http.StatusInternalServerError, "Internal server error", nil)
	})
}
