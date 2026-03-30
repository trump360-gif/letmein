# External Integrations

**Analysis Date:** 2026-03-30

## APIs & External Services

**Social Authentication:**
- Kakao Login — primary mobile social auth
  - SDK/Client: Direct HTTP call to `https://kapi.kakao.com/v2/user/me`
  - Implementation: `server/pkg/auth/kakao.go`
  - Auth: `KAKAO_REST_API_KEY` env var; token passed from Flutter app as `kakaoAccessToken`
  - Note: Flutter app currently uses `devLogin` bypass (TODO: integrate `flutter_kakao_sdk`)

- Apple Sign-In — iOS social auth
  - SDK/Client: Direct HTTP call to `https://appleid.apple.com/auth/keys` (JWKS)
  - Implementation: `server/pkg/auth/apple.go`
  - Auth: `APPLE_BUNDLE_ID` env var; RSA public key verified against Apple JWKS (24h cache)
  - Endpoint: `POST /api/v1/auth/apple`

- Google Login (CMS / planned) — configured in admin API key settings
  - SDK/Client: Configured via `cms/apps/admin/src/shared/lib/api-service-defs.ts`
  - Status: Configuration UI present, activation TBD

- Naver, LINE, Facebook, GitHub, LinkedIn Login (CMS / planned)
  - Status: Configuration schema defined in `api-service-defs.ts`; not yet active

**AI / Generative:**
- Google Gemini AI — web app only
  - SDK/Client: `@google/generative-ai ^0.24.1`
  - Location: `cms/apps/web/` dependency
  - Purpose: Content generation features

**YouTube:**
- YouTube video embedding — display episode thumbnails in Flutter app hero carousel
  - Implementation: `app/lib/shared/widgets/youtube_hero.dart`
  - Mechanism: `url_launcher ^6.3.2` opens YouTube URLs in external browser; thumbnails served from API
  - No YouTube Data API key required for display-only usage

## Data Storage

**Databases:**
- PostgreSQL 17 (Docker: `postgres:17-alpine`) — primary relational database
  - Connection env var: `DATABASE_URL`
  - Go client: raw `database/sql` with `lib/pq` driver (`server/internal/config/db.go`)
  - Go connection pool: max 25 open, max 5 idle
  - CMS client: Prisma 5.22.0 (`cms/packages/db/`)
  - Schema: `cms/packages/db/prisma/schema.prisma`
  - Go migrations: raw SQL files in `server/migrations/` (001–005)
  - Prisma migrations: `cms/packages/db/prisma/migrations/`

- Key domain models: User, Hospital, HospitalSpecialty, HospitalDoctor, ProcedureCategory, ProcedureDetail, ConsultationRequest, CoordinatorMatch, ChatRoom, ChatMessage (messages), CastMember, YouTubeEpisode, EpisodeCastMember, CastStory, CastFollow, HospitalSubscription, AdCredit, AdCreative, AdCampaign, Post, Comment, Report, Poll, Notification, device_tokens

**File Storage:**
- Local filesystem — Go server uploads directory
  - Path: `UPLOAD_DIR` env var (default `./uploads`)
  - Served via: `r.Static("/uploads", cfg.UploadDir)` in Gin
  - Image processing: `golang.org/x/image` (Go server), `sharp ^0.33.0` (CMS API routes)
  - Future migration target: Cloudflare R2 (noted in `cms/tech-stack.md`)

**Caching:**
- Redis 7 (Docker: `redis:7-alpine`)
  - Connection env var: `REDIS_ADDR`
  - Go client: `redis/go-redis v9.18.0` (`server/internal/config/db.go`)
  - Uses: refresh token storage, session management, rate limiting

## Authentication & Identity

**Mobile App (Flutter → Go API):**
- Strategy: JWT Bearer tokens (access + refresh)
- Implementation: custom JWT via `golang-jwt/jwt v5`; signed with `JWT_SECRET`
- Token storage: `flutter_secure_storage ^10.0.0` — iOS Keychain / Android Keystore
- Location: `app/lib/core/storage/token_storage.dart`
- Auto-refresh: `app/lib/core/network/api_client.dart` — `AuthInterceptor` retries on 401

**CMS Admin Auth:**
- Provider: NextAuth.js v5 (`next-auth ^5.0.0-beta.0`)
- JWT signing: `jose ^5.0.0`
- Password hashing: `bcryptjs ^2.0.0`
- Configuration: `NEXTAUTH_URL`, `NEXTAUTH_SECRET`

**Server-Side JWT Middleware:**
- `server/internal/middleware/auth.go` — `AuthRequired()` verifies Bearer token
- `server/internal/middleware/hospital.go` — `HospitalRequired()` role check
- `server/internal/middleware/admin.go` — `AdminRequired()` role check

**Identity Verification (planned / CMS configurable):**
- KCB (Korea Credit Bureau) — `payment.identity_kcb` service definition
- NICE — `payment.identity_nice` service definition

