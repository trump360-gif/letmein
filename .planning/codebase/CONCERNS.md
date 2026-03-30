# Codebase Concerns

**Analysis Date:** 2026-03-30

---

## Tech Debt

**Kakao SDK Not Integrated (Flutter app):**
- Issue: `loginWithKakao()` immediately calls `_repository.devLogin()` instead of using real Kakao OAuth. The `kakaoAccessToken` parameter is accepted but discarded.
- Files: `app/lib/features/auth/presentation/auth_provider.dart` (lines 125–131), `app/lib/features/auth/data/auth_repository.dart` (lines 41–46)
- Impact: Kakao login is completely non-functional in production. All users log in as the hardcoded test user ID 1.
- Fix approach: Integrate `flutter_kakao_sdk` (or `kakao_flutter_sdk`), obtain a real access token from the SDK, then pass it to the existing `kakaoLogin()` repository method.

**Apple Bundle ID Not Configured:**
- Issue: `NewAppleTokenVerifier("")` is called with an empty fallback; the real bundle ID must come from `APPLE_BUNDLE_ID` env var at runtime. If that env var is absent, Apple Sign-In token validation will fail.
- Files: `server/internal/handler/auth_handler.go` (line 25)
- Impact: Apple login silently fails in environments where `APPLE_BUNDLE_ID` is not set.
- Fix approach: Pass the bundle ID as a required `Config` field, fail fast at startup if missing.

**Dev-Login Endpoint Exposed with No Environment Guard:**
- Issue: `POST /api/v1/auth/dev-login` is registered unconditionally in `routes.go` regardless of `GIN_MODE` or any feature flag. It accepts any `userId` and returns full JWT tokens.
- Files: `server/internal/handler/routes.go` (line 111), `server/internal/handler/auth_handler.go` (lines 97–120)
- Impact: Any unauthenticated caller can obtain admin-level tokens for any user ID in production, completely bypassing authentication.
- Fix approach: Wrap the route registration in `if cfg.Env != "production"` or remove it before go-live. Add an environment field to `Config`.

**Media Variant Paths Never Persisted to DB:**
- Issue: `generateVariants()` runs asynchronously and generates `thumb`, `medium`, `full` image files, but `updateVariantPaths()` only `log.Printf`s the paths rather than actually updating the DB record. The DB record always has `nil` variant paths.
- Files: `server/internal/service/media_service.go` (lines 161–173)
- Impact: All image consumers that try to use `thumb_path`, `medium_path`, or `full_path` fall back to the full original, causing unnecessary bandwidth usage and preventing progressive loading.
- Fix approach: Either pass `*sql.DB` to the background goroutine and execute a targeted `UPDATE images SET ... WHERE id = $1`, or add a `UpdateVariantPaths(id int64, thumb, medium, full string) error` method to `ImageRepository`.

**Inconsistent Pagination Strategy:**
- Issue: Some repositories use offset/page-based pagination (`consultation_repo.go`, `admin_repo.go`) while others use cursor-based pagination (`post_repo.go`, `poll_repo.go`, `hospital_repo.go`). Mixing the two patterns in the same API surface is inconsistent.
- Files: `server/internal/repository/consultation_repo.go`, `server/internal/repository/post_repo.go`, `server/internal/repository/poll_repo.go`
- Impact: Frontend integration is fragile — callers must know which endpoints use cursors vs. page/offset. The `parsePagination()` helper in the handler layer only handles offset style.
- Fix approach: Standardise on cursor-based pagination across all list endpoints, or document the distinction clearly.

**`saveInterests` and `withdrawAccount` API Endpoints Missing on Server:**
- Issue: The Flutter client calls `POST /api/v1/auth/interests` and `POST /api/v1/auth/withdraw`, but neither route exists in `server/internal/handler/routes.go`. The interests call is silently swallowed (`catch (_) {}`) but withdraw fails visibly.
- Files: `app/lib/features/auth/data/auth_repository.dart` (lines 89–107), `server/internal/handler/routes.go`
- Impact: User interest preferences are never saved; the UI withdrawal flow calls `POST /auth/withdraw` but the server only exposes `DELETE /auth/account`. This causes a 404 in production, so withdrawal appears to succeed (tokens are cleared locally) but the server never marks the user as withdrawing.
- Fix approach: Either add the missing routes server-side, or change the Flutter client to call the correct `DELETE /auth/account` endpoint.

