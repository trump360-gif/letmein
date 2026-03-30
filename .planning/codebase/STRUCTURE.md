# Codebase Structure

**Analysis Date:** 2026-03-30

## Directory Layout

```
letmein/                          # Monorepo root
├── app/                          # Flutter mobile/web app
│   ├── lib/
│   │   ├── main.dart             # App entry point
│   │   ├── core/                 # App-wide infrastructure
│   │   │   ├── network/          # Dio ApiClient + AuthInterceptor
│   │   │   ├── router/           # GoRouter + ScaffoldWithNavBar
│   │   │   ├── storage/          # TokenStorage (secure + web fallback)
│   │   │   ├── theme/            # AppTheme, AppColors, AppSpacing
│   │   │   ├── config/           # (reserved)
│   │   │   └── utils/            # (reserved)
│   │   ├── features/             # Feature-sliced modules
│   │   │   ├── auth/
│   │   │   ├── home/
│   │   │   ├── hospital/
│   │   │   ├── consultation/
│   │   │   ├── chat/
│   │   │   ├── community/
│   │   │   ├── cast_member/
│   │   │   ├── review/
│   │   │   ├── mypage/
│   │   │   ├── notification/
│   │   │   ├── referral/
│   │   │   ├── auction/          # Legacy alias → redirects to /consultation
│   │   │   └── media/            # Image upload (no screen; only data + provider)
│   │   └── shared/               # Cross-feature reusables
│   │       ├── models/           # image_model.dart
│   │       ├── widgets/          # cached_image, image_upload_widget, youtube_hero
│   │       └── utils/            # image_utils, keyword_filter
│   ├── assets/images/            # Local image assets
│   └── pubspec.yaml              # Flutter dependencies
│
├── server/                       # Go REST API
│   ├── cmd/api/main.go           # Server entry point
│   ├── internal/
│   │   ├── config/               # config.go (env), db.go (postgres+redis)
│   │   ├── handler/              # Gin route handlers + routes.go
│   │   ├── middleware/           # auth, admin, hospital, cors
│   │   ├── model/                # Plain Go domain structs
│   │   ├── repository/           # SQL query functions
│   │   ├── service/              # Business logic
│   │   └── scheduler/            # Background jobs
│   ├── pkg/
│   │   ├── auth/                 # JWT, Kakao, Apple, Centrifugo JWT
│   │   └── filter/               # Content/keyword filtering
│   ├── migrations/               # SQL migration files (up + down)
│   └── uploads/                  # Uploaded files (served as static)
│
├── cms/                          # Next.js admin CMS (Turborepo monorepo)
│   ├── apps/
│   │   ├── admin/                # Admin dashboard (port 3001)
│   │   │   └── src/
│   │   │       ├── app/
│   │   │       │   ├── (auth)/   # Login pages
│   │   │       │   ├── (dashboard)/  # Protected admin pages
│   │   │       │   └── api/      # Next.js route handlers
│   │   │       ├── features/     # API fetch + React Query hooks per domain
│   │   │       ├── views/        # 'use client' page-level components
│   │   │       ├── entities/     # Domain entity types
│   │   │       ├── shared/       # Shared utilities
│   │   │       └── widgets/      # Reusable CMS UI components
│   │   └── web/                  # Public-facing website
│   └── packages/
│       ├── db/                   # Prisma schema + migrations
│       ├── types/                # Shared TypeScript types
│       ├── ui/                   # Shared UI component library
│       ├── utils/                # cn, date helpers
│       └── config/               # ESLint, Tailwind, TypeScript configs
│
├── infra/
│   └── centrifugo.json           # Centrifugo server config
├── docker-compose.yml            # Local dev: postgres, redis, centrifugo
├── PRD/                          # Product requirement documents
└── .planning/codebase/           # GSD analysis documents
```

## Directory Purposes

**`app/lib/core/`:**
- Purpose: Infrastructure shared by the entire Flutter app; never imports from `features/`
- Key files: `core/network/api_client.dart`, `core/router/app_router.dart`, `core/storage/token_storage.dart`, `core/theme/app_theme.dart`

