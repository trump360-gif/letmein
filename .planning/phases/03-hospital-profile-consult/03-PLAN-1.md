---
phase: 03-hospital-profile-consult
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - cms/apps/admin/src/app/api/v1/hospital/profile/route.ts
  - cms/apps/admin/src/app/api/v1/hospital/profile/images/route.ts
  - cms/apps/admin/src/app/api/v1/hospital/profile/specialties/route.ts
  - cms/apps/admin/src/app/(hospital)/(hospital-dashboard)/profile/page.tsx
  - cms/apps/admin/src/views/hospital/profile/HospitalProfileView.tsx
  - cms/apps/admin/src/features/hospital-portal/profile/api.ts
  - cms/apps/admin/src/features/hospital-portal/profile/queries.ts
  - cms/apps/admin/src/features/hospital-portal/profile/index.ts
autonomous: true
requirements:
  - HPROF-01
  - HPROF-02
  - HPROF-03
  - HPROF-04

must_haves:
  truths:
    - "병원 사용자가 병원명(읽기전용), 주소, 전화번호, 영업시간, 소개(2,000자)를 조회할 수 있다"
    - "편집 후 저장하면 Hospital 레코드가 DB에 반영된다 (병원명은 변경 불가)"
    - "대표 이미지 + 갤러리 이미지를 드래그앤드롭으로 순서를 바꾸고 저장할 수 있다 (최대 10장)"
    - "전문분야 칩을 추가하거나 클릭해서 제거할 수 있다"
  artifacts:
    - path: "cms/apps/admin/src/app/api/v1/hospital/profile/route.ts"
      provides: "GET 기본정보 조회, PUT 기본정보 저장 (name 필드 무시)"
      exports: ["GET", "PUT"]
    - path: "cms/apps/admin/src/app/api/v1/hospital/profile/images/route.ts"
      provides: "GET 이미지 목록, PUT 이미지 순서 저장"
      exports: ["GET", "PUT"]
    - path: "cms/apps/admin/src/app/api/v1/hospital/profile/specialties/route.ts"
      provides: "GET 전문분야 목록, POST 전문분야 추가, DELETE 전문분야 제거"
      exports: ["GET", "POST", "DELETE"]
    - path: "cms/apps/admin/src/views/hospital/profile/HospitalProfileView.tsx"
      provides: "프로필 편집 전체 UI (기본정보 + 이미지 + 전문분야 + 소개)"
    - path: "cms/apps/admin/src/app/(hospital)/(hospital-dashboard)/profile/page.tsx"
      provides: "라우트 /hospital/profile"
  key_links:
    - from: "cms/apps/admin/src/views/hospital/profile/HospitalProfileView.tsx"
      to: "/api/v1/hospital/profile"
      via: "React Query useQuery + useMutation"
      pattern: "hospital/profile"
    - from: "cms/apps/admin/src/app/api/v1/hospital/profile/route.ts"
      to: "prisma.hospital"
      via: "getSessionHospitalId() → prisma.hospital.update()"
      pattern: "getSessionHospitalId|prisma\\.hospital"
    - from: "cms/apps/admin/src/app/api/v1/hospital/profile/specialties/route.ts"
      to: "prisma.hospitalSpecialty + prisma.procedureCategory"
      via: "hospitalId 필터로 HospitalSpecialty CRUD"
      pattern: "prisma\\.hospitalSpecialty|prisma\\.procedureCategory"
---

<objective>
병원 사용자가 CMS에서 자신의 병원 프로필(기본정보·이미지·전문분야·소개)을 직접 편집하고 저장할 수 있다.

Purpose: 병원이 CMS에서 자체 정보를 관리하는 첫 번째 운영 기능 완성
Output:
- /hospital/profile 페이지 (기본정보 + 이미지 드래그앤드롭 + 전문분야 칩 + 소개)
- 3개 Route Handler (profile GET/PUT, images GET/PUT, specialties GET/POST/DELETE)
- React Query feature module
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md

<interfaces>
<!-- Phase 2에서 생성된 세션 헬퍼 및 Prisma 모델 계약. executor가 직접 사용한다. -->

