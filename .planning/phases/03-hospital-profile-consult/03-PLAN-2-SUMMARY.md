---
phase: 03-hospital-profile-consult
plan: 2
subsystem: cms-hospital-portal
tags: [doctors, crud, dnd, react-query, prisma]
dependency_graph:
  requires:
    - 03-PLAN-1 (session helper, hospital layout, middleware)
    - 02-1 (getSessionHospitalId, hospital auth)
  provides:
    - GET /api/v1/hospital/doctors
    - POST /api/v1/hospital/doctors
    - PUT /api/v1/hospital/doctors/[id]
    - DELETE /api/v1/hospital/doctors/[id]
    - PATCH /api/v1/hospital/doctors/order
    - /hospital/doctors page
  affects:
    - hospital-portal feature module (doctors added)
tech_stack:
  added:
    - "@dnd-kit/core + @dnd-kit/sortable (already installed, now used)"
  patterns:
    - "Route Handler: PATCH /[id] with id==='order' branch for bulk sort"
    - "prisma.$transaction for atomic sortOrder batch update"
    - "SortableContext + useSortable + arrayMove for DnD"
    - "Local optimistic state with setLocalDoctors for immediate DnD feedback"
key_files:
  created:
    - cms/apps/admin/src/app/api/v1/hospital/doctors/route.ts
    - cms/apps/admin/src/app/api/v1/hospital/doctors/[id]/route.ts
    - cms/apps/admin/src/features/hospital-portal/doctors/api.ts
    - cms/apps/admin/src/features/hospital-portal/doctors/queries.ts
    - cms/apps/admin/src/features/hospital-portal/doctors/index.ts
    - cms/apps/admin/src/views/hospital/doctors/HospitalDoctorsView.tsx
    - cms/apps/admin/src/app/(hospital)/(hospital-dashboard)/doctors/page.tsx
  modified: []
decisions:
  - "PATCH /[id] with id==='order' branch reuses single dynamic route file for bulk sort (avoids separate /order route file)"
  - "Local optimistic state (localDoctors) ensures DnD feels instant before server confirms order"
  - "Accordion/Collapsible 사용 금지 — 추가 폼은 항상 펼쳐진 섹션으로 구현"
metrics:
  duration: "~20 minutes"
  completed: "2026-03-30"
  tasks_completed: 2
  files_created: 7
  files_modified: 0
---

# Phase 03 Plan 2: 의료진 CRUD + 드래그앤드롭 정렬 Summary

**One-liner:** 병원 포탈 의료진 CRUD API + dnd-kit SortableContext 기반 드래그앤드롭 정렬 UI with React Query optimistic local state

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | 의료진 CRUD + 순서 API (HDOC-01~04) | 659a42ff | doctors/route.ts, doctors/[id]/route.ts |
| 2 | 의료진 관리 UI + Feature module | 4d7066a8 | 5 files (feature module + view + page) |

## What Was Built

### API Routes

**GET /api/v1/hospital/doctors**
- `getSessionHospitalId()` 인증 후 `prisma.hospitalDoctor.findMany` sortOrder 오름차순
- BigInt → string 직렬화

**POST /api/v1/hospital/doctors**
- name 필수 검증 (없으면 400)
- `prisma.hospitalDoctor.aggregate._max.sortOrder + 1` 로 자동 sortOrder 계산

**PUT /api/v1/hospital/doctors/[id]**
- 소속 병원 확인 (findFirst where id AND hospitalId), 없으면 404
- 부분 업데이트 (undefined 필드 제외)

**DELETE /api/v1/hospital/doctors/[id]**
- 소속 병원 확인 후 삭제, 204 반환

**PATCH /api/v1/hospital/doctors/order** (params.id === 'order' 분기)
- `{ orders: [{ id, sortOrder }] }` 배열 검증
- 병원 소속 확인 후 `prisma.$transaction` 일괄 sortOrder 업데이트

### Feature Module

- `api.ts`: fetch 함수 5개 (fetchDoctors, createDoctor, updateDoctor, deleteDoctor, updateDoctorOrder)
- `queries.ts`: React Query hooks 5개 (useDoctorsQuery, useCreateDoctorMutation, useUpdateDoctorMutation, useDeleteDoctorMutation, useUpdateDoctorOrderMutation)
- `index.ts`: 전체 re-export

### HospitalDoctorsView

- **추가 섹션**: 항상 펼쳐진 폼 (name 필수, title/experience 선택)
- **의료진 목록**: DndContext + SortableContext + useSortable
- **드래그 핸들**: 각 카드 좌측 6-dot 아이콘
- **인라인 수정**: 카드 자체가 EditDoctorCard form으로 전환 (Accordion 없음)
- **삭제**: window.confirm 확인 후 mutation
- **DnD 즉각 반영**: arrayMove로 로컬 상태 즉시 변경 → PATCH 순서 저장 → 완료 후 invalidateQueries
- **오류 처리**: 순서 저장 실패 시 로컬 상태 롤백

## Deviations from Plan

**1. [Deviation - Pre-committed] API routes already committed in prior session**
- **Found during:** Task 1 setup
- **Issue:** doctors/route.ts and doctors/[id]/route.ts were already present in commit 659a42ff from a prior session run
- **Resolution:** Verified content is identical, no re-commit needed; proceeded to Task 2

None otherwise — plan executed as written.

## Known Stubs

None — all data flows are wired to real API endpoints via React Query.

## Verification Results

- `npx tsc --noEmit`: No errors in any new files (pre-existing errors in unrelated admin routes excluded per scope boundary)
- No Accordion/Collapsible usage in HospitalDoctorsView.tsx
- PATCH /order branch correctly handles `params.id === 'order'` sentinel
- SortableContext items keyed by doctor.id string

## Self-Check: PASSED

Files exist:
- FOUND: cms/apps/admin/src/app/api/v1/hospital/doctors/route.ts
- FOUND: cms/apps/admin/src/app/api/v1/hospital/doctors/[id]/route.ts
- FOUND: cms/apps/admin/src/features/hospital-portal/doctors/api.ts
- FOUND: cms/apps/admin/src/features/hospital-portal/doctors/queries.ts
- FOUND: cms/apps/admin/src/features/hospital-portal/doctors/index.ts
- FOUND: cms/apps/admin/src/views/hospital/doctors/HospitalDoctorsView.tsx
- FOUND: cms/apps/admin/src/app/(hospital)/(hospital-dashboard)/doctors/page.tsx

Commits exist:
- FOUND: 659a42ff (API routes - prior session)
- FOUND: 4d7066a8 (Feature module + UI)
