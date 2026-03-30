---
phase: 03-hospital-profile-consult
plan: 1
subsystem: hospital-portal
tags: [hospital, profile, dnd-kit, react-query, prisma]
requirements: [HPROF-01, HPROF-02, HPROF-03, HPROF-04]
dependency_graph:
  requires: []
  provides:
    - GET/PUT /api/v1/hospital/profile
    - GET/PUT /api/v1/hospital/profile/images
    - GET/POST/DELETE /api/v1/hospital/profile/specialties
    - /hospital/profile 페이지
  affects:
    - cms/packages/db/prisma/schema.prisma (galleryImages 필드 추가)
    - server/migrations/008_hospital_gallery.up.sql
tech_stack:
  added:
    - "@dnd-kit/sortable (already installed, first use in hospital)"
  patterns:
    - "React Query v5 useMutation + useQuery"
    - "dnd-kit DndContext + SortableContext + useSortable"
    - "getSessionHospitalId() 인증 패턴"
    - "gallery_images JSON 문자열 → Prisma galleryImages"
key_files:
  created:
    - cms/apps/admin/src/app/api/v1/hospital/profile/route.ts
    - cms/apps/admin/src/app/api/v1/hospital/profile/images/route.ts
    - cms/apps/admin/src/app/api/v1/hospital/profile/specialties/route.ts
    - cms/apps/admin/src/features/hospital-portal/profile/api.ts
    - cms/apps/admin/src/features/hospital-portal/profile/queries.ts
    - cms/apps/admin/src/features/hospital-portal/profile/index.ts
    - cms/apps/admin/src/views/hospital/profile/HospitalProfileView.tsx
    - cms/apps/admin/src/app/(hospital)/(hospital-dashboard)/profile/page.tsx
    - server/migrations/008_hospital_gallery.up.sql
    - server/migrations/008_hospital_gallery.down.sql
  modified:
    - cms/packages/db/prisma/schema.prisma
decisions:
  - "gallery_images를 Hospital 레코드에 JSON 문자열로 저장 (별도 테이블 없음)"
  - "대표 이미지와 갤러리 이미지를 통합 배열로 UI에서 관리"
  - "prisma generate 후 DB 컬럼은 008_hospital_gallery 마이그레이션으로 추가"
metrics:
  duration: "~20 minutes"
  completed_date: "2026-03-30"
  tasks_completed: 2
  files_created: 10
  files_modified: 1
---

# Phase 03 Plan 1: 병원 프로필 편집 Summary

**One-liner:** Hospital 프로필 편집 기능 — 기본정보 PUT, gallery_images JSON 저장, 전문분야 칩 CRUD, 소개 2000자 — dnd-kit DnD + React Query v5

## What Was Built

병원 사용자가 CMS의 `/hospital/profile` 페이지에서 자신의 병원 정보(기본정보, 갤러리 이미지, 전문분야, 소개)를 직접 조회하고 편집할 수 있는 기능을 완성했다.

### API Routes (3개)

| Route | Methods | Description |
|-------|---------|-------------|
| `/api/v1/hospital/profile` | GET, PUT | 기본정보 조회/저장. PUT 시 name 필드 무시 |
| `/api/v1/hospital/profile/images` | GET, PUT | 갤러리 이미지 배열 조회/순서저장 (최대 10장) |
| `/api/v1/hospital/profile/specialties` | GET, POST, DELETE | 전문분야 목록 + allCategories 조회, 추가, 제거 |

모든 Route Handler는 `getSessionHospitalId()` 인증 패턴 사용. null이면 401 반환.

### Feature Module

`cms/apps/admin/src/features/hospital-portal/profile/` 모듈:
- `api.ts`: 7개 fetch 함수 (fetchProfile, updateProfile, fetchImages, updateImages, fetchSpecialties, addSpecialty, removeSpecialty)
- `queries.ts`: React Query v5 훅 7개 (useQuery / useMutation)
- `index.ts`: 전체 re-export

### UI (HospitalProfileView.tsx)

4개 섹션 (항상 펼쳐진 상태, Accordion 없음):

1. **기본정보**: 병원명(disabled), 주소, 전화번호, 영업시간 + 저장버튼
2. **이미지 관리**: @dnd-kit/sortable 드래그앤드롭, URL 추가, × 삭제, 최대 10장 제한
3. **전문분야**: allCategories 전체 칩 나열, 선택/미선택 토글, 즉시 API 호출
4. **소개**: Textarea maxLength=2000, `N / 2,000` 글자수 카운터

### Schema 변경

`Hospital` 모델에 `galleryImages String? @map("gallery_images")` 추가.
DB 컬럼 추가 SQL: `server/migrations/008_hospital_gallery.up.sql`

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| Task 1: API + Schema | 897160f2 | 프로필 API 3종 + schema galleryImages 필드 |
| Task 2: UI + Feature | 7a7509a1 | 프로필 편집 UI + feature module |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing] DB 마이그레이션 파일 추가**
- **Found during:** Task 1
- **Issue:** 계획에서 `prisma.$executeRaw`로 gallery_images 컬럼 추가를 언급했으나, 실제 런타임에서 DB 연결이 없는 상태. 기존 프로젝트 패턴(server/migrations/)에 따라 SQL 마이그레이션 파일로 분리하는 것이 더 안전하고 일관성 있는 접근.
- **Fix:** `server/migrations/008_hospital_gallery.up.sql` 및 `.down.sql` 생성. 기존 hospitals 테이블에 누락된 컬럼들(is_premium, detailed_description 등)도 포함.
- **Files modified:** server/migrations/008_hospital_gallery.up.sql, .down.sql

**2. [Rule 1 - Enhancement] 이미지 관리 통합 배열 방식**
- **Found during:** Task 2
- **Issue:** 계획에서 profileImage(대표)와 galleryImages(갤러리)를 별도로 관리하도록 설계되었으나, PUT /api/v1/hospital/profile/images는 galleryImages JSON 배열만 저장함. UI에서는 두 개를 통합 배열로 표시하되, 저장 시 전체를 images API로 보내도록 구현.
- **Fix:** UI에서 profileImage를 index 0으로 합산하여 통합 드래그 가능 배열 구성. 저장 시 combined 배열 전체를 `updateImages()`로 전달.
- **Files modified:** HospitalProfileView.tsx

## Known Stubs

없음 — API는 DB 연결 후 실제 데이터를 반환하도록 구현되었음. galleryImages 컬럼은 `008_hospital_gallery.up.sql` 마이그레이션 실행 후 동작함.

## Self-Check: PASSED

Files created/exist:
- [FOUND] cms/apps/admin/src/app/api/v1/hospital/profile/route.ts
- [FOUND] cms/apps/admin/src/app/api/v1/hospital/profile/images/route.ts
- [FOUND] cms/apps/admin/src/app/api/v1/hospital/profile/specialties/route.ts
- [FOUND] cms/apps/admin/src/features/hospital-portal/profile/api.ts
- [FOUND] cms/apps/admin/src/features/hospital-portal/profile/queries.ts
- [FOUND] cms/apps/admin/src/features/hospital-portal/profile/index.ts
- [FOUND] cms/apps/admin/src/views/hospital/profile/HospitalProfileView.tsx
- [FOUND] cms/apps/admin/src/app/(hospital)/(hospital-dashboard)/profile/page.tsx
- [FOUND] server/migrations/008_hospital_gallery.up.sql

Commits exist:
- [FOUND] 897160f2
- [FOUND] 7a7509a1

TypeScript: No errors in new hospital/profile files (pre-existing errors in unrelated admin routes excluded per scope boundary rule).