From cms/apps/admin/src/lib/session.ts (Phase 2 에서 추가됨):
```typescript
export async function getSessionHospitalId(): Promise<bigint | null>
// role=hospital JWT payload의 hospitalId claim을 BigInt로 반환
// 반환값이 null이면 401 응답

export async function getSessionRole(): Promise<'admin' | 'hospital' | null>
```

From cms/packages/db/prisma/schema.prisma (관련 모델):
```prisma
model Hospital {
  id                  BigInt    @id @default(autoincrement())
  userId              BigInt    @unique @map("user_id")
  name                String    @db.VarChar(100)        // 읽기전용 — PUT 시 무시
  description         String?
  address             String?   @db.VarChar(300)
  phone               String?   @db.VarChar(20)
  operatingHours      String?   @map("operating_hours") @db.VarChar(200)
  profileImage        String?   @map("profile_image") @db.VarChar(500)
  detailedDescription String?   @map("detailed_description")  // 소개 2000자
  specialties         HospitalSpecialty[]
  // 갤러리 이미지 별도 테이블 없음 → hospital_procedure_details or images 테이블 확인
  // images 테이블: id, user_id, url, sort_order → Hospital.user와 조인해서 관리
}

model HospitalSpecialty {
  id         BigInt            @id @default(autoincrement())
  hospitalId BigInt            @map("hospital_id")
  categoryId Int               @map("category_id")
  category   ProcedureCategory @relation(...)
  hospital   Hospital          @relation(...)
  @@unique([hospitalId, categoryId])
  @@map("hospital_specialties")
}

model ProcedureCategory {
  id        Int    @id @default(autoincrement())
  name      String @db.VarChar(50)
  sortOrder Int?   @default(0) @map("sort_order")
}
```

이미지 갤러리 구현 방식:
- DB에 gallery 전용 테이블 없음
- Hospital.profileImage = 대표 이미지 1장 (URL string)
- 갤러리(최대 10장)는 images 테이블 (id, user_id, url) 활용하거나
  Hospital에 JSON 컬럼으로 저장
- **결정**: Hospital.detailedDescription 외에 gallery_images JSON 컬럼 또는
  hospital_images 가상 배열을 JSON 형태로 Hospital.description에 병합하지 말 것
- **실용적 접근**: images 테이블(user_id FK)은 유저 이미지용이므로 병원 갤러리는
  hospital_gallery_images 테이블이 없는 상태에서 임시로
  Hospital 모델에 `galleryImages String[] @map("gallery_images")`가 없으므로
  prisma.$queryRaw로 직접 SQL 조작하거나,
  **가장 단순한 접근**: images 테이블에 hospital 연결 컬럼 없음 →
  Hospital.description 컬럼을 덮어쓰지 말고
  HospitalGallery 를 hospital_procedure_details 의 image_url 배열로 처리하지 말고
  **최종 결정**: gallery_images는 Hospital 레코드에 JSON 문자열로 저장.
  `operatingHours` VarChar(200)에 넣지 말고,
  DB에 컬럼이 없다면 executor가 아래 SQL로 컬럼을 추가한다:
  ```sql
  ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS gallery_images TEXT DEFAULT '[]';
  ```
  Prisma에서는 `prisma.$queryRaw`로 읽고, `prisma.$executeRaw`로 쓴다.
  (schema.prisma에 반영하려면 `galleryImages String? @map("gallery_images")` 추가 후 `prisma generate`)

From cms/apps/admin/src/app/api/v1/admin/hospitals/route.ts (패턴):
```typescript
import { prisma } from '@letmein/db'
import { NextRequest, NextResponse } from 'next/server'
// getSessionHospitalId() 로 인증, null이면 401 반환
```

API 인증 패턴:
```typescript
// 모든 hospital Route Handler 공통
const hospitalId = await getSessionHospitalId()
if (!hospitalId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
```

React Query 패턴 (기존 features/ 코드 따름):
```typescript
// features/{name}/api.ts — raw fetch
// features/{name}/queries.ts — useQuery / useMutation
// features/{name}/index.ts — re-export
```

