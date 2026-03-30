---
phase: 03-hospital-profile-consult
plan: 2
type: execute
wave: 1
depends_on: []
files_modified:
  - cms/apps/admin/src/app/api/v1/hospital/doctors/route.ts
  - cms/apps/admin/src/app/api/v1/hospital/doctors/[id]/route.ts
  - cms/apps/admin/src/app/(hospital)/(hospital-dashboard)/doctors/page.tsx
  - cms/apps/admin/src/views/hospital/doctors/HospitalDoctorsView.tsx
  - cms/apps/admin/src/features/hospital-portal/doctors/api.ts
  - cms/apps/admin/src/features/hospital-portal/doctors/queries.ts
  - cms/apps/admin/src/features/hospital-portal/doctors/index.ts
autonomous: true
requirements:
  - HDOC-01
  - HDOC-02
  - HDOC-03
  - HDOC-04

must_haves:
  truths:
    - "의료진 목록이 sortOrder 순서대로 표시된다"
    - "의료진을 추가(이름·전문분야·경력)하면 목록에 즉시 반영된다"
    - "의료진 정보를 수정하거나 삭제할 수 있다"
    - "의료진 카드를 드래그앤드롭으로 순서를 바꾸고 저장하면 DB의 sortOrder가 변경된다"
  artifacts:
    - path: "cms/apps/admin/src/app/api/v1/hospital/doctors/route.ts"
      provides: "GET 목록 조회, POST 추가"
      exports: ["GET", "POST"]
    - path: "cms/apps/admin/src/app/api/v1/hospital/doctors/[id]/route.ts"
      provides: "PUT 수정, DELETE 삭제, PATCH 순서 일괄 저장"
      exports: ["PUT", "DELETE", "PATCH"]
    - path: "cms/apps/admin/src/views/hospital/doctors/HospitalDoctorsView.tsx"
      provides: "의료진 목록 + 인라인 추가/수정 폼 + DnD 정렬 UI"
    - path: "cms/apps/admin/src/app/(hospital)/(hospital-dashboard)/doctors/page.tsx"
      provides: "라우트 /hospital/doctors"
  key_links:
    - from: "cms/apps/admin/src/views/hospital/doctors/HospitalDoctorsView.tsx"
      to: "/api/v1/hospital/doctors"
      via: "React Query useQuery + useMutation"
      pattern: "hospital/doctors"
    - from: "cms/apps/admin/src/app/api/v1/hospital/doctors/route.ts"
      to: "prisma.hospitalDoctor"
      via: "getSessionHospitalId() → prisma.hospitalDoctor CRUD"
      pattern: "getSessionHospitalId|prisma\\.hospitalDoctor"
    - from: "HospitalDoctorsView DnD sortOrder 저장"
      to: "/api/v1/hospital/doctors/[id] PATCH"
      via: "onDragEnd → PATCH /api/v1/hospital/doctors/order with [{ id, sortOrder }]"
      pattern: "sortOrder|doctors/order"
---

<objective>
병원 사용자가 CMS에서 소속 의료진을 추가·수정·삭제하고, 드래그앤드롭으로 표시 순서를 조정할 수 있다.

Purpose: 병원 프로필의 핵심 신뢰 지표인 의료진 정보를 병원이 직접 관리
Output:
- /hospital/doctors 페이지 (목록 + 인라인 폼 + DnD)
- 2개 Route Handler (doctors/, doctors/[id])
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
<!-- Phase 2 세션 헬퍼 및 HospitalDoctor Prisma 모델 계약 -->

From cms/apps/admin/src/lib/session.ts (Phase 2 에서 추가됨):
```typescript
export async function getSessionHospitalId(): Promise<bigint | null>
// role=hospital JWT의 hospitalId claim → BigInt. null이면 401.
```

From cms/packages/db/prisma/schema.prisma:
```prisma
model HospitalDoctor {
  id           BigInt    @id @default(autoincrement())
  hospitalId   BigInt    @map("hospital_id")
  name         String    @db.VarChar(50)
  title        String?   @db.VarChar(100)    // 전문분야/직함
  experience   String?                        // 경력 (text)
  profileImage String?   @map("profile_image") @db.VarChar(500)
  sortOrder    Int?      @default(0) @map("sort_order")
  createdAt    DateTime? @default(now()) @map("created_at") @db.Timestamptz(6)
  hospital     Hospital  @relation(fields: [hospitalId], references: [id])

  @@index([hospitalId], map: "idx_hospital_doctors_hospital")
  @@map("hospital_doctors")
}
```

