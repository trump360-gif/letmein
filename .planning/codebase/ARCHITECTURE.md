# Architecture

**Analysis Date:** 2026-03-30

## Pattern Overview

**Overall:** Multi-tier monorepo with three distinct sub-systems: a Flutter mobile/web client, a Go REST API server, and a Next.js CMS admin panel. The Flutter client follows Feature-Sliced Design (FSD) with Riverpod state management. The Go server follows a classic Layered Architecture (Handler → Service → Repository). The CMS follows Next.js App Router conventions with a Feature-View separation.

**Key Characteristics:**
- Flutter app: Feature-first directory layout with `data/` (models + repository) and `presentation/` (screens + providers) sub-layers per feature
- Go server: Strict dependency injection in `routes.go` — every handler receives its service, every service receives its repository; no global singletons
- Real-time chat: Centrifugo WebSocket server sits outside the Go API; Flutter connects via `centrifuge` Dart package using a JWT fetched from the Go API
- Auth flow: JWT access/refresh token pair; tokens stored in `flutter_secure_storage` (mobile) or in-memory (web dev); `AuthInterceptor` in `ApiClient` auto-refreshes on 401

---

## Layers

### Flutter App

**Presentation Layer:**
- Purpose: UI widgets and screens; reads/writes Riverpod providers
- Location: `app/lib/features/{feature}/presentation/`
- Contains: `*_screen.dart` (full screens), `*_card.dart` / `*_section.dart` (widgets), `*_provider.dart` (Riverpod state)
- Depends on: Data layer (via provider), `core/theme/`, `shared/widgets/`
- Used by: Router

**Data Layer:**
- Purpose: API calls and local data access; no UI logic
- Location: `app/lib/features/{feature}/data/`
- Contains: `*_repository.dart` (Dio HTTP calls), `*_models.dart` (freezed/JSON serializable data classes), `*.g.dart` / `*.freezed.dart` (generated code)
- Depends on: `core/network/api_client.dart`, `core/storage/token_storage.dart`
- Used by: Presentation providers

**Core Layer:**
- Purpose: App-wide infrastructure
- Location: `app/lib/core/`
- Contains: `network/api_client.dart` (Dio + AuthInterceptor), `router/app_router.dart` (GoRouter + nav shell), `storage/token_storage.dart` (secure storage), `theme/app_theme.dart` (AppTheme, AppColors, AppSpacing)
- Depends on: Nothing inside the app
- Used by: Everything

**Shared Layer:**
- Purpose: Cross-feature reusable code
- Location: `app/lib/shared/`
- Contains: `models/image_model.dart`, `widgets/cached_image.dart`, `widgets/image_upload_widget.dart`, `widgets/youtube_hero.dart`, `utils/image_utils.dart`, `utils/keyword_filter.dart`
- Depends on: Core layer
- Used by: Any feature

---

### Go API Server

**Handler Layer:**
- Purpose: HTTP request parsing, response serialization, route grouping
- Location: `server/internal/handler/`
- Contains: `*_handler.go` per domain, `routes.go` (wires all deps together), `premium_routes.go`, `ad_routes.go`
- Depends on: Service layer, middleware
- Used by: `cmd/api/main.go` via `handler.RegisterRoutes`

**Service Layer:**
- Purpose: Business logic; orchestrates multiple repositories
- Location: `server/internal/service/`
- Contains: One service file per domain (auth, consultation, chat, hospital, cast_member, media, notification, poll, post, coordinator, review, premium, ad, category)
- Depends on: Repository layer, `pkg/auth/`
- Used by: Handler layer

**Repository Layer:**
- Purpose: Raw SQL queries against PostgreSQL
- Location: `server/internal/repository/`
- Contains: One repo file per domain entity
- Depends on: `database/sql` (stdlib), `internal/model/`
- Used by: Service layer

**Model Layer:**
- Purpose: Go structs representing DB rows/domain entities
- Location: `server/internal/model/`
- Contains: Plain Go structs; one file per domain entity
- Depends on: Nothing
- Used by: Repository and service layers

**Middleware Layer:**
- Location: `server/internal/middleware/`
- Contains: `auth.go` (JWT Bearer validation, sets `userID`/`role` in context), `admin.go`, `hospital.go`, `cors.go`

**Scheduler:**
- Location: `server/internal/scheduler/scheduler.go`
- Purpose: Background jobs (auto-close stale consultations, chat cleanup etc.)
- Started non-blocking from `routes.go` via `scheduler.StartAll`

