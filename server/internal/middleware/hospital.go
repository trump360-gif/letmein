package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/letmein/server/internal/repository"
	pkgauth "github.com/letmein/server/pkg/auth"
)

// HospitalRequired verifies that the request comes from an authenticated user
// whose role is "hospital" and whose hospital record has status "approved".
// It sets "hospitalID" in the Gin context for downstream handlers.
func HospitalRequired(jwtManager *pkgauth.JWTManager, hospitalRepo repository.HospitalRepository) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Inline auth validation (don't call AuthRequired as middleware to avoid c.Next() issues)
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "authorization header required"})
			return
		}
		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid authorization header format"})
			return
		}
		claims, err := jwtManager.ValidateToken(parts[1])
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid or expired token"})
			return
		}
		c.Set(ContextKeyUserID, claims.UserID)
		c.Set(ContextKeyRole, claims.Role)

		role := claims.Role
		if role != "hospital" {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "hospital role required"})
			return
		}

		uid := claims.UserID
		ok := uid > 0
		if !ok {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			return
		}

		hospital, err := hospitalRepo.GetByUserID(uid)
		if err != nil {
			if err == repository.ErrNotFound {
				c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "hospital profile not found"})
				return
			}
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "failed to verify hospital"})
			return
		}

		if hospital.Status != "approved" {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "hospital account is not approved"})
			return
		}

		c.Set("hospitalID", hospital.ID)
		c.Next()
	}
}
