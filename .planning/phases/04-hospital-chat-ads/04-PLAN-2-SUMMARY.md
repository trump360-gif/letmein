---
phase: 04-hospital-chat-ads
plan: 2
subsystem: cms-hospital-ads
tags: [hospital, ads, credit, creative, campaign, react-query, prisma]
dependency_graph:
  requires:
    - prisma: AdCredit, AdCreative, AdCampaign, ad_impressions_daily models
    - cms-session: getSessionHospitalId()
    - hospital-dashboard-layout: (hospital)/(hospital-dashboard) layout
  provides:
    - GET /api/v1/hospital/ads/credit
    - GET/POST /api/v1/hospital/ads/creatives
    - GET/POST /api/v1/hospital/ads/campaigns
    - GET /api/v1/hospital/ads/campaigns/[id]/report
    - PATCH /api/v1/hospital/ads/campaigns/[id]/pause
    - /hospital/ads page with full ad management UI
  affects:
    - HospitalSidebar (added ads nav link)
tech_stack:
  patterns:
    - Next.js Route Handlers with Prisma (matching existing hospital route pattern)
    - React Query (useQuery + useMutation) for client-side data management
    - Tailwind CSS utility classes for UI
    - tab/chip state management with useState
key_files:
  created:
    - cms/apps/admin/src/app/api/v1/hospital/ads/credit/route.ts
    - cms/apps/admin/src/app/api/v1/hospital/ads/creatives/route.ts
    - cms/apps/admin/src/app/api/v1/hospital/ads/campaigns/route.ts
    - cms/apps/admin/src/app/api/v1/hospital/ads/campaigns/[id]/report/route.ts
    - cms/apps/admin/src/app/api/v1/hospital/ads/campaigns/[id]/pause/route.ts
    - cms/apps/admin/src/features/hospital-ads/api.ts
    - cms/apps/admin/src/features/hospital-ads/queries.ts
    - cms/apps/admin/src/features/hospital-ads/index.ts
    - cms/apps/admin/src/views/hospital/ads/HospitalAdsView.tsx
    - cms/apps/admin/src/app/(hospital)/(hospital-dashboard)/ads/page.tsx
  modified:
    - cms/apps/admin/src/widgets/sidebar/HospitalSidebar.tsx
decisions:
  - Implemented Route Handlers using Prisma directly (not Go API proxy), matching existing hospital routes pattern (consultations, dashboard all use Prisma)
  - ad_impressions_daily field is `spent` not `spend` — corrected from plan interface spec
  - Campaign creation requires `placement` and `cpmPrice` fields (schema non-nullable) — defaulted to 'chat' and 1000
  - No separate hospitalJwt in session — CMS session uses admin_token with hospitalId claim
metrics:
  duration: ~20 minutes
  completed: "2026-03-30"
  tasks_completed: 2
  files_created: 10
  files_modified: 1
---

# Phase 04 Plan 2: 병원 광고 관리 (HAD-01~05) Summary

**One-liner:** Prisma 직접 조회 + React Query로 구현한 광고 크레딧/크리에이티브/캠페인 3탭 관리 UI

## What Was Built

병원 CMS에 광고 관리 전체 기능을 구현했다.

- **HAD-01:** 광고 크레딧 잔액 카드 — 30초 자동 refetch, 원 단위 포맷
- **HAD-02:** 크리에이티브 탭 — 이미지+헤드라인 등록 인라인 폼, reviewStatus 뱃지 (pending=노란, approved=녹색, rejected=빨간)
- **HAD-03:** 캠페인 탭 — 라디오 카드로 승인 크리에이티브 선택, 기간/일예산 입력, 생성 폼
- **HAD-04:** 캠페인 행 "리포트" 버튼 — 클릭 시 inline 표시 (총 노출/클릭/소비, CTR)
- **HAD-05:** active 캠페인 "일시정지" / paused 캠페인 "재개" 버튼 (toggle PATCH 호출)

## Architecture

Route Handlers (5개) → Prisma → PostgreSQL (existing DB)
feature module: api.ts → queries.ts (React Query) → HospitalAdsView.tsx