**pkg (shared utilities):**
- Location: `server/pkg/auth/`
- Contains: `jwt.go` (JWTManager), `kakao.go` (Kakao OAuth), `apple.go` (Apple Sign-In), `centrifugo.go` (Centrifugo JWT generator)
- Location: `server/pkg/filter/`
- Contains: `keyword_filter.go`, `content_filter.go` (profanity/spam filtering)

---

### CMS Admin (Next.js Monorepo)

**Feature Layer:**
- Location: `cms/apps/admin/src/features/{name}/`
- Contains: `api.ts` (raw fetch calls to the admin API), `queries.ts` (React Query hooks), `index.ts` (re-exports)

**View Layer:**
- Location: `cms/apps/admin/src/views/{name}/`
- Contains: `use client` React components; compose feature hooks + UI components

**Page Layer:**
- Location: `cms/apps/admin/src/app/(dashboard)/{name}/page.tsx`
- Contains: Server components that import a single View component

**API Route Layer:**
- Location: `cms/apps/admin/src/app/api/v1/admin/` and `cms/apps/admin/src/app/api/`
- Contains: Next.js route handlers; use Prisma directly (not the Go API)

**Shared Packages:**
- `cms/packages/db/` — Prisma schema for PostgreSQL 16
- `cms/packages/types/` — Shared TypeScript types (`letmein.ts`)
- `cms/packages/ui/` — Shared UI component library
- `cms/packages/utils/` — `cn`, date helpers
- `cms/packages/config/` — ESLint, Tailwind, TypeScript configs

---

## Data Flow

**User Action → UI Update (Flutter):**

1. User taps a button in a `*_screen.dart`
2. Screen calls a method on its Riverpod provider (StateNotifier or Notifier)
3. Provider delegates to the feature's `*_repository.dart`
4. Repository sends HTTP request via `ApiClient.dio`
5. `AuthInterceptor` attaches `Authorization: Bearer <token>` header
6. Server responds; repository parses JSON into a typed model
7. Provider updates `state`; widget rebuilds via `ref.watch`

**401 Auto-Refresh Flow:**

1. `ApiClient.AuthInterceptor.onError` catches 401
2. Posts to `/auth/refresh` with stored refresh token
3. Saves new access token; retries original request
4. On refresh failure: clears tokens, passes error downstream (triggers redirect to login via `GoRouter.redirect`)

**Real-Time Chat Flow:**

1. Flutter calls `GET /api/v1/chat/token` → gets a Centrifugo JWT
2. `CentrifugoService.connect(token)` opens WebSocket to `ws://localhost:8000/connection/websocket`
3. Subscribes to channel `chat:room_{id}`
4. Incoming publications decoded from JSON; `onMessage` callback updates local chat state
5. Sending a message: Flutter calls REST `POST /api/v1/chat/rooms/:id/messages`; server publishes to Centrifugo channel via Centrifugo HTTP API

**Go Request Lifecycle:**

1. `main.go`: Load config → init DB + Redis → create Gin engine → register middleware → `handler.RegisterRoutes`
2. Request hits Gin router
3. Middleware chain: CORS → optional `AuthRequired` / `HospitalRequired` / `AdminRequired`
4. Handler extracts params/body → calls Service method
5. Service applies business logic → calls Repository
6. Repository executes SQL → returns model
7. Handler serializes `gin.H{"data": ...}` JSON response

**Auth State (Flutter):**

```
AuthStatus.unknown
    ↓ (app start: _initializeAuth)
    ├── no tokens → AuthStatus.unauthenticated
    ├── refresh ok → AuthStatus.authenticated
    └── refresh fail → AuthStatus.unauthenticated

After login:
    ├── isNewUser == true → AuthStatus.newUser → agreement → nickname → interests → authenticated
    └── isNewUser == false → AuthStatus.authenticated
```

**State Management (Flutter):**
- Riverpod `StateNotifierProvider` for mutable list/form state (e.g., `myConsultationRequestsProvider`, `createConsultationProvider`)
- Riverpod `FutureProvider` / `FutureProvider.family` for read-only async data (e.g., `hospitalDetailProvider`, `consultationDetailProvider`)
- Riverpod `Provider` for services and repositories (dependency injection)
- `StateNotifierProvider.autoDispose` for form screens that should reset on exit

---

## Key Abstractions

