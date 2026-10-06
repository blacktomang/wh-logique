package middleware

import (
	"net/http"
	"slices"

	"github.com/gin-gonic/gin"
)

const (
	allowMethods     = "GET, POST, PUT, DELETE, OPTIONS"
	allowHeaders     = "Content-Type, X-Request-ID"
	corsMaxAge       = "600"
	wildcardOrigin   = "*"
	headerVary       = "Vary"
	headerOrigin     = "Origin"
	headerAllowOrigin = "Access-Control-Allow-Origin"
	headerAllowMethods = "Access-Control-Allow-Methods"
	headerAllowHeaders = "Access-Control-Allow-Headers"
	headerMaxAge       = "Access-Control-Max-Age"
)

// CORS returns middleware that enforces cross-origin access based on the
// configured allow-list. A wildcard ("*") origin permits any origin; otherwise
// the request Origin must match an entry, or the response carries no CORS
// headers and the browser will block the request.
func CORS(allowedOrigins []string) gin.HandlerFunc {
	allowAll := slices.Contains(allowedOrigins, wildcardOrigin)

	return func(c *gin.Context) {
		origin := c.GetHeader(headerOrigin)
		if origin == "" {
			c.Next()
			return
		}

		if !allowAll && !slices.Contains(allowedOrigins, origin) {
			c.Next()
			return
		}

		c.Header(headerAllowOrigin, origin)
		c.Header(headerVary, headerOrigin)

		if c.Request.Method == http.MethodOptions {
			c.Header(headerAllowMethods, allowMethods)
			c.Header(headerAllowHeaders, allowHeaders)
			c.Header(headerMaxAge, corsMaxAge)
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	}
}
