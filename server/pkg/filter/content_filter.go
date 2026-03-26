package filter

import (
	"regexp"
	"strings"
)

// hospitalNamePatterns detects references to specific hospital or clinic names.
var hospitalNamePatterns = []*regexp.Regexp{
	// e.g. "강남성형외과", "~의원", "~클리닉", "~병원"
	regexp.MustCompile(`\S+성형외과`),
	regexp.MustCompile(`\S+의원`),
	regexp.MustCompile(`\S+클리닉`),
	regexp.MustCompile(`\S+병원`),
	regexp.MustCompile(`\S+외과`),
	regexp.MustCompile(`\S+피부과`),
}

// doctorNamePatterns detects references to specific doctor titles.
var doctorNamePatterns = []*regexp.Regexp{
	// e.g. "김원장", "박의사"
	regexp.MustCompile(`\S+원장`),
	regexp.MustCompile(`\S+의사`),
}

// competitorPatterns detects references to competing platforms.
var competitorPatterns = []*regexp.Regexp{
	regexp.MustCompile(`강남언니`),
	regexp.MustCompile(`바비톡`),
	regexp.MustCompile(`여신티켓`),
}

// profanityList is a hard-coded set of Korean profanities to be blinded.
// Ordered longest-first to ensure more specific matches take precedence.
var profanityList = []string{
	"씨발", "씨팔", "시발", "시팔",
	"개새끼", "개새",
	"병신", "미친놈", "미친년",
	"존나", "존내",
	"ㅅㅂ", "ㅄ",
}

// profanityReplacement is the substitution string for blinded terms.
const profanityReplacement = "***"

// ContainsBlockedContent reports whether the text contains content that must be
// rejected at post creation time. It returns (true, matchedTerm) when blocked
// content is found, or (false, "") when the text is clean.
func ContainsBlockedContent(text string) (blocked bool, reason string) {
	for _, re := range hospitalNamePatterns {
		if m := re.FindString(text); m != "" {
			return true, "병원/의원/클리닉 이름은 게시물에 포함할 수 없습니다: " + m
		}
	}

	for _, re := range doctorNamePatterns {
		if m := re.FindString(text); m != "" {
			return true, "의사/원장 이름은 게시물에 포함할 수 없습니다: " + m
		}
	}

	for _, re := range competitorPatterns {
		if m := re.FindString(text); m != "" {
			return true, "타 플랫폼 언급은 허용되지 않습니다: " + m
		}
	}

	return false, ""
}

// BlindSensitiveContent replaces profanity and price information in text with
// the placeholder string "***" and returns the sanitized result.
func BlindSensitiveContent(text string) string {
	// Replace profanity.
	for _, word := range profanityList {
		text = strings.ReplaceAll(text, word, profanityReplacement)
	}

	// Replace price information using the existing pricePatterns.
	for _, re := range pricePatterns {
		text = re.ReplaceAllString(text, profanityReplacement)
	}

	return text
}