**Feature Repository (Flutter):**
- Purpose: Encapsulates all HTTP calls for one domain; returns typed models; uses `ApiClient.dio`
- Examples: `app/lib/features/consultation/data/consultation_repository.dart`, `app/lib/features/auth/data/auth_repository.dart`
- Pattern: Injected via `Provider<XRepository>((ref) { final api = ref.watch(apiClientProvider); return XRepository(api.dio); })`

**StateNotifier + copyWith state (Flutter):**
- Purpose: Immutable state with manual copy; no freezed dependency on provider state
- Examples: `app/lib/features/consultation/presentation/consultation_provider.dart` (`MyRequestsState`, `CreateRequestState`)
- Pattern: State class with `copyWith`; notifier class extending `StateNotifier<State>`; sentinel `Object` for nullable fields

**Freezed Models (Flutter):**
- Purpose: JSON-serializable, immutable data transfer objects
- Examples: `app/lib/features/auth/data/auth_models.dart` (`UserModel`, `AuthResponse`)
- Pattern: `@freezed abstract class X with _$X { ... }` + generated `.freezed.dart` + `.g.dart`

**Go Service (server):**
- Purpose: Owns business logic for a domain; hides DB details from handlers
- Examples: `server/internal/service/consultation_service.go`, `server/internal/service/chat_service.go`
- Pattern: Struct with method receivers; constructed via `NewXService(repo, ...)` in `routes.go`

**PaginatedResult (Flutter + server):**
- Pattern: Server returns `{ data: [...], meta: { total, page, limit } }`; Flutter parses into `PaginatedResult<T>` with `items`, `total`, `page`, `limit`, `hasMore`

---

## Entry Points

**Flutter App:**
- Location: `app/lib/main.dart`
- Triggers: Flutter engine startup
- Responsibilities: Wraps app in `ProviderScope`; creates `MaterialApp.router` with `AppTheme.dark` and `routerProvider`; constrains width to 430px for web compatibility

**Go API Server:**
- Location: `server/cmd/api/main.go`
- Triggers: Process start
- Responsibilities: `config.Load()` → `config.NewDB()` → `config.NewRedis()` → Gin engine → CORS middleware → `handler.RegisterRoutes()`

**GoRouter (Flutter):**
- Location: `app/lib/core/router/app_router.dart`
- Triggers: App navigation
- Responsibilities: Auth-aware redirect logic (unknown/unauthenticated/newUser/authenticated states); `StatefulShellRoute.indexedStack` for 5-tab bottom nav; full-screen routes for chat, review write, cast members (outside tab shell)

---

## Error Handling

**Strategy (Flutter):** Optimistic state updates with explicit error messages stored in state; UI shows `errorMessage` from state; global 401 handled in `AuthInterceptor`

**Patterns:**
- Repositories let `DioException` propagate; providers catch and set `errorMessage` in state
- `try/catch` in every notifier method; on error: `state = state.copyWith(isLoading: false, errorMessage: '...')`
- Non-critical operations (e.g., `saveInterests`) swallow errors silently
- `AuthInterceptor`: on refresh failure, clears tokens and passes original error; GoRouter redirect then sends user to login

**Strategy (Go server):** Each handler returns JSON error with appropriate HTTP status code; services return typed errors or plain Go errors; no global error middleware beyond Gin's default recovery

---

## Cross-Cutting Concerns

**Logging (Flutter):** `print()` used in auth flow (marked with `// ignore: avoid_print`); no structured logging library
**Logging (Go):** Standard `log` package; Gin default request logger
**Validation (Flutter):** Form state `isValid` getter computed from state fields; no external validation library
**Validation (Go):** `go-playground/validator/v10` via Gin binding
**Authentication (Flutter):** `AuthInterceptor` on `ApiClient.dio`; `GoRouter.redirect` enforces route guards based on `authStateProvider`
**Authentication (Go):** `middleware.AuthRequired(jwtManager)` injects `userID` and `role` into Gin context; `middleware.HospitalRequired` additionally checks hospital role; `middleware.AdminRequired` for admin routes
**Image Upload (Flutter):** `ImageUploadWidget` (shared widget) + `MediaRepository` + `UploadImageNotifier`; uploads to `POST /api/v1/media/upload`; server stores files in `uploads/` directory and serves via `r.Static("/uploads", cfg.UploadDir)`
**Profanity Filtering (Go):** `server/pkg/filter/keyword_filter.go` used by post/community services

---

*Architecture analysis: 2026-03-30*