API 인증 패턴 (Plan 1과 동일):
```typescript
const hospitalId = await getSessionHospitalId()
if (!hospitalId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
```

순서 저장 엔드포인트 설계:
- PATCH /api/v1/hospital/doctors/[id]를 재사용하지 않고
- 별도 POST /api/v1/hospital/doctors/order 또는 PATCH /api/v1/hospital/doctors/order 사용
- body: `{ orders: [{ id: number, sortOrder: number }] }`
- 각 id가 현재 병원 소속인지 검증 후 `prisma.hospitalDoctor.update` 반복 또는 `prisma.$transaction`

UI 규칙:
- Accordion/Collapsible 절대 사용 금지 — 추가 폼은 항상 표시되거나 별도 섹션
- DnD: @dnd-kit/core + @dnd-kit/sortable (Plan 1에서 이미 설치)
- 드롭다운(select) 없음 — 전문분야(title)는 자유 텍스트 input
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: 의료진 CRUD + 순서 API (HDOC-01, HDOC-02, HDOC-03, HDOC-04)</name>
  <files>
    cms/apps/admin/src/app/api/v1/hospital/doctors/route.ts,
    cms/apps/admin/src/app/api/v1/hospital/doctors/[id]/route.ts
  </files>
  <action>
    **doctors/route.ts — GET / POST:**
    - GET: `getSessionHospitalId()` 인증. `prisma.hospitalDoctor.findMany({ where: { hospitalId }, orderBy: { sortOrder: 'asc' } })`. 응답: `{ doctors: HospitalDoctor[] }`.
    - POST: body `{ name, title?, experience?, profileImage? }`. name 필수(없으면 400). `prisma.hospitalDoctor.create({ data: { hospitalId, name, title, experience, profileImage, sortOrder: (현재 최대 sortOrder + 1) } })`. 최대 sortOrder 계산: `prisma.hospitalDoctor.aggregate({ where: { hospitalId }, _max: { sortOrder: true } })`.

    **doctors/[id]/route.ts — PUT / DELETE / PATCH(순서 일괄):**
    - PUT: body `{ name?, title?, experience?, profileImage? }`. id 파라미터 파싱 (BigInt). 소속 병원 확인(`prisma.hospitalDoctor.findFirst({ where: { id, hospitalId } })`, 없으면 404). `prisma.hospitalDoctor.update(...)`.
    - DELETE: 소속 병원 확인 후 `prisma.hospitalDoctor.delete(...)`.
    - PATCH: `[id]` 경로에서 id가 `"order"`인 경우 순서 일괄 저장으로 처리. body `{ orders: [{ id: number, sortOrder: number }] }`. 각 아이템의 hospital_id가 현재 hospitalId인지 확인 후 `prisma.$transaction(orders.map(o => prisma.hospitalDoctor.update({ where: { id: BigInt(o.id) }, data: { sortOrder: o.sortOrder } })))`.

    ID 파싱 패턴:
    ```typescript
    const id = params.id  // string
    if (id === 'order') {
      // 순서 저장 처리
    } else {
      const doctorId = BigInt(id)  // 개별 의사 조작
    }
    ```
  </action>
  <verify>
    <automated>cd /Users/jeonminjun/claude/letmein/cms && npx tsc --noEmit -p apps/admin/tsconfig.json 2>&1 | head -30</automated>
  </verify>
  <done>doctors/route.ts, doctors/[id]/route.ts 타입 오류 없음. GET /api/v1/hospital/doctors → 200 + 목록. POST → 201 + 생성된 의사. PUT /[id] → 200 수정. DELETE /[id] → 204. PATCH /order → 200 순서 저장.</done>
</task>

