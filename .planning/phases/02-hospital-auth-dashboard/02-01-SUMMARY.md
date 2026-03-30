---
phase: 02-hospital-auth-dashboard
plan: 1
subsystem: hospital-auth-dashboard
tags: [hospital, auth, session, middleware, dashboard, role-routing]
dependency_graph:
  requires: [admin-db-auth, session-helper]
  provides: [hospital-login, hospital-session, hospital-dashboard, role-routing-middleware]
  affects: [middleware, session.ts, admin_credentials-table, hospital-layout]
tech_stack:
  added: [HospitalUser type, hospital-route-group, HospitalSidebar]
  patterns:
    - role-based JWT routing in Next.js middleware
    - Server Component with direct Prisma queries
    - hospital route group (app/(hospital)/(hospital-dashboard))
    - $queryRaw for tables not in Prisma schema
key_files:
  created:
    - cms/apps/admin/src/app/api/v1/hospital/auth/signin/route.ts
    - cms/apps/admin/src/app/api/v1/hospital/auth/signout/route.ts
    - cms/apps/admin/src/app/api/v1/hospital/dashboard/route.ts
    - cms/apps/admin/src/app/(hospital)/hospital-login/page.tsx
    - cms/apps/admin/src/app/(hospital)/layout.tsx
    - cms/apps/admin/src/app/(hospital)/(hospital-dashboard)/layout.tsx
    - cms/apps/admin/src/app/(hospital)/(hospital-dashboard)/page.tsx
    - cms/apps/admin/src/views/hospital/auth/HospitalLoginPage.tsx
    - cms/apps/admin/src/views/hospital/dashboard/HospitalDashboardView.tsx
    - cms/apps/admin/src/widgets/sidebar/HospitalSidebar.tsx
  modified:
    - cms/apps/admin/src/middleware.ts
    - cms/apps/admin/src/lib/session.ts
    - cms/packages/db/prisma/schema.prisma
    - cms/packages/types/src/letmein.ts
decisions:
  - "admin_credentials 테이블을 재사용해 role/hospital_id 컬럼 추가 — 별도 hospital_credentials 테이블 생성보다 단순한 방법"
  - "hospital 대시보드 page.tsx는 내부 API 호출 없이 Prisma 직접 조회 (same process, 불필요한 HTTP 왕복 제거)"
  - "reviews 테이블은 Prisma 스키마에 없어 $queryRaw 사용"
  - "Hospital 모델에 avgRating/reviewCount 필드 추가 (DB 컬럼 존재했지만 schema 누락)"
metrics:
  duration: "~30 minutes"
  completed: "2026-03-30"
  tasks: 3
  files: 14
---

# Phase 02 Plan 1: 병원 인증 + 대시보드 Summary

**한 줄 요약:** AdminCredential에 role/hospital_id 추가로 병원 로그인 분기, JWT role 기반 미들웨어 라우트 보호, 병원 전용 사이드바/레이아웃/대시보드(통계 4개+상담 3건+리뷰 3건) 완성

## Completed Tasks

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | 병원 로그인 API + 세션 헬퍼 확장 (HAUTH-01) | 55d956ac | signin/route.ts, signout/route.ts, session.ts, letmein.ts, schema.prisma |
| 2 | 미들웨어 role 분기 + 병원 로그인 페이지 + 레이아웃 (HAUTH-02, HAUTH-03) | 59a37b25 | middleware.ts, HospitalLoginPage.tsx, page.tsx x2, layout.tsx x2, HospitalSidebar.tsx |
| 3 | 병원 대시보드 API + UI (HDASH-01, HDASH-02, HDASH-03) | d53b8622 | dashboard/route.ts, page.tsx, HospitalDashboardView.tsx, schema.prisma |

## What Was Done

### Task 1: 병원 로그인 API + 세션 헬퍼 확장 (HAUTH-01)

- `admin_credentials` 테이블에 `role VARCHAR(20) NOT NULL DEFAULT 'admin'`, `hospital_id BIGINT REFERENCES hospitals(id)` 컬럼 추가 (ALTER TABLE)
- Prisma schema `AdminCredential` 모델에 `role`, `hospitalId` 필드 추가 + `prisma generate`
- 테스트 병원 계정 삽입: `hospital@letmein.kr / hospital1234`, hospital_id=3 연결
- `POST /api/v1/hospital/auth/signin`:
  - `role=hospital` 계정만 로그인 허용, `admin` 계정은 401
  - JWT payload: `{ sub, email, name, role: 'hospital', hospitalId }`
  - 쿠키: `admin_token` (기존 미들웨어와 동일한 쿠키명)
- `POST /api/v1/hospital/auth/signout`: `admin_token` 쿠키 삭제
- `session.ts` 확장: `getSessionRole()`, `getSessionHospitalId()` 헬퍼 추가
- `letmein.ts` `HospitalUser` 인터페이스 추가

### Task 2: 미들웨어 role 분기 + 병원 로그인 페이지 + 레이아웃 (HAUTH-02, HAUTH-03)

- `middleware.ts` 완전 교체:
  - `role=hospital`: 어드민 전용 라우트(`/coordinator`, `/hospitals` 등) → `/hospital/dashboard` 리다이렉트
  - `role=admin`: `/hospital/*` → `/` 리다이렉트
  - 토큰 없음 + `/hospital/*` → `/hospital-login` 리다이렉트
  - `/login`, `/hospital-login`, `/api/*` 항상 통과