**`updateNickname` Extracts `user` from Response Incorrectly:**
- Issue: `AuthRepository.updateNickname()` parses `data['user']` from the response, but the actual server response body is `{"data": {"nickname": "..."}}` with no nested `user` field.
- Files: `app/lib/features/auth/data/auth_repository.dart` (line 80), `server/internal/handler/auth_handler.go` (line 221)
- Impact: `updateNickname()` will throw a null-cast exception at runtime on the happy path, breaking the onboarding flow.
- Fix approach: Change the server response to return the full user object, or update the client parsing to use only `nickname`.

---

## Known Bugs

**`_parseError()` Always Returns a Generic Message:**
- Symptoms: All network and business logic errors surface to the user as "오류가 발생했습니다. 다시 시도해주세요." regardless of the actual error code.
- Files: `app/lib/features/auth/presentation/auth_provider.dart` (lines 246–249)
- Trigger: Any failed auth operation.
- Workaround: None; developers must use the raw `print()` statements on lines 162–164 to see the real error.

**`catch (_) {}` Silences Critical Errors App-wide:**
- Symptoms: Failures in image upload, notification fetch, review submit, poll vote, and WebSocket subscription are swallowed entirely, leaving the UI in a stale or silent-failure state.
- Files: Widespread across providers — `app/lib/features/notification/presentation/notification_provider.dart`, `app/lib/features/chat/presentation/chat_provider.dart` (5 locations), `app/lib/features/chat/presentation/chat_room_screen.dart` (5 locations), `app/lib/shared/widgets/image_upload_widget.dart`, and 20+ other files.
- Trigger: Any network error or unexpected null.
- Workaround: None visible to the user.

**Widget Test Makes a False Assertion:**
- Symptoms: The only widget test (`app/test/widget_test.dart`) asserts `find.text('LetMeIn')` but the app title rendered in `HomeScreen` is `'Black Label'` (set via `MaterialApp.router(title: 'Black Label', ...)`). The test will fail.
- Files: `app/test/widget_test.dart`, `app/lib/main.dart` (line 19)
- Trigger: Running `flutter test`.

---

## Security Considerations

**Wildcard CORS Origin:**
- Risk: `cors.go` sets `Access-Control-Allow-Origin: *`, allowing any origin to make credentialed requests against the API.
- Files: `server/internal/middleware/cors.go` (line 11)
- Current mitigation: None.
- Recommendations: Restrict to the known app domain / localhost in dev. Use `gin-contrib/cors` with an explicit allowlist.

**JWT Secret Has a Weak Default Value:**
- Risk: `config.go` defaults `JWTSecret` to `"dev-secret-change-in-production"` if `JWT_SECRET` is not set. If the env var is accidentally unset in production, all tokens are signed with a publicly known key.
- Files: `server/internal/config/config.go` (line 23)
- Current mitigation: None; no startup check validates key strength.
- Recommendations: Validate at startup: if `JWT_SECRET == "" || JWT_SECRET == "dev-secret-change-in-production"` in non-dev mode, `log.Fatal`.

**Centrifugo Secrets Have Weak Defaults:**
- Risk: `CentrifugoAPIKey` defaults to `"dev-api-key"` and `CentrifugoTokenSecret` to `"dev-centrifugo-secret"`. These are publicly known from the source.
- Files: `server/internal/config/config.go` (lines 26–27)
- Current mitigation: None.
- Recommendations: Same as JWT Secret — enforce non-default values in production mode.

**Tokens Stored In-Memory on Web Platform:**
- Risk: `TokenStorage` falls back to a plain Dart `Map<String, String>` (`_webStorage`) on the web. Tokens survive only for the session but are accessible to any script on the page (XSS vulnerability), and are lost on refresh requiring re-login.
- Files: `app/lib/core/storage/token_storage.dart` (lines 14–20)
- Current mitigation: A code comment acknowledges this as a dev compromise.
- Recommendations: Use `localStorage` with HTTPS-only restrictions, or implement proper `flutter_secure_storage` WebCrypto on HTTPS.