## Real-time / WebSocket

**Centrifugo v6:**
- Docker: `centrifugo/centrifugo:v6` on port 8000
- Config: `infra/centrifugo.json`
  - `chat` namespace: history_size=100, history_ttl=720h, push join/leave events, subscribers can publish
- Go server generates Centrifugo JWTs: `server/pkg/auth/centrifugo.go`
  - Connection token: HMAC HS256, sub=userID, signed with `CENTRIFUGO_TOKEN_SECRET`
  - Subscription token: scoped to specific channel (e.g. `chat:room_42`)
- Flutter client: `centrifuge ^0.18.0` package, `app/lib/features/chat/data/centrifugo_client.dart`
  - WebSocket URL: `ws://localhost:8000/connection/websocket` (dev)
- CMS integration: `centrifuge ^5.5.3` (monorepo root dep)
- Env vars: `CENTRIFUGO_API_URL`, `CENTRIFUGO_API_KEY`, `CENTRIFUGO_TOKEN_SECRET`, `NEXT_PUBLIC_CENTRIFUGO_WS_URL`

## Notifications

**In-app Notifications:**
- Stored in PostgreSQL `notification_queue` / notifications tables
- Delivery via API polling: `GET /api/v1/notifications`
- Service: `server/internal/service/notification_service.go`

**Push Notifications (planned):**
- FCM (Firebase Cloud Messaging) / APNs — placeholder only
- Implementation: `sendPush()` in `server/internal/service/notification_service.go` is a log stub
- Device tokens stored in `device_tokens` table (schema present)
- Status: Not yet implemented — noted as "future enhancement"

**Notification Channels (CMS configurable):**
- Kakao AlimTalk — `notification.kakao_alimtalk` (configured via admin API key settings)
- SMS via Solapi — `notification.solapi_sms`
- Email SMTP — `notification.smtp`
- Email SendGrid — `notification.sendgrid`

## Payment (planned / CMS configurable)

All payment integrations are defined in `cms/apps/admin/src/shared/lib/api-service-defs.ts` but not yet active:

- Toss Payments (`payment.toss`) — client key + secret key
- PortOne / iamport (`payment.portone`) — imp_uid + API key/secret
- KakaoPay (`payment.kakaopay`) — CID + admin key

## Monitoring & Observability

**Error Tracking:**
- Not deployed (Sentry listed as future candidate in `cms/tech-stack.md`)

**Logs:**
- Go server: `log.Printf` (stdlib logging)
- CMS: `console.error` in API routes
- Structured logging (pino) planned but not installed in current `package.json`

## Analytics (planned / CMS configurable)

- Google Analytics 4 — `misc.ga4` — measurement ID + API secret
- Google Search Console — `misc.google_search_console` — verification code
- Naver Webmaster — `misc.naver_webmaster` — verification code
- reCAPTCHA v3 — `misc.recaptcha_v3` — site key + secret
- Slack Webhook — `misc.slack_webhook` — webhook URL + channel

## Background Jobs

**Go Scheduler (`server/internal/scheduler/scheduler.go`):**
Three goroutine-based ticker schedulers started at server boot via `scheduler.StartAll()`:

1. `RunWithdrawalCleanup` — every 1 hour
   - Anonymizes PII for users in `status='withdrawing'` after 7-day grace period
2. `RunMatchingEscalation` — periodic
   - Escalates unmatched consultation requests
3. `RunChatAutoClose` — periodic
   - Closes expired chat rooms

## CI/CD & Deployment

**Hosting:**
- Local/development: Docker Compose (`docker-compose.yml`)
- Production: Not configured in repo (Vercel, self-hosted, or CodeB deployment TBD per `cms/tech-stack.md`)

**CI Pipeline:**
- Not detected in repository (no `.github/workflows/` found)

## Webhooks & Callbacks

**Incoming:**
- Not configured

**Outgoing:**
- Slack Webhook — configurable via admin settings (`misc.slack_webhook`)

## Environment Configuration Summary

**Required (Go API Server):**
- `DATABASE_URL`
- `JWT_SECRET`
- `KAKAO_REST_API_KEY`
- `APPLE_BUNDLE_ID`
- `CENTRIFUGO_API_URL`
- `CENTRIFUGO_API_KEY`
- `CENTRIFUGO_TOKEN_SECRET`

**Required (CMS):**
- `DATABASE_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `CENTRIFUGO_API_URL`
- `CENTRIFUGO_API_KEY`
- `NEXT_PUBLIC_CENTRIFUGO_WS_URL`

**Secrets location:**
- `.env.example` at `cms/.env.example` (template only)
- No `.env` files committed (confirmed absent from root and server dirs)
- Admin API keys stored encrypted in `SiteSetting` table via CMS admin UI

---

*Integration audit: 2026-03-30*
