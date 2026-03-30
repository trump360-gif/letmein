---
phase: 03-hospital-profile-consult
plan: 3
subsystem: hospital-portal-consultations
tags: [hospital, consultations, react-query, api-route, split-view, tab-filter]
dependency_graph:
  requires:
    - 02-hospital-auth-dashboard (getSessionHospitalId, JWT session)
    - coordinator_matches, consultation_requests, consultation_responses Prisma 모델
  provides:
    - GET /api/v1/hospital/consultations (탭 필터 목록)
    - POST /api/v1/hospital/consultations/[id]/respond (응답 발송)
    - /hospital/consultations 페이지 (탭+상세+응답폼)
  affects:
    - HospitalDashboardView의 "전체 보기 →" 링크 (/hospital/consultations)
tech_stack:
  added:
    - hospital-portal/consultations feature module (api.ts, queries.ts, index.ts)
  patterns:
    - CoordinatorMatch JOIN ConsultationRequest via Prisma include
    - upsert로 중복 응답 방지 (request_id_hospital_id unique)
    - React Query invalidateQueries on mutation success
    - key prop on DetailPanel to reset local form state on selection change
key_files:
  created:
    - cms/apps/admin/src/app/api/v1/hospital/consultations/route.ts
    - cms/apps/admin/src/app/api/v1/hospital/consultations/[id]/respond/route.ts
    - cms/apps/admin/src/features/hospital-portal/consultations/api.ts
    - cms/apps/admin/src/features/hospital-portal/consultations/queries.ts
    - cms/apps/admin/src/features/hospital-portal/consultations/index.ts
    - cms/apps/admin/src/views/hospital/consultations/HospitalConsultationsView.tsx
    - cms/apps/admin/src/app/(hospital)/(hospital-dashboard)/consultations/page.tsx
  modified: []
decisions:
  - "응답 폼 상태(intro/experience/message)는 selectedId를 key prop으로 전달해 선택 변경 시 자동 리셋"
  - "upsert 사용으로 재발송(수정) 허용하되 unique 제약으로 DB 중복 방지"
  - "DetailPanel에서 로컬 responded 상태로 UI 즉시 갱신, 쿼리 invalidation으로 목록도 갱신"
metrics:
  duration: ~8 minutes
  completed_date: "2026-03-30"
  tasks_completed: 2
  tasks_total: 2
  files_created: 7
  files_modified: 0
---

# Phase 03 Plan 3: 상담 요청 목록 (탭 필터) + 응답 작성 Summary

**One-liner:** CoordinatorMatch 기반 탭 필터 목록 + 좌우 split 상세패널 + 소개/경험/메시지 응답 폼 (upsert + React Query invalidation)

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | 상담 목록 조회 + 응답 발송 API | 659a42ff | consultations/route.ts, [id]/respond/route.ts |
| 2 | 상담 목록 + 상세 + 응답 UI | 3145514c | feature module 3개 + View + page.tsx |

## What Was Built

### Task 1: API Routes

**GET /api/v1/hospital/consultations**
- `getSessionHospitalId()` → 401 if null
- `status` 쿼리 파라미터 (all/pending/responded)
- `prisma.coordinatorMatch.findMany` + include request → procedure_categories, consultation_request_details → procedure_details, consultation_responses
- 응답 여부 계산: `consultation_responses.length > 0` → pending/responded
- JSON: `{ consultations: [...] }`

**POST /api/v1/hospital/consultations/[id]/respond**
- 검증: message 10자 미만 → 400, 3000자 초과 → 400, intro/experience 60자 초과 → 400
- CoordinatorMatch 존재 확인 → 404
- `prisma.consultation_responses.upsert` (request_id_hospital_id unique)
- 201: `{ response: {...} }`

### Task 2: Feature Module + UI

**Feature module** (`features/hospital-portal/consultations/`)
- `api.ts`: `fetchConsultations(status)`, `respondToConsultation(requestId, data)`, 타입 정의
- `queries.ts`: `useConsultationsQuery(status)`, `useRespondToConsultationMutation()`
- `index.ts`: re-export

**HospitalConsultationsView**
- 탭 3개: 전체/대기/응답완료 — 텍스트 버튼, 하단 밑줄, Accordion 없음
- 좌측 목록 (md:w-80): 카테고리 배지 + 상태 배지 + 날짜 + 설명 1줄
- 우측 상세 패널: 부위 칩, 시기, 내용, 코디 메모, photoPublic 배지
- 응답 폼: intro(60자 카운터), experience(60자 카운터), message(3000자 카운터, 10자 미만 비활성)
- 응답 발송 성공 → "이미 응답을 발송했습니다" 안내 + 쿼리 invalidate

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None - all data flows from real Prisma queries. `consultation_request_details` photos are represented via `photoPublic` boolean badge (no image URL available in schema — only boolean flag per plan spec).

## Self-Check: PASSED

Files exist:
- cms/apps/admin/src/app/api/v1/hospital/consultations/route.ts - FOUND
- cms/apps/admin/src/app/api/v1/hospital/consultations/[id]/respond/route.ts - FOUND
- cms/apps/admin/src/features/hospital-portal/consultations/api.ts - FOUND
- cms/apps/admin/src/features/hospital-portal/consultations/queries.ts - FOUND
- cms/apps/admin/src/features/hospital-portal/consultations/index.ts - FOUND
- cms/apps/admin/src/views/hospital/consultations/HospitalConsultationsView.tsx - FOUND
- cms/apps/admin/src/app/(hospital)/(hospital-dashboard)/consultations/page.tsx - FOUND

Commits exist:
- 659a42ff (Task 1: API routes) - FOUND
- 3145514c (Task 2: UI) - FOUND

TypeScript: No errors in new files (npx tsc --noEmit confirmed 0 errors on created files)