**File Upload Has No MIME-Type Double-Check:**
- Risk: `isAllowedContentType()` trusts the `Content-Type` header provided by the client. An attacker can upload a malicious file (e.g., SVG with embedded JS, or an executable) by setting the header to `image/jpeg`.
- Files: `server/internal/service/media_service.go` (lines 236–242)
- Current mitigation: Server re-decodes the image via `decodeImage()`, which would fail on non-image binaries.
- Recommendations: Use `net/http.DetectContentType` on the raw bytes as a secondary check, and explicitly reject SVG uploads.

**No Rate Limiting on Any Endpoint:**
- Risk: Auth endpoints (`/auth/kakao`, `/auth/refresh`, `/auth/dev-login`), community submission, and chat messaging have no rate limiting. Brute-force and spam are trivially achievable.
- Files: `server/internal/handler/routes.go`, `server/internal/middleware/`
- Current mitigation: None.
- Recommendations: Add `golang.org/x/time/rate` or `github.com/ulule/limiter` middleware, especially on `/auth/*` and `/posts`.

---

## Performance Bottlenecks

**Home Screen Fires 4 Parallel Provider Loads on Every Refresh:**
- Problem: `RefreshIndicator` on `HomeScreen` invalidates `categoryProvider`, `postListProvider`, `castMemberListProvider`, and `recommendedHospitalsProvider` simultaneously, causing 4 independent API calls with no debounce or coalescing.
- Files: `app/lib/features/home/presentation/home_screen.dart` (lines 64–69)
- Cause: No shared refresh notifier; each provider fetches independently.
- Improvement path: Introduce a single `homeRefreshProvider` that coordinates all 4 fetches, or use `ref.invalidateSelf()` on a combined future provider.

**`HospitalRequired` Middleware Makes a DB Query on Every Protected Request:**
- Problem: Every hospital-role endpoint calls `hospitalRepo.GetByUserID(uid)` to look up and verify the hospital record, even when the JWT already carries the `hospital` role claim.
- Files: `server/internal/middleware/hospital.go` (lines 49–65)
- Cause: No caching; straight DB hit per request.
- Improvement path: Cache the hospital lookup in Redis keyed by `userID` with a short TTL (e.g., 5 minutes), or embed `hospitalID` in the JWT claims when the role is `hospital`.

**Image Resize Goroutine Reads Entire File Into Memory:**
- Problem: `Upload()` reads the full file into a `bytes.Buffer` synchronously before spawning the resize goroutine. A 10 MB upload blocks the goroutine pool and heap for the duration of the upload plus async resize.
- Files: `server/internal/service/media_service.go` (lines 78–113)
- Cause: No streaming; `buf.ReadFrom(file)` reads everything.
- Improvement path: Stream directly to disk for the original, then read back only for resizing.

**`chat_room_screen.dart` is 1280 Lines:**
- Problem: A single file handles WebSocket subscription, message rendering, image upload, visit card management, and room close logic. It rebuilds on every `setState` call in `_onInputChanged`.
- Files: `app/lib/features/chat/presentation/chat_room_screen.dart`
- Cause: Feature creep in a single screen widget.
- Improvement path: Extract `_VisitCardSection`, `_MessageList`, and `_InputBar` into separate widget files.

---

## Fragile Areas

**`auth_provider.dart` Uses Legacy `StateNotifier` (Deprecated API):**
- Files: `app/lib/features/auth/presentation/auth_provider.dart` (line 1: `import 'package:flutter_riverpod/legacy.dart'`)
- Why fragile: `StateNotifier` and `StateNotifierProvider` are deprecated in Riverpod 2.x. Future Riverpod upgrades will require a migration to `Notifier` / `NotifierProvider`.
- Safe modification: Do not add new state to `AuthNotifier` using the legacy API. Plan migration to `AsyncNotifier` once the Kakao SDK is integrated.
- Test coverage: No tests for `AuthNotifier`.

