---
phase: 04-hospital-chat-ads
plan: 3
subsystem: hospital-premium
tags: [premium, subscription, hospital-portal, react-query, prisma]
dependency_graph:
  requires: []
  provides: [hospital-premium-status-api, hospital-premium-feature, hospital-premium-view, hospital-premium-page]
  affects: [hospital-portal]
tech_stack:
  added: []
  patterns: [prisma-direct-query, react-query-useQuery, feature-module, client-view]
key_files:
  created:
    - cms/apps/admin/src/app/api/v1/hospital/premium/status/route.ts
    - cms/apps/admin/src/features/hospital-premium/api.ts
    - cms/apps/admin/src/features/hospital-premium/queries.ts
    - cms/apps/admin/src/features/hospital-premium/index.ts
    - cms/apps/admin/src/views/hospital/premium/HospitalPremiumView.tsx
    - cms/apps/admin/src/app/(hospital)/(hospital-dashboard)/premium/page.tsx
  modified: []
decisions:
  - Used Prisma direct query instead of Go server proxy — no Go proxy pattern exists in codebase; HospitalSubscription model available directly in Prisma
  - Mapped Prisma fields (startedAt/expiresAt/status) to plan interface (startDate/endDate/isActive) in Route Handler response
metrics:
  duration: ~8 minutes
  completed: 2026-03-30
  tasks_completed: 1
  files_created: 6
  files_modified: 0
requirements_satisfied: [HPREM-01, HPREM-02]
---

# Phase 04 Plan 3: Hospital Premium Status Page Summary

## One-liner

Hospital premium page showing current subscription tier/expiry (HPREM-01) and 3-tier benefit cards (BASIC/PREMIUM/VIP) for unsubscribed hospitals (HPREM-02), wired to Prisma `hospital_subscriptions` table.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Route Handler + feature module + View + page | 897160f2 | 6 files created |

## What Was Built

**Route Handler** (`GET /api/v1/hospital/premium/status`):
- `getSessionHospitalId()` guard — 401 if unauthenticated
- Prisma query on `hospital_subscriptions` ordered by `createdAt desc`, maps `startedAt`/`expiresAt`/`status` to `startDate`/`endDate`/`isActive`
- Returns `{ subscription: null }` when no subscription found

**Feature module** (`features/hospital-premium/`):
- `api.ts`: `HospitalSubscription` interface + `fetchPremiumStatus()` function
- `queries.ts`: `usePremiumStatus()` React Query hook, staleTime 5 minutes
- `index.ts`: re-exports all public API

**HospitalPremiumView** (`views/hospital/premium/`):
- `SubscriptionStatusCard`: shows tier badge (gray/blue/gold by tier), start date, expiry date, "만료됨" alert when `isActive === false`, current tier's benefit list
- `BenefitsGuide`: "현재 프리미엄 구독이 없습니다" + 3 tier benefit cards (BASIC/PREMIUM/VIP) laid out in grid — no dropdown, no accordion
- `SkeletonCard`: pulse animation loading state
- Error state with red border message

**Page** (`(hospital-dashboard)/premium/page.tsx`):
- Simple import and render of `HospitalPremiumView`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Prisma direct query instead of Go server proxy**
- **Found during:** Task 1
- **Issue:** Plan specified proxying to Go `GET /api/v1/hospitals/premium/status` with `hospitalJwt`, but no Go proxy pattern exists anywhere in the CMS codebase — all hospital Route Handlers use Prisma directly. There is no `hospitalJwt` or Go server proxy infrastructure.
- **Fix:** Used `prisma.hospitalSubscription.findFirst()` directly, following the same pattern as the dashboard Route Handler. The `HospitalSubscription` Prisma model maps exactly to the needed data.
- **Files modified:** `route.ts`

## Known Stubs

None — all data is wired to the real `hospital_subscriptions` table via Prisma.

## Self-Check

Files exist:
- cms/apps/admin/src/app/api/v1/hospital/premium/status/route.ts — FOUND (committed 897160f2)
- cms/apps/admin/src/app/(hospital)/(hospital-dashboard)/premium/page.tsx — FOUND (committed 897160f2)
- cms/apps/admin/src/features/hospital-premium/api.ts — FOUND
- cms/apps/admin/src/features/hospital-premium/queries.ts — FOUND
- cms/apps/admin/src/features/hospital-premium/index.ts — FOUND
- cms/apps/admin/src/views/hospital/premium/HospitalPremiumView.tsx — FOUND

TypeScript: no errors in premium files (pre-existing errors in unrelated media/ads routes only)

Subscription/null branching: confirmed (`data.subscription !== null ? SubscriptionStatusCard : BenefitsGuide`)
No dropdown/accordion: confirmed (grep returned no results)

## Self-Check: PASSED