**`app/lib/features/{feature}/`:**
- Purpose: Self-contained vertical slice for one product domain
- Contains: `data/` sub-dir (models + repository) and `presentation/` sub-dir (screens + providers + card widgets)
- Key pattern: Feature owns its Riverpod providers; no cross-feature provider imports (features compose via `shared/`)

**`app/lib/features/{feature}/data/`:**
- Purpose: All network and storage access for the feature
- Contains: `*_models.dart`, `*.freezed.dart`, `*.g.dart`, `*_repository.dart`

**`app/lib/features/{feature}/presentation/`:**
- Purpose: All UI and state management for the feature
- Contains: `*_screen.dart`, `*_card.dart`, `*_section.dart`, `*_provider.dart`

**`app/lib/shared/`:**
- Purpose: Widgets, models, and utils used by more than one feature
- Key files: `shared/widgets/image_upload_widget.dart`, `shared/widgets/cached_image.dart`, `shared/widgets/youtube_hero.dart`, `shared/models/image_model.dart`

**`server/internal/handler/`:**
- Purpose: HTTP layer; one handler file per domain, plus `routes.go` which wires all dependencies
- Key file: `server/internal/handler/routes.go` — the single point where all repos/services/handlers are constructed and routes registered

**`server/internal/service/`:**
- Purpose: Business logic; one service file per domain
- All services are instantiated in `routes.go` with explicit dependency injection

**`server/internal/repository/`:**
- Purpose: Raw SQL queries using `database/sql` stdlib; no ORM
- Pattern: `New{Domain}Repository(db *sql.DB)` constructor

**`server/migrations/`:**
- Purpose: Numbered sequential SQL migrations (`001_init`, `002_coordinator`, etc.)
- Format: `{NNN}_{name}.up.sql` and `{NNN}_{name}.down.sql`
- Seed files: `seed_mock.sql`, `seed_mock_cleanup.sql`

**`cms/apps/admin/src/features/`:**
- Purpose: Domain-scoped data access layer for the CMS; `api.ts` contains raw fetch, `queries.ts` contains React Query hooks
- Pattern: `features/{name}/api.ts` → `features/{name}/queries.ts` → imported in views

**`cms/apps/admin/src/views/`:**
- Purpose: Page-level `use client` components; composed from feature hooks + UI packages
- Pattern: One view component per page; imported by the corresponding `page.tsx`

---

## Key File Locations

**Entry Points:**
- `app/lib/main.dart`: Flutter app startup
- `server/cmd/api/main.go`: Go server startup
- `cms/apps/admin/src/app/layout.tsx`: CMS root layout

**Configuration:**
- `app/pubspec.yaml`: Flutter dependencies
- `server/go.mod`: Go module and dependencies
- `cms/package.json`: Turborepo root workspace config
- `cms/turbo.json`: Turborepo pipeline config
- `docker-compose.yml`: Local service orchestration (postgres:15432, redis:6379, centrifugo:8000)
- `infra/centrifugo.json`: Centrifugo namespace and auth config

**Core Logic:**
- `app/lib/core/router/app_router.dart`: All routes, auth guards, bottom nav shell
- `app/lib/core/network/api_client.dart`: HTTP client with JWT auto-refresh
- `app/lib/core/theme/app_theme.dart`: `AppTheme`, `AppColors`, `AppSpacing` — all visual constants
- `server/internal/handler/routes.go`: Full route registration + dependency wiring
- `server/pkg/auth/jwt.go`: JWT generation and validation

**Auth State (Flutter):**
- `app/lib/features/auth/presentation/auth_provider.dart`: `AuthNotifier`, `AuthState`, `AuthStatus` enum, `authStateProvider`
- `app/lib/features/auth/data/auth_repository.dart`: Token CRUD + auth API calls
- `app/lib/core/storage/token_storage.dart`: Secure storage wrapper

**Real-Time Chat:**
- `app/lib/features/chat/data/centrifugo_client.dart`: WebSocket connection to Centrifugo
- `app/lib/features/chat/presentation/chat_provider.dart`: Chat room state
- `server/pkg/auth/centrifugo.go`: Centrifugo JWT generation

**Database:**
- `server/migrations/`: Sequential SQL migrations
- `cms/packages/db/`: Prisma schema (used by CMS only; Go server uses raw SQL)

---

## Naming Conventions