**Content Filter Uses Fragile Regex Matching Korean Medical Terms:**
- Files: `server/pkg/filter/content_filter.go`
- Why fragile: Patterns like `\S+성형외과` block any non-whitespace prefix. Legitimate content such as "강남에서 성형외과 예약" would be blocked because "강남에서성형외과" matches `\S+성형외과` if there is no space. Korean spacing is inconsistent in mobile input.
- Safe modification: Test all regex changes against a corpus of real posts before deploying. Consider allowing the filter to be tuned via a database table instead of hardcoded values.
- Test coverage: No tests in `server/`.

**GoRouter Path Conflict: `/community/polls/create` vs `/community/:id`:**
- Files: `app/lib/core/router/app_router.dart` (lines 253–268)
- Why fragile: GoRouter matches routes in declaration order. `polls/create` (declared after `:id`) could match as `postId = "polls"` + sub-path in some router versions, producing a parse error in `int.parse("polls")`.
- Safe modification: Move `polls/create` above the `:id` route, which is already the case in this file — verify it remains so on any future route additions.
- Test coverage: No routing tests.

**`int.parse(state.pathParameters['id']!)` Unguarded Throughout Router:**
- Files: `app/lib/core/router/app_router.dart` (lines 151, 177, 221, 249, 262, 291)
- Why fragile: Uses the `!` null assertion and throws `FormatException` on any non-integer path parameter. A deep-link or programmatic navigation with a non-numeric ID would crash the app.
- Safe modification: Replace with `int.tryParse(...) ?? 0` and handle the zero case, or use a route validator.

**Scheduler Goroutines Launched Inside a Request Group Block:**
- Files: `server/internal/handler/routes.go` (lines 323–327)
- Why fragile: `scheduler.StartAll()` is called inside the `v1 := r.Group(...)` closure, meaning schedulers start during route registration, not at server boot. If `RegisterRoutes` is ever called more than once (e.g., in tests), schedulers will be started multiple times.
- Safe modification: Move `scheduler.StartAll()` to `main.go` after `handler.RegisterRoutes()` returns.

---

## Test Coverage Gaps

**Server: Zero Test Files:**
- What's not tested: All business logic in `server/internal/service/`, all SQL queries in `server/internal/repository/`, all HTTP handler responses in `server/internal/handler/`.
- Files: Entire `server/` directory — no `*_test.go` files found.
- Risk: Any change to service logic, SQL queries, or route wiring is undetected by CI. Regressions in auth, consultation state machine, and withdrawal flow are invisible.
- Priority: High

**Flutter App: One Placeholder Widget Test:**
- What's not tested: `AuthNotifier` state transitions, `ApiClient` interceptor retry logic, `TokenStorage` read/write, all feature providers, all screen widgets.
- Files: `app/test/widget_test.dart` (the single test file, which itself has a broken assertion)
- Risk: UI regressions in any screen go undetected.
- Priority: High

**Content Filter Regex: No Unit Tests:**
- What's not tested: `ContainsBlockedContent()` and `BlindSensitiveContent()` with Korean text edge cases.
- Files: `server/pkg/filter/content_filter.go`, `server/pkg/filter/keyword_filter.go`
- Risk: A regex change could silently start blocking legitimate posts or failing to block prohibited content.
- Priority: Medium

---

## Missing Critical Features

**No Push Notification Delivery:**
- Problem: `NotificationRepository` and `NotificationService` exist, but there is no FCM/APNs integration for sending push notifications to devices. Notifications are only fetchable via polling.
- Blocks: Real-time alerts for new consultation responses, chat messages, and cast member updates.

**No Environment Configuration for Flutter App:**
- Problem: `api_client.dart`, `cached_image.dart`, and `centrifugo_client.dart` have base URLs hardcoded to `localhost`. There is no `--dart-define` or flavor configuration to switch between dev, staging, and production.
- Files: `app/lib/core/network/api_client.dart` (line 5), `app/lib/shared/widgets/cached_image.dart` (line 19), `app/lib/features/chat/data/centrifugo_client.dart` (line 27)
- Blocks: Any non-local deployment; the production build will always point at `localhost:8080`.

**No API Documentation:**
- Problem: The `server/api/` directory exists but is empty. There is no OpenAPI spec, Swagger definition, or any other machine-readable contract.
- Blocks: Frontend/backend contract verification, third-party integration, and automated contract testing.

---

*Concerns audit: 2026-03-30*