UI 규칙 (CLAUDE.md):
- Accordion/Collapsible 절대 사용 금지
- 드롭다운 절대 사용 금지 (전문분야 선택도 칩 목록으로)
- 드래그앤드롭: @dnd-kit/core + @dnd-kit/sortable 사용 (기존 패키지 확인 후 없으면 추가)
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: 프로필 API 3종 구현 (HPROF-01, HPROF-02, HPROF-03, HPROF-04)</name>
  <files>
    cms/apps/admin/src/app/api/v1/hospital/profile/route.ts,
    cms/apps/admin/src/app/api/v1/hospital/profile/images/route.ts,
    cms/apps/admin/src/app/api/v1/hospital/profile/specialties/route.ts,
    cms/packages/db/prisma/schema.prisma
  </files>
  <action>
    **schema.prisma 수정 (per HPROF-02):**
    Hospital 모델에 `galleryImages String? @map("gallery_images")` 필드 추가.
    이후 `cd cms && npx prisma generate --schema=packages/db/prisma/schema.prisma` 실행.
    DB 컬럼은 `prisma.$executeRaw\`ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS gallery_images TEXT DEFAULT '[]'\`` 로 추가한다
    (prisma db push 불가 환경 — STATE.md 결정 참조).

    **profile/route.ts — GET / PUT:**
    - GET: `getSessionHospitalId()` → null이면 401. `prisma.hospital.findUnique({ where: { id: hospitalId }, select: { id, name, description, address, phone, operatingHours, profileImage, detailedDescription, galleryImages } })`. name은 읽기전용으로 응답에 포함.
    - PUT: body에서 `{ address, phone, operatingHours, profileImage, detailedDescription }` 추출. name 필드가 body에 있어도 무시. `prisma.hospital.update({ where: { id: hospitalId }, data: { address, phone, operatingHours, profileImage, detailedDescription } })`.

    **profile/images/route.ts — GET / PUT:**
    - GET: `prisma.hospital.findUnique` → `galleryImages` 파싱 (`JSON.parse(galleryImages || '[]')`). 배열 형태 `{ images: string[] }` 반환.
    - PUT: body `{ images: string[] }` (최대 10장 — 초과 시 400). `JSON.stringify(images)` → `prisma.hospital.update({ data: { galleryImages: JSON.stringify(images) } })`.

    **profile/specialties/route.ts — GET / POST / DELETE:**
    - GET: `prisma.hospitalSpecialty.findMany({ where: { hospitalId }, include: { category: { select: { id, name } } } })`. 전체 카테고리도 함께 반환: `prisma.procedureCategory.findMany({ orderBy: { sortOrder: 'asc' } })`. 응답: `{ specialties: [...], allCategories: [...] }`.
    - POST: body `{ categoryId: number }`. `prisma.hospitalSpecialty.create({ data: { hospitalId, categoryId } })`. unique 충돌 시 409.
    - DELETE: body `{ categoryId: number }`. `prisma.hospitalSpecialty.delete({ where: { hospitalId_categoryId: { hospitalId, categoryId } } })`.
  </action>
  <verify>
    <automated>cd /Users/jeonminjun/claude/letmein/cms && npx tsc --noEmit -p apps/admin/tsconfig.json 2>&1 | head -30</automated>
  </verify>
  <done>3개 Route Handler 파일 타입오류 없이 컴파일됨. GET /api/v1/hospital/profile 호출 시 200 + Hospital 기본정보 반환. PUT 시 DB 반영 (name 제외). specialties GET 시 전문분야 + 전체 카테고리 반환.</done>
</task>