- `HospitalLoginPage.tsx`: 에메랄드 테마 로그인 폼, "병원 포탈 로그인" 타이틀, 하단 "관리자 로그인 →" 링크
- `(hospital)/hospital-login/page.tsx`: `/hospital-login` 라우트
- `(hospital)/layout.tsx`: route group 레이아웃 (children pass-through)
- `HospitalSidebar.tsx`: 대시보드/상담 관리/채팅/프리미엄 메뉴, `/api/v1/hospital/auth/signout` 로그아웃
- `(hospital)/(hospital-dashboard)/layout.tsx`: `HospitalSidebar` + `Header` 포함

### Task 3: 병원 대시보드 API + UI (HDASH-01, HDASH-02, HDASH-03)

- `GET /api/v1/hospital/dashboard`: hospitalId 기반 4개 통계 + 상담 3건 + 리뷰 3건 반환
- `(hospital)/(hospital-dashboard)/page.tsx`: Server Component, Prisma 직접 조회, BigInt 직렬화
- `HospitalDashboardView.tsx`:
  - 통계 카드 4개 (2열→4열 그리드): 신규 매칭, 활성 채팅, 평균 응답률, 평점
  - 최근 상담 요청 3건: 카테고리 칩 + 상태 칩 + 날짜 + 설명 60자
  - 최근 리뷰 3건: 별점 + 날짜 + 내용 80자
  - Accordion/드롭다운 없음, 항상 펼쳐서 표시 (CLAUDE.md 준수)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Hospital 모델 avgRating/reviewCount 필드 누락**
- **Found during:** Task 3
- **Issue:** Prisma schema `Hospital` 모델에 `avgRating`, `reviewCount` 필드가 없었으나 DB에 `avg_rating`, `review_count` 컬럼이 실제로 존재했음 (Phase 1 deferred items에서 언급됨). TypeScript error `Property 'avgRating' does not exist on type 'HospitalSelect'` 발생
- **Fix:** `schema.prisma`에 `avgRating Decimal? @map("avg_rating") @db.Decimal(2, 1)`, `reviewCount Int? @map("review_count")` 추가 후 `prisma generate`
- **Files modified:** `cms/packages/db/prisma/schema.prisma`
- **Commit:** d53b8622

## Acceptance Criteria Met

- [x] POST /api/v1/hospital/auth/signin: hospital 계정 로그인 성공 시 admin_token 쿠키 설정 + role=hospital payload 포함
- [x] POST /api/v1/hospital/auth/signout: admin_token 쿠키 삭제
- [x] admin_credentials 테이블에 role, hospital_id 컬럼 존재
- [x] getSessionRole(), getSessionHospitalId() 헬퍼 존재
- [x] HospitalUser 타입이 letmein.ts에 export됨
- [x] /hospital-login 경로에 페이지 파일 존재
- [x] middleware.ts에 role 분기 로직 존재 (hospital → 어드민 라우트 차단, admin → /hospital/* 차단)
- [x] HospitalSidebar.tsx에 병원 메뉴 + 로그아웃 버튼 존재
- [x] (hospital)/(hospital-dashboard)/layout.tsx에 HospitalSidebar import 존재
- [x] /hospital/dashboard 경로에 page.tsx 존재
- [x] HospitalDashboardView에 stats(4개), recentConsultations(3건), recentReviews(3건) 렌더링
- [x] reviews 테이블은 prisma.$queryRaw로 조회
- [x] BigInt 직렬화 처리됨 (toString() 호출)
- [x] TypeScript 오류 없음 (수정된 파일 기준)

## Known Stubs

없음. 모든 데이터는 실제 DB에서 조회한다. 병원 계정(`hospital@letmein.kr`)은 hospital_id=3과 연결되어 있으며 해당 병원의 실제 데이터가 표시된다.

단, 이번 Plan에서 생성된 `(hospital)/(hospital-dashboard)/(consultations)`, `(hospital)/(hospital-dashboard)/(chat)`, `(hospital)/(hospital-dashboard)/(premium)` 하위 페이지들은 아직 없다. HospitalSidebar의 `/hospital/consultations`, `/hospital/chat`, `/hospital/premium` 링크는 Phase 3/4에서 구현 예정이다.

## Self-Check: PASSED

- `cms/apps/admin/src/app/api/v1/hospital/auth/signin/route.ts` — FOUND
- `cms/apps/admin/src/app/api/v1/hospital/auth/signout/route.ts` — FOUND
- `cms/apps/admin/src/app/api/v1/hospital/dashboard/route.ts` — FOUND
- `cms/apps/admin/src/app/(hospital)/hospital-login/page.tsx` — FOUND
- `cms/apps/admin/src/app/(hospital)/(hospital-dashboard)/layout.tsx` — FOUND
- `cms/apps/admin/src/app/(hospital)/(hospital-dashboard)/page.tsx` — FOUND
- `cms/apps/admin/src/views/hospital/auth/HospitalLoginPage.tsx` — FOUND
- `cms/apps/admin/src/views/hospital/dashboard/HospitalDashboardView.tsx` — FOUND
- `cms/apps/admin/src/widgets/sidebar/HospitalSidebar.tsx` — FOUND
- middleware.ts contains `role === 'hospital'` — FOUND
- session.ts contains `getSessionRole`, `getSessionHospitalId` — FOUND
- letmein.ts contains `HospitalUser` — FOUND
- Commit 55d956ac — FOUND (Task 1)
- Commit 59a37b25 — FOUND (Task 2)
- Commit d53b8622 — FOUND (Task 3)
