# Technology Stack

**Analysis Date:** 2026-03-30

## Languages

**Primary:**
- Dart 3.x - Flutter mobile/web app (`app/`)
- Go 1.26.1 - REST API backend (`server/`)
- TypeScript 5.x - CMS monorepo (`cms/`)

**Secondary:**
- SQL - Database migrations (`server/migrations/`)

## Runtime

**Environment:**
- Flutter SDK ^3.10.8 (Dart) — mobile app
- Node.js >=18.0.0 — CMS apps
- Go 1.26.1 — API server

**Package Managers:**
- pub (Flutter) — lockfile: `app/pubspec.lock`
- npm 10.0.0 — lockfile: `cms/package-lock.json`
- Go modules — lockfile: `server/go.sum`

## Frameworks

**Mobile App (`app/`):**
- Flutter ^3.10.8 — cross-platform mobile/web UI
- flutter_riverpod ^3.3.1 — state management
- go_router ^17.1.0 — declarative routing
- dio ^5.9.2 — HTTP client with interceptors
- centrifuge ^0.18.0 — WebSocket real-time client
- freezed ^3.0.0 — immutable data class code generation
- json_serializable ^6.11.0 — JSON serialization code generation

**API Server (`server/`):**
- Gin v1.12.0 — HTTP web framework
- golang-jwt/jwt v5.3.1 — JWT signing/validation
- lib/pq v1.12.0 — PostgreSQL driver (raw `database/sql`)
- redis/go-redis v9.18.0 — Redis client
- go-playground/validator v10.30.1 — request validation

**CMS Admin (`cms/apps/admin/`):**
- Next.js ^14.0.0 (App Router) — admin dashboard framework
- React ^18.0.0
- TanStack Query ^5.0.0 — server state / data fetching
- Zustand ^4.0.0 — global client state
- React Hook Form ^7.0.0 — form management
- Zod ^3.0.0 — schema validation
- TipTap (latest) — rich text editor
- Recharts ^2.0.0 — data visualization charts
- @dnd-kit/core (latest) — drag-and-drop ordering

**CMS Web (`cms/apps/web/`):**
- Next.js ^14.0.0 (App Router) — public-facing web
- React ^18.0.0
- @google/generative-ai ^0.24.1 — Gemini AI integration (web only)
- centrifuge ^5.5.3 — WebSocket real-time (monorepo root dep)

**Monorepo Tooling:**
- Turborepo ^2.0.0 — build orchestration and caching
- Storybook ^8.6.17 — UI component development (`packages/ui`)

## Key Dependencies

**Critical:**
- `@letmein/db` (Prisma 5.22.0 + `@prisma/client` 5.22.0) — shared ORM, schema at `cms/packages/db/prisma/schema.prisma`
- `@letmein/ui` — shared component library built on Radix UI primitives
- `@letmein/types` — shared TypeScript types shared across admin and web
- `@letmein/utils` — shared utility functions

**Security:**
- `flutter_secure_storage ^10.0.0` — iOS Keychain / Android Keystore for JWT tokens
- `bcryptjs ^2.0.0` — password hashing (CMS admin auth)
- `jose ^5.0.0` — JWT signing/verification (CMS)
- `dompurify ^3.0.0` — HTML sanitization (CMS admin TipTap editor)

**UI:**
- `lucide_icons ^0.257.0` — icon set (Flutter app)
- `lucide-react` (latest) — icon set (CMS)
- `@radix-ui/react-*` (various) — headless UI primitives (CMS)
- `cached_network_image ^3.4.1` — image caching (Flutter)
- `image_picker ^1.2.1` — camera/gallery (Flutter)

**Infrastructure:**
- `sharp ^0.33.0` — server-side image processing (CMS API routes)
- `date-fns ^3.0.0` — date formatting (CMS)
- `nanoid ^5.0.0` — unique ID generation (CMS)
- `ky ^1.0.0` — HTTP client (CMS)
- `next-auth ^5.0.0-beta.0` — CMS authentication (NextAuth v5 beta)

## Configuration

**Environment (Server — `server/internal/config/config.go`):**
- `PORT` — HTTP port (default `8080`)
- `DATABASE_URL` — PostgreSQL connection string
- `REDIS_ADDR` — Redis address (default `localhost:6379`)
- `JWT_SECRET` — HMAC secret for app JWT tokens
- `KAKAO_REST_API_KEY` — Kakao social login
- `APPLE_BUNDLE_ID` — iOS app bundle ID for Apple Sign-In verification
- `UPLOAD_DIR` — local file upload directory (default `./uploads`)
- `CENTRIFUGO_API_URL` — Centrifugo HTTP API endpoint
- `CENTRIFUGO_API_KEY` — Centrifugo API authentication key
- `CENTRIFUGO_TOKEN_SECRET` — HMAC secret for Centrifugo JWT generation

**Environment (CMS — `cms/.env.example`):**
- `DATABASE_URL` — PostgreSQL connection string
- `NEXTAUTH_URL` — NextAuth base URL
- `NEXTAUTH_SECRET` — NextAuth signing secret
- `CENTRIFUGO_API_URL` — Centrifugo HTTP API
- `CENTRIFUGO_API_KEY` — Centrifugo API key
- `NEXT_PUBLIC_CENTRIFUGO_WS_URL` — WebSocket URL (public)
- `NEXT_PUBLIC_URL` — public site base URL

**Build:**
- Flutter app: `app/pubspec.yaml`
- CMS monorepo: `cms/turbo.json` (tasks: build, dev, lint, type-check, db:\*)
- CMS TypeScript: per-package `tsconfig.json` with `cms/packages/config/typescript/` base configs
- CMS Tailwind: per-package `tailwind.config.ts` with `cms/packages/config/tailwind/` base

## Platform Requirements

**Development:**
- Flutter SDK ^3.10.8
- Node.js >=18.0.0
- Go 1.26.1
- Docker + Docker Compose (PostgreSQL 17, Redis 7, Centrifugo v6)
- Xcode (iOS), Android Studio (Android)

**Production:**
- Docker Compose (`docker-compose.yml`) defines: PostgreSQL 17-alpine, Redis 7-alpine, Centrifugo v6
- CMS admin app serves on port 3001; CMS web on port 3000
- Go API server on port 8080
- Centrifugo WebSocket on port 8000
- iOS target: `com.letmein.letmeinApp`

---

*Stack analysis: 2026-03-30*