<task type="auto">
  <name>Task 2: 프로필 편집 UI + Feature module (HPROF-01~04)</name>
  <files>
    cms/apps/admin/src/features/hospital-portal/profile/api.ts,
    cms/apps/admin/src/features/hospital-portal/profile/queries.ts,
    cms/apps/admin/src/features/hospital-portal/profile/index.ts,
    cms/apps/admin/src/views/hospital/profile/HospitalProfileView.tsx,
    cms/apps/admin/src/app/(hospital)/(hospital-dashboard)/profile/page.tsx
  </files>
  <action>
    **feature module (api.ts + queries.ts + index.ts):**
    - `api.ts`: fetchProfile(), updateProfile(data), fetchImages(), updateImages(images: string[]), fetchSpecialties(), addSpecialty(categoryId), removeSpecialty(categoryId). 각각 fetch('/api/v1/hospital/profile/...') 패턴.
    - `queries.ts`: useProfileQuery(), useUpdateProfileMutation(), useImagesQuery(), useUpdateImagesMutation(), useSpecialtiesQuery(), useAddSpecialtyMutation(), useRemoveSpecialtyMutation(). React Query v5 패턴 — `useMutation({ mutationFn: ... })`.
    - `index.ts`: 모든 훅 re-export.

    **HospitalProfileView.tsx (`'use client'`):**
    화면을 4개 섹션으로 구성 (Accordion 금지 — 항상 펼쳐진 상태):

    1. **기본정보 섹션 (HPROF-01)**: 병원명(읽기전용 input, disabled 스타일), 주소, 전화번호, 영업시간 텍스트 필드. 저장 버튼 → useUpdateProfileMutation.

    2. **이미지 관리 섹션 (HPROF-02)**: @dnd-kit/sortable 사용. 대표 이미지(profileImage)를 첫 번째 아이템으로, 갤러리 이미지(galleryImages 배열) 순서대로 표시. 드래그 핸들 아이콘으로 순서 변경. 이미지 추가는 URL 입력 또는 파일 업로드(기존 이미지 업로드 패턴 활용). 삭제 버튼(× 아이콘). 저장 버튼 → useUpdateImagesMutation.
    최대 10장 초과 시 추가 버튼 비활성화.

    3. **전문분야 섹션 (HPROF-03)**: allCategories 전체를 칩 형태로 나열. 현재 hospital의 specialties에 포함된 칩은 선택(filled/highlighted) 상태, 미포함은 미선택(outlined) 상태. 칩 클릭 시 선택↔해제 (useAddSpecialtyMutation / useRemoveSpecialtyMutation 즉시 호출, 별도 저장 버튼 없음).

    4. **소개 섹션 (HPROF-04)**: detailedDescription textarea, maxLength=2000, 현재 글자 수 표시 (예: "123 / 2000"). 저장 버튼 → useUpdateProfileMutation.

    스타일: 기존 CMS admin 테마(dark, Tailwind) 유지. 각 섹션은 rounded border card로 분리. 섹션 헤더는 h2 텍스트.

    **page.tsx:**
    ```tsx
    import HospitalProfileView from '@/views/hospital/profile/HospitalProfileView'
    export default function HospitalProfilePage() {
      return <HospitalProfileView />
    }
    ```
    `export const metadata = { title: '병원 프로필 편집' }` 추가.
  </action>
  <verify>
    <automated>cd /Users/jeonminjun/claude/letmein/cms && npx tsc --noEmit -p apps/admin/tsconfig.json 2>&1 | head -30</automated>
  </verify>
  <done>
    /hospital/profile 페이지가 Next.js 빌드 오류 없이 존재함.
    기본정보 섹션에서 병원명 필드가 disabled로 표시됨.
    이미지 섹션에서 @dnd-kit/sortable DnD 핸들이 렌더링됨.
    전문분야 칩이 allCategories 수만큼 렌더링됨.
    소개 텍스트에 글자수 카운터(/ 2000) 표시됨.
  </done>
</task>

</tasks>

<verification>
1. `npx tsc --noEmit` 타입 오류 없음
2. GET /api/v1/hospital/profile → 200 + `{ id, name, address, phone, operatingHours, profileImage, detailedDescription, galleryImages }`
3. PUT /api/v1/hospital/profile with `{ name: "변경시도", address: "새주소" }` → 200, DB에서 name은 원래값 유지, address는 변경됨
4. GET /api/v1/hospital/profile/specialties → 200 + `{ specialties, allCategories }`
5. /hospital/profile 페이지 렌더링 시 콘솔 에러 없음
</verification>

<success_criteria>
- 병원 사용자가 /hospital/profile에서 주소·전화·영업시간·소개를 수정하고 저장하면 DB에 반영된다 (병원명은 항상 읽기전용)
- 이미지 섹션에서 최대 10장의 갤러리 이미지를 드래그앤드롭으로 순서 변경 후 저장 가능
- 전문분야 칩 클릭으로 즉시 추가/제거 가능
- 소개란 2,000자 제한 + 글자수 카운터 표시
</success_criteria>

<output>
완료 후 `.planning/phases/03-hospital-profile-consult/03-PLAN-1-SUMMARY.md` 생성
</output>