**Note:** 계획에서는 Go 서버 프록시 패턴을 제안했으나, 실제 코드베이스의 기존 hospital route 패턴 (dashboard, consultations)은 모두 Prisma 직접 조회를 사용한다. CMS session의 admin_token에는 hospitalJwt가 없으며 hospitalId만 있다. 기존 패턴을 따라 Prisma 직접 조회로 구현했다.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] ad_impressions_daily.spend → spent 필드명 수정**
- **Found during:** Task 1 (report route 작성 중 스키마 확인)
- **Issue:** 계획의 인터페이스 spec에서 `spend` 필드라고 명시했으나 실제 Prisma 스키마는 `spent`
- **Fix:** report/route.ts와 api.ts의 AdImpressionDaily 타입에서 `spend` → `spent` 수정
- **Files modified:** `campaigns/[id]/report/route.ts`
- **Commit:** ea34d157

**2. [Rule 2 - Missing Critical] AdCampaign 생성 시 필수 필드 기본값 추가**
- **Found during:** Task 1 (campaigns POST route 작성 중)
- **Issue:** Prisma 스키마에서 `placement` (VarChar(30), non-nullable)와 `cpmPrice` (Int, non-nullable) 필드 존재 — 계획의 API 스펙에 없음
- **Fix:** `placement: 'chat'`, `cpmPrice: 1000` 기본값으로 캠페인 생성
- **Files modified:** `campaigns/route.ts`
- **Commit:** ea34d157

**3. [Rule 1 - Bug] Go 프록시 패턴 → Prisma 직접 조회로 전환**
- **Found during:** Task 1 (기존 코드 패턴 확인)
- **Issue:** 계획에서 `session.hospitalJwt`로 Go 서버 프록시를 제안했으나, 실제 CMS session (`admin_token` JWT)에는 `hospitalJwt` 필드가 없음. 기존 hospital 라우트 (dashboard, consultations)는 모두 Prisma 직접 조회 사용
- **Fix:** 모든 5개 Route Handler를 Prisma 직접 조회로 구현 (기존 패턴 준수)
- **Files modified:** All 5 route.ts files
- **Commit:** ea34d157

**4. [Rule 2 - Missing Critical] HospitalSidebar에 광고 관리 링크 추가**
- **Found during:** Task 2 완료 후
- **Issue:** /hospital/ads 페이지가 존재하지만 사이드바에 내비게이션 링크가 없으면 접근 불가
- **Fix:** HospitalSidebar에 `{ name: '광고 관리', href: '/hospital/ads', icon: Megaphone }` 추가
- **Files modified:** `cms/apps/admin/src/widgets/sidebar/HospitalSidebar.tsx`
- **Commit:** 89efb8d2

## Known Stubs

없음 — 모든 데이터는 실제 Prisma 쿼리로 조회됨.

- 광고 크레딧: `ad_credits` 테이블에서 실제 `balance` 조회 (레코드 없으면 0원 반환)
- 크리에이티브 목록: `ad_creatives` 테이블에서 실제 조회
- 캠페인 목록/성과: `ad_campaigns` + `ad_impressions_daily` 실제 데이터

## Success Criteria Check

- [x] HAD-01: /hospital/ads 페이지 상단에 광고 크레딧 잔액 숫자 표시
- [x] HAD-02: 크리에이티브 탭에서 imageUrl + headline 입력 후 등록 가능
- [x] HAD-03: 캠페인 탭에서 기간/일예산/크리에이티브 선택 후 생성 가능
- [x] HAD-04: 캠페인 행에서 "리포트" 클릭 시 노출/클릭/소비 인라인 표시
- [x] HAD-05: active 캠페인에 "일시정지", paused 캠페인에 "재개" 버튼 작동
- [x] 드롭다운/아코디언 없음 (CLAUDE.md 규칙 준수) — 탭/칩/라디오 카드 사용
- [x] TypeScript 컴파일 에러 없음 (신규 파일 기준)

## Self-Check: PASSED
