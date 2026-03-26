package auth

import (
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// CentrifugoManager generates JWT tokens for Centrifugo authentication.
type CentrifugoManager struct {
	secret []byte
}

// NewCentrifugoManager creates a CentrifugoManager with the given HMAC secret.
func NewCentrifugoManager(secret string) *CentrifugoManager {
	return &CentrifugoManager{secret: []byte(secret)}
}

// centrifugoClaims holds the minimal claims required by Centrifugo connection JWT.
type centrifugoClaims struct {
	jwt.RegisteredClaims
}

// subscriptionClaims holds claims for Centrifugo subscription tokens.
type subscriptionClaims struct {
	Channel string `json:"channel"`
	jwt.RegisteredClaims
}

// GenerateCentrifugoToken generates a connection JWT for Centrifugo.
// The sub claim must be the user's string ID; Centrifugo uses it as the client identity.
func (m *CentrifugoManager) GenerateCentrifugoToken(userID string, expireAt time.Time) (string, error) {
	claims := &centrifugoClaims{
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   userID,
			ExpiresAt: jwt.NewNumericDate(expireAt),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString(m.secret)
	if err != nil {
		return "", fmt.Errorf("sign centrifugo token: %w", err)
	}
	return signed, nil
}

// GenerateSubscriptionToken generates a channel subscription JWT for Centrifugo.
// The channel claim restricts the token to a specific channel.
func (m *CentrifugoManager) GenerateSubscriptionToken(userID, channel string, expireAt time.Time) (string, error) {
	claims := &subscriptionClaims{
		Channel: channel,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   userID,
			ExpiresAt: jwt.NewNumericDate(expireAt),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString(m.secret)
	if err != nil {
		return "", fmt.Errorf("sign centrifugo subscription token: %w", err)
	}
	return signed, nil
}
