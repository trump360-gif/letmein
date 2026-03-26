// Package filter provides text-content filtering utilities for user-generated content.
// It is designed to be shared across consultation and chat modules.
package filter

import (
	"regexp"
	"strings"
)

// pricePatterns detects price-related keywords in Korean text.
// Matches patterns like: "만원", "원", "300만", "50만원", numbers followed by price units.
var pricePatterns = []*regexp.Regexp{
	// Pure Korean price words
	regexp.MustCompile(`만원`),
	// Number + 만 (e.g. "300만", "50만")
	regexp.MustCompile(`\d+\s*만`),
	// Number + 원 (e.g. "30000원", "300 원")
	regexp.MustCompile(`\d+\s*원`),
	// Korean number + 만 (십만, 백만, 천만 etc.)
	regexp.MustCompile(`[십백천]+만`),
}

// contactPatterns detects personal contact information.
// Matches Korean mobile numbers, KakaoTalk references, and similar identifiers.
var contactPatterns = []*regexp.Regexp{
	// Korean mobile numbers: 010-xxxx-xxxx, 010.xxxx.xxxx, 01012345678, spaces allowed
	regexp.MustCompile(`01[016789][\s\-\.]?\d{3,4}[\s\-\.]?\d{4}`),
	// Legacy carrier numbers 011, 016, 017, 018, 019
	regexp.MustCompile(`01[16789][\s\-\.]?\d{3,4}[\s\-\.]?\d{4}`),
	// KakaoTalk references (case-insensitive via strings.ToLower before match)
	regexp.MustCompile(`카카오톡`),
	regexp.MustCompile(`카톡`),
	regexp.MustCompile(`kakao`),
	// KakaoTalk ID patterns: "카카오: abc123", "카톡id: abc"
	regexp.MustCompile(`카카오\s*[：:]\s*\S+`),
	regexp.MustCompile(`카톡\s*[：:id]\s*\S+`),
	// Generic "id" followed by non-space chars suggesting a handle
	regexp.MustCompile(`아이디\s*[：:]\s*\S+`),
}

// ContainsPrice reports whether the text contains price-related keywords.
func ContainsPrice(text string) bool {
	for _, re := range pricePatterns {
		if re.MatchString(text) {
			return true
		}
	}
	return false
}

// ContainsContact reports whether the text contains phone numbers or KakaoTalk identifiers.
func ContainsContact(text string) bool {
	lower := strings.ToLower(text)
	for _, re := range contactPatterns {
		if re.MatchString(lower) {
			return true
		}
	}
	return false
}

// FilterMessage checks text for forbidden content.
// It returns (true, "") if the text is clean, or (false, reason) if it should be blocked.
func FilterMessage(text string) (clean bool, reason string) {
	if ContainsPrice(text) {
		return false, "가격 정보는 메시지에 포함할 수 없습니다"
	}
	if ContainsContact(text) {
		return false, "연락처 정보는 메시지에 포함할 수 없습니다"
	}
	return true, ""
}
