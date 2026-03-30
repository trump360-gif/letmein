---
phase: 01-cms-critical
plan: 2
subsystem: cms-admin
tags: [hospital-detail, premium-subscription, server-action, prisma]
dependency_graph:
  requires: []
  provides:
    - hospital-detail-page
    - premium-grant-subscription
  affects:
    - cms/apps/admin/src/app/(dashboard)/hospitals
    - cms/apps/admin/src/views/premium
tech_stack:
  added: []
  patterns:
    - Next.js Server Component (prisma direct query)
    - Server Action with $transaction
    - Chip button UI for tier selection (no dropdown)
key_files:
  created:
    - cms/apps/admin/src/app/(dashboard)/hospitals/[id]/page.tsx
    - cms/apps/admin/src/views/hospitals/detail/HospitalDetailView.tsx
  modified:
    - cms/packages/types/src/letmein.ts
    - cms/apps/admin/src/views/hospitals/components/hospital-table.tsx
    - cms/apps/admin/src/app/(dashboard)/premium/actions.ts
    - cms/apps/admin/src/views/premium/index.tsx
decisions:
  - "tier 선택 UI를 select(드롭다운) 대신 칩 버튼으로 구현 (CLAUDE.md 드롭다운 금지 규칙)"
  - "병원 상세 페이지는 Accordion 없이 모든 섹션(기본정보/전문분야/의료진)을 펼쳐 표시"
  - "grantSubscription 트랜잭션에서 기존 active 구독을 expired 처리 후 신규 생성"
metrics:
  duration: "~20 minutes"
  completed: "2026-03-30"
  tasks: 2
  files: 6
---

# Phase 01 Plan 2: 병원 상세 페이지 + 프리미엄 구독 부여 Summary

**One-liner:** 병원 상세 페이지(/hospitals/[id])와 프리미엄 구독 부여 Server Action + 칩 UI 추가

## Objective Achieved

두 가지 누락된 어드민 기능을 추가했다:
1. 병원 목록에서 병원명 클릭 시 상세 페이지로 이동 — 기본정보/전문분야/의료진을 한 페이지에 펼쳐 표시
2. 프리미엄 구독을 신규 부여하는 Server Action + 폼 UI (기존엔 취소만 가능)

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | 병원 상세 페이지 (CMS-04) | a66579fb | hospitals/[id]/page.tsx, HospitalDetailView.tsx, letmein.ts, hospital-table.tsx |
| 2 | 프리미엄 구독 부여 (CMS-05) | 9aefdd22 | premium/actions.ts, premium/index.tsx |

## Key Changes

### CMS-04: 병원 상세 페이지

- `HospitalSpecialty` 인터페이스 + `HospitalDetail extends Hospital` 타입을 `letmein.ts`에 추가
- `/hospitals/[id]/page.tsx`: Server Component, Prisma로 hospital + specialties + doctors 조회, BigInt 직렬화 처리
- `HospitalDetailView.tsx`: 기본정보(테이블), 소개(텍스트), 전문분야(칩), 의료진(테이블) 순으로 항상 펼쳐서 표시 — Accordion 사용 없음
- `hospital-table.tsx`: 병원명 셀에 `<Link href={/hospitals/${h.id}}>` 추가

### CMS-05: 프리미엄 구독 부여

- `grantSubscription(hospitalId, tier, expiresAt)` Server Action 추가
  - `$transaction`: 기존 active 구독 expired 처리 → 신규 구독 생성 → hospital.isPremium/premiumTier 업데이트
  - monthlyPrice: basic=99000, standard=199000, premium=399000
- `PremiumPage`에 "프리미엄 구독 부여" 인라인 섹션 추가
  - 병원 ID 입력, tier 칩 버튼(basic/standard/premium), 만료일 date input, 부여 버튼
  - 드롭다운 전혀 없음 (CLAUDE.md UI 규칙 준수)

## Deviations from Plan

None - 계획대로 정확히 실행됨.

Task 2의 premium 파일들이 이전 세션의 git add/commit에 함께 묶인 케이스가 있었으나, 코드 내용은 계획과 동일하게 구현되었고 모든 검증이 통과됨.

## Acceptance Criteria Met

- [x] /hospitals/[id] 경로에 페이지 존재
- [x] 병원 기본정보/전문분야(칩)/의료진(테이블) 한 페이지 펼침 표시 (Accordion 없음)
- [x] 병원 목록 테이블 병원명 → /hospitals/[id] 링크
- [x] HospitalSpecialty 타입 letmein.ts에 추가
- [x] grantSubscription Server Action 존재
- [x] 기존 active 구독 expired 처리 후 신규 생성
- [x] hospital.isPremium/premiumTier 업데이트
- [x] 프리미엄 페이지 부여 폼 (병원ID + tier 칩 + 만료일 + 부여 버튼)
- [x] 드롭다운 없음 (tier 선택은 칩 버튼)
- [x] TypeScript 오류 없음 (수정한 파일 기준)

## Known Stubs

None.

## Self-Check: PASSED

- `/Users/jeonminjun/claude/letmein/cms/apps/admin/src/app/(dashboard)/hospitals/[id]/page.tsx` — FOUND
- `/Users/jeonminjun/claude/letmein/cms/apps/admin/src/views/hospitals/detail/HospitalDetailView.tsx` — FOUND
- Commit `a66579fb` — FOUND (Task 1)
- Commit `9aefdd22` — FOUND (Task 2)
- grantSubscription in actions.ts — FOUND
- grant-tier-selector chip UI in premium/index.tsx — FOUND
- No `<select>` dropdown in premium/index.tsx — CONFIRMED
