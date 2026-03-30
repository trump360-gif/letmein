package auth

import (
	"crypto/rsa"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"math/big"
	"net/http"
	"os"
	"sync"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

var ErrAppleAuth = errors.New("apple authentication failed")

// AppleClaims holds the verified claims from an Apple identity token.
type AppleClaims struct {
	Sub   string // Apple user ID (unique per app)
	Email string // may be empty if user chose to hide email
}

// appleJWKSResponse is the structure returned by Apple's public keys endpoint.
type appleJWKSResponse struct {
	Keys []appleJWK `json:"keys"`
}

type appleJWK struct {
	Kty string `json:"kty"`
	Kid string `json:"kid"`
	Use string `json:"use"`
	Alg string `json:"alg"`
	N   string `json:"n"`
	E   string `json:"e"`
}

// AppleTokenVerifier fetches and caches Apple's public keys for JWT verification.
type AppleTokenVerifier struct {
	mu          sync.RWMutex
	keys        map[string]*rsa.PublicKey // keyed by kid
	fetchedAt   time.Time
	cacheTTL    time.Duration
	audience    string // app bundle ID
	httpClient  *http.Client
}

// NewAppleTokenVerifier creates a verifier.
// audience is the iOS app bundle ID (e.g. "com.example.myapp").
// It is read from env APPLE_BUNDLE_ID at construction time; if empty it falls
// back to the provided fallback string.
func NewAppleTokenVerifier(bundleIDFallback string) *AppleTokenVerifier {
	audience := os.Getenv("APPLE_BUNDLE_ID")
	if audience == "" {
		audience = bundleIDFallback
	}
	return &AppleTokenVerifier{
		keys:       make(map[string]*rsa.PublicKey),
		cacheTTL:   24 * time.Hour,
		audience:   audience,
		httpClient: &http.Client{Timeout: 10 * time.Second},
	}
}

// VerifyIdentityToken validates an Apple Sign-In identity token and returns
// the subject (Apple user ID) and email.
func (v *AppleTokenVerifier) VerifyIdentityToken(identityToken string) (*AppleClaims, error) {
	// Parse the token header to get the key ID (kid) without verifying yet.
	kid, err := extractKID(identityToken)
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrAppleAuth, err)
	}

	key, err := v.getPublicKey(kid)
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrAppleAuth, err)
	}

	// Parse and verify the full token.
	type appleClaims struct {
		Email string `json:"email"`
		jwt.RegisteredClaims
	}

	token, err := jwt.ParseWithClaims(identityToken, &appleClaims{}, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodRSA); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}
		return key, nil
	},
		jwt.WithIssuer("https://appleid.apple.com"),
		jwt.WithAudience(v.audience),
		jwt.WithExpirationRequired(),
	)
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrAppleAuth, err)
	}

	claims, ok := token.Claims.(*appleClaims)
	if !ok || !token.Valid {
		return nil, ErrAppleAuth
	}

	sub, err := claims.GetSubject()
	if err != nil || sub == "" {
		return nil, fmt.Errorf("%w: missing sub claim", ErrAppleAuth)
	}

	return &AppleClaims{
		Sub:   sub,
		Email: claims.Email,
	}, nil
}

// getPublicKey returns the RSA public key for the given kid, refreshing the
// cached key set if necessary.
func (v *AppleTokenVerifier) getPublicKey(kid string) (*rsa.PublicKey, error) {
	v.mu.RLock()
	key, found := v.keys[kid]
	expired := time.Since(v.fetchedAt) > v.cacheTTL
	v.mu.RUnlock()

	if found && !expired {
		return key, nil
	}

	// Refresh key set.
	if err := v.refreshKeys(); err != nil {
		// If we have a stale key that matches, use it rather than failing.
		v.mu.RLock()
		key, found = v.keys[kid]
		v.mu.RUnlock()
		if found {
			return key, nil
		}
		return nil, err
	}

	v.mu.RLock()
	key, found = v.keys[kid]
	v.mu.RUnlock()
	if !found {
		return nil, fmt.Errorf("no matching Apple public key for kid=%s", kid)
	}
	return key, nil
}

// refreshKeys fetches Apple's public keys and stores them in the cache.
func (v *AppleTokenVerifier) refreshKeys() error {
	resp, err := v.httpClient.Get("https://appleid.apple.com/auth/keys")
	if err != nil {
		return fmt.Errorf("fetch apple public keys: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("apple JWKS endpoint returned %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("read apple JWKS response: %w", err)
	}

	var jwks appleJWKSResponse
	if err := json.Unmarshal(body, &jwks); err != nil {
		return fmt.Errorf("parse apple JWKS: %w", err)
	}

	newKeys := make(map[string]*rsa.PublicKey, len(jwks.Keys))
	for _, jwk := range jwks.Keys {
		if jwk.Kty != "RSA" {
			continue
		}
		pub, err := jwkToRSAPublicKey(jwk)
		if err != nil {
			continue // skip malformed keys
		}
		newKeys[jwk.Kid] = pub
	}

	v.mu.Lock()
	v.keys = newKeys
	v.fetchedAt = time.Now()
	v.mu.Unlock()

	return nil
}

// extractKID parses only the header of a JWT to retrieve the "kid" field.
func extractKID(tokenString string) (string, error) {
	parts := splitToken(tokenString)
	if len(parts) != 3 {
		return "", errors.New("invalid JWT format")
	}

	headerJSON, err := base64.RawURLEncoding.DecodeString(parts[0])
	if err != nil {
		return "", fmt.Errorf("decode JWT header: %w", err)
	}

	var header struct {
		Kid string `json:"kid"`
	}
	if err := json.Unmarshal(headerJSON, &header); err != nil {
		return "", fmt.Errorf("parse JWT header: %w", err)
	}
	if header.Kid == "" {
		return "", errors.New("JWT header missing kid")
	}
	return header.Kid, nil
}

// splitToken splits a JWT string into its three dot-separated parts.
func splitToken(token string) []string {
	var parts []string
	start := 0
	for i := 0; i < len(token); i++ {
		if token[i] == '.' {
			parts = append(parts, token[start:i])
			start = i + 1
		}
	}
	parts = append(parts, token[start:])
	return parts
}

// jwkToRSAPublicKey converts a JWK to an *rsa.PublicKey.
func jwkToRSAPublicKey(jwk appleJWK) (*rsa.PublicKey, error) {
	nBytes, err := base64.RawURLEncoding.DecodeString(jwk.N)
	if err != nil {
		return nil, fmt.Errorf("decode JWK n: %w", err)
	}
	eBytes, err := base64.RawURLEncoding.DecodeString(jwk.E)
	if err != nil {
		return nil, fmt.Errorf("decode JWK e: %w", err)
	}

	n := new(big.Int).SetBytes(nBytes)
	e := new(big.Int).SetBytes(eBytes)

	return &rsa.PublicKey{
		N: n,
		E: int(e.Int64()),
	}, nil
}
