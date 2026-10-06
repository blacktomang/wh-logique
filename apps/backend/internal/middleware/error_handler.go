package middleware

import (
	stderrors "errors"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"

	apperrors "wh-logique/backend/pkg/errors"
	"wh-logique/backend/pkg/response"
)

func ErrorHandler(logger *zap.Logger) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next()

		if len(c.Errors) == 0 || c.Writer.Written() {
			return
		}

		err := c.Errors.Last().Err
		var appError *apperrors.AppError
		if stderrors.As(err, &appError) {
			if appError.Err != nil {
				logger.Error("request failed",
					zap.String("request_id", RequestIDFrom(c)),
					zap.Error(appError.Err),
				)
			}
			response.Error(c, appError.Status, appError.Message, nil)
			return
		}

		logger.Error("unhandled request error",
			zap.String("request_id", RequestIDFrom(c)),
			zap.Error(err),
		)
		response.InternalError(c)
	}
}