**Flutter Files:**
- Screens: `{feature_name}_screen.dart` (e.g., `consultation_home_screen.dart`)
- Card widgets: `{entity}_card.dart` (e.g., `hospital_card.dart`)
- Section widgets: `{name}_section.dart` (e.g., `review_section.dart`)
- Providers: `{feature}_provider.dart` (e.g., `consultation_provider.dart`)
- Repositories: `{feature}_repository.dart`
- Models: `{feature}_models.dart`
- Generated: `{models_file}.freezed.dart`, `{models_file}.g.dart`

**Flutter Directories:**
- Feature names use `snake_case` (e.g., `cast_member/`, `mypage/`)
- Each feature has exactly `data/` and `presentation/` sub-directories

**Go Files:**
- Handlers: `{domain}_handler.go`, route registrations sometimes in `{domain}_routes.go`
- Services: `{domain}_service.go`
- Repositories: `{domain}_repo.go`
- Models: `{domain}.go` (no suffix)

**CMS Files:**
- Feature API: `features/{name}/api.ts`
- Feature queries: `features/{name}/queries.ts`
- Views: `views/{name}/{Name}View.tsx` pattern

---

## Where to Add New Code

**New Flutter Feature:**
1. Create `app/lib/features/{feature_name}/data/` with `{feature}_models.dart` and `{feature}_repository.dart`
2. Create `app/lib/features/{feature_name}/presentation/` with `{feature}_provider.dart` and `{feature}_screen.dart`
3. Register routes in `app/lib/core/router/app_router.dart` (add to `AppRoutes` constants + route list)
4. Add bottom nav tab to `ScaffoldWithNavBar._navItems` only if it's a top-level tab

**New Flutter Screen (within existing feature):**
- Add screen file: `app/lib/features/{feature}/presentation/{name}_screen.dart`
- Add route to `app_router.dart` as a nested `GoRoute` inside the feature's `StatefulShellBranch`

**New Shared Widget:**
- Add to `app/lib/shared/widgets/{name}.dart`
- If it needs an API call, use `mediaRepositoryProvider` or create a new repository in `shared/`

**New Go API Endpoint:**
1. Add method to `server/internal/service/{domain}_service.go`
2. Add handler method to `server/internal/handler/{domain}_handler.go`
3. Register route in `server/internal/handler/routes.go` in the appropriate group
4. If new domain: create `server/internal/model/{domain}.go`, `server/internal/repository/{domain}_repo.go`, `server/internal/service/{domain}_service.go`, `server/internal/handler/{domain}_handler.go`
5. Add SQL migration: `server/migrations/{NNN}_{description}.up.sql` + `.down.sql`

**New CMS Admin Page:**
1. Add feature module: `cms/apps/admin/src/features/{name}/api.ts` + `queries.ts` + `index.ts`
2. Add view: `cms/apps/admin/src/views/{name}/`
3. Add API route: `cms/apps/admin/src/app/api/v1/admin/{name}/route.ts`
4. Add page: `cms/apps/admin/src/app/(dashboard)/{name}/page.tsx`

**Utilities:**
- Flutter shared utils: `app/lib/shared/utils/{name}.dart`
- Go shared utilities (auth, filters): `server/pkg/{category}/{name}.go`
- CMS shared utils: `cms/packages/utils/`

---

## Special Directories

**`server/uploads/`:**
- Purpose: User-uploaded image files served as static assets
- Generated: Yes (at runtime)
- Committed: No (in `.gitignore`)
- Accessed via: `GET /uploads/{filename}`

**`app/lib/features/auction/`:**
- Purpose: Legacy feature — all routes redirect to `/consultation`
- Note: The `auction` route in `app_router.dart` redirects to `/consultation`; the data/presentation files remain for backward compatibility

**`server/migrations/`:**
- Purpose: Ordered SQL schema migrations
- Generated: No (manually written)
- Committed: Yes
- Convention: `{NNN}_{description}.{up|down}.sql`

**`cms/packages/db/`:**
- Purpose: Prisma ORM schema used exclusively by the CMS (Go server does not use Prisma)
- Generated output: `node_modules/.prisma/client` (not committed)

**`.planning/codebase/`:**
- Purpose: GSD analysis documents consumed by plan/execute commands
- Committed: Yes

---

*Structure analysis: 2026-03-30*