<task type="auto">
  <name>Task 2: 의료진 관리 UI + Feature module (HDOC-01~04)</name>
  <files>
    cms/apps/admin/src/features/hospital-portal/doctors/api.ts,
    cms/apps/admin/src/features/hospital-portal/doctors/queries.ts,
    cms/apps/admin/src/features/hospital-portal/doctors/index.ts,
    cms/apps/admin/src/views/hospital/doctors/HospitalDoctorsView.tsx,
    cms/apps/admin/src/app/(hospital)/(hospital-dashboard)/doctors/page.tsx
  </files>
  <action>
    **feature module:**
    - `api.ts`: fetchDoctors(), createDoctor(data), updateDoctor(id, data), deleteDoctor(id), updateDoctorOrder(orders: {id:number, sortOrder:number}[])
    - `queries.ts`: useDoctorsQuery(), useCreateDoctorMutation(), useUpdateDoctorMutation(), useDeleteDoctorMutation(), useUpdateDoctorOrderMutation()
    - `index.ts`: 모든 훅 re-export

    **HospitalDoctorsView.tsx (`'use client'`):**

    레이아웃:
    - 상단: "의료진 추가" 섹션 — name(필수), title(선택), experience(선택) 입력 + "추가" 버튼. Accordion 없이 항상 표시.
    - 하단: 의료진 목록 (DnD 정렬 가능)

    의료진 목록 (HDOC-01, HDOC-04):
    - @dnd-kit/sortable `SortableContext` + `useSortable` 사용
    - 각 의사 카드: 드래그 핸들(⠿ 아이콘), 이름, title, experience 한 줄 미리보기
    - 카드 우측: "수정" 버튼 + "삭제" 버튼
    - 순서 변경 후 자동 저장(onDragEnd 후 useUpdateDoctorOrderMutation 호출)

    수정 모드:
    - "수정" 클릭 시 해당 카드가 인라인 편집 모드로 전환 (Accordion 아님 — 카드 자체가 form으로 변환)
    - 수정 완료/취소 버튼

    추가 폼 (HDOC-02):
    - 필수 입력 name 없이 "추가" 클릭 시 오류 텍스트 표시
    - 추가 성공 시 폼 초기화 + 목록 갱신(React Query invalidateQueries)

    삭제 (HDOC-03):
    - "삭제" 클릭 시 window.confirm으로 확인 후 useDeleteDoctorMutation 호출

    **page.tsx:**
    ```tsx
    import HospitalDoctorsView from '@/views/hospital/doctors/HospitalDoctorsView'
    export default function HospitalDoctorsPage() {
      return <HospitalDoctorsView />
    }
    ```
  </action>
  <verify>
    <automated>cd /Users/jeonminjun/claude/letmein/cms && npx tsc --noEmit -p apps/admin/tsconfig.json 2>&1 | head -30</automated>
  </verify>
  <done>
    /hospital/doctors 페이지 타입 오류 없이 빌드됨.
    의료진 추가 폼이 항상 펼쳐진 상태로 표시됨 (Accordion 없음).
    DnD 핸들이 각 카드에 렌더링됨.
    수정 버튼 클릭 시 카드가 인라인 폼으로 전환됨.
  </done>
</task>

</tasks>

<verification>
1. `npx tsc --noEmit` 오류 없음
2. GET /api/v1/hospital/doctors → `{ doctors: [] }` (빈 병원도 200)
3. POST /api/v1/hospital/doctors `{ name: "김철수", title: "성형외과 전문의" }` → 201 + `{ id, name, sortOrder: 1 }`
4. PATCH /api/v1/hospital/doctors/order `{ orders: [{ id: 1, sortOrder: 0 }, { id: 2, sortOrder: 1 }] }` → 200
5. /hospital/doctors 페이지에서 Accordion 컴포넌트 미사용 확인
</verification>

<success_criteria>
- 의료진 목록이 sortOrder 순으로 표시됨
- 추가/수정/삭제 각각 즉시 목록 갱신
- DnD로 순서 변경 후 자동 저장, DB의 sortOrder 반영됨
- Accordion/드롭다운 없이 전체 UI 구성됨
</success_criteria>

<output>
완료 후 `.planning/phases/03-hospital-profile-consult/03-PLAN-2-SUMMARY.md` 생성
</output>
