---
phase: 03-hospital-profile-consult
plan: 3
type: execute
wave: 1
depends_on: []
files_modified:
  - cms/apps/admin/src/app/api/v1/hospital/consultations/route.ts
  - cms/apps/admin/src/app/api/v1/hospital/consultations/[id]/respond/route.ts
  - cms/apps/admin/src/app/(hospital)/(hospital-dashboard)/consultations/page.tsx
  - cms/apps/admin/src/views/hospital/consultations/HospitalConsultationsView.tsx
  - cms/apps/admin/src/features/hospital-portal/consultations/api.ts
  - cms/apps/admin/src/features/hospital-portal/consultations/queries.ts
  - cms/apps/admin/src/features/hospital-portal/consultations/index.ts
autonomous: true
requirements:
  - HCONS-01
  - HCONS-02
  - HCONS-03
  - HCONS-04

must_haves:
  truths:
    - "병원에 매칭된 상담 요청 목록을 전체/대기/응답완료 탭으로 필터링해서 볼 수 있다"
    - "목록에서 요청을 클릭하면 카테고리, 부위, 시기, 사진, 메모 상세를 확인할 수 있다"
    - "대기 상태 요청에 소개(최대 60자)·경험(최대 60자)·메시지(10~3000자)로 응답을 작성해 발송할 수 있다"
    - "응답 발송 후 해당 요청 상태가 '응답완료'로 변경된다"
  artifacts:
    - path: "cms/apps/admin/src/app/api/v1/hospital/consultations/route.ts"
      provides: "GET — CoordinatorMatch 기반 매칭 목록 조회 (상태 필터 + 상세 포함)"
      exports: ["GET"]
    - path: "cms/apps/admin/src/app/api/v1/hospital/consultations/[id]/respond/route.ts"
      provides: "POST — 상담 응답 작성 + consultation_responses 레코드 생성"
      exports: ["POST"]
    - path: "cms/apps/admin/src/views/hospital/consultations/HospitalConsultationsView.tsx"
      provides: "상담 목록 탭 + 선택한 요청 상세 + 응답 작성 폼 UI"
    - path: "cms/apps/admin/src/app/(hospital)/(hospital-dashboard)/consultations/page.tsx"
      provides: "라우트 /hospital/consultations"
  key_links:
    - from: "cms/apps/admin/src/views/hospital/consultations/HospitalConsultationsView.tsx"
      to: "/api/v1/hospital/consultations"
      via: "React Query useQuery (상태 파라미터로 탭 전환)"
      pattern: "hospital/consultations"
    - from: "cms/apps/admin/src/app/api/v1/hospital/consultations/route.ts"
      to: "prisma.coordinatorMatch + prisma.consultationRequest"
      via: "coordinatorMatch WHERE hospitalId → include consultation_request details"
      pattern: "coordinatorMatch|consultationRequest"
    - from: "cms/apps/admin/src/app/api/v1/hospital/consultations/[id]/respond/route.ts"
      to: "prisma.consultation_responses"
      via: "POST 발송 → consultation_responses 레코드 생성 (upsert)"
      pattern: "consultation_responses|respond"
---

<objective>
병원 사용자가 자신에게 매칭된 상담 요청을 탭으로 필터링하고, 상세를 확인하고, 응답(소개·경험·메시지)을 작성해 발송할 수 있다.

Purpose: 병원의 핵심 일상 업무인 상담 응답 플로우 완성
Output:
- /hospital/consultations 페이지 (탭 필터 + 상세 + 응답 폼)
- 2개 Route Handler (consultations GET, consultations/[id]/respond POST)
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
<!-- Phase 2 세션 헬퍼 및 상담 관련 Prisma 모델 계약 -->

From cms/apps/admin/src/lib/session.ts (Phase 2 에서 추가됨):
```typescript
export async function getSessionHospitalId(): Promise<bigint | null>
// role=hospital JWT의 hospitalId claim. null이면 401.
```

From cms/packages/db/prisma/schema.prisma (상담 관련 모델):
```prisma
model CoordinatorMatch {
  id         BigInt              @id @default(autoincrement())
  requestId  BigInt              @map("request_id")
  hospitalId BigInt              @map("hospital_id")
  matchedBy  BigInt              @map("matched_by")
  note       String?
  status     String?             @default("matched") @db.VarChar(20)
  createdAt  DateTime?           @default(now()) @map("created_at")
  hospital   Hospital
  request    ConsultationRequest
  @@unique([requestId, hospitalId])
  @@map("coordinator_matches")
}

model ConsultationRequest {
  id               BigInt   @id @default(autoincrement())
  userId           BigInt   @map("user_id")
  categoryId       Int      @map("category_id")
  description      String
  preferredPeriod  String?  @map("preferred_period") @db.VarChar(30)
  photoPublic      Boolean? @default(true) @map("photo_public")
  status           String?  @default("active") @db.VarChar(20)
  expiresAt        DateTime @map("expires_at")
  createdAt        DateTime @default(now()) @map("created_at")
  coordinatorNote  String?  @map("coordinator_note")
  // 상세 연결
  procedure_categories     ProcedureCategory
  consultation_request_details consultation_request_details[]
  consultation_responses   consultation_responses[]
  @@map("consultation_requests")
}

model consultation_request_details {
  // 시술 부위 상세 (ProcedureDetail FK)
  // consultation_requests 관계
}

model consultation_responses {
  id              BigInt    @id @default(autoincrement())
  request_id      BigInt
  hospital_id     BigInt
  intro           String?   @db.VarChar(60)    // 소개 최대 60자
  experience      String?   @db.VarChar(60)    // 경험 최대 60자
  message         String                        // 메시지 10~3000자
  consult_methods String?   @db.VarChar(100)
  consult_hours   String?   @db.VarChar(100)
  status          String?   @default("sent") @db.VarChar(20)
  created_at      DateTime? @default(now())
  hospitals       Hospital
  consultation_requests ConsultationRequest
  @@unique([request_id, hospital_id])
}
```

상담 목록 조회 전략:
- 병원에 매칭된 요청 = CoordinatorMatch WHERE hospitalId = 내 hospitalId
- 각 매치의 request_id로 ConsultationRequest 조인
- 응답 여부 확인: consultation_responses WHERE request_id = X AND hospital_id = 내 hospitalId 존재 여부
- "대기" = response 없음, "응답완료" = response 존재

탭 상태 정의:
- `all`: 전체 매칭 목록
- `pending`: consultation_responses 없는 것
- `responded`: consultation_responses 있는 것

사진 표시:
- photoPublic=true인 경우 상담 요청에 첨부된 이미지 표시
- consultation_request_details에 직접 이미지가 없으면 description 내용에서 파악
- 실제 이미지는 images 테이블에 있을 수 있음 — consultation_requests 조회 시 user.images로 조인 시도, 없으면 빈 배열

UI 규칙:
- Accordion/드롭다운 절대 사용 금지
- 탭: 텍스트 탭 버튼 (전체|대기|응답완료), 기존 CMS 탭 패턴 사용
- 상세: 목록 아이템 클릭 시 우측 패널(split view) 또는 동일 페이지 하단에 상세+폼 표시. Accordion 아님.
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: 상담 목록 조회 + 응답 발송 API (HCONS-01, HCONS-02, HCONS-03, HCONS-04)</name>
  <files>
    cms/apps/admin/src/app/api/v1/hospital/consultations/route.ts,
    cms/apps/admin/src/app/api/v1/hospital/consultations/[id]/respond/route.ts
  </files>
  <action>
    **consultations/route.ts — GET:**
    인증: `getSessionHospitalId()` → null이면 401.
    쿼리 파라미터: `status` (all | pending | responded, 기본 all).

    CoordinatorMatch + ConsultationRequest 조인으로 목록 조회:
    ```typescript
    const matches = await prisma.coordinatorMatch.findMany({
      where: { hospitalId },
      include: {
        request: {
          include: {
            procedure_categories: { select: { id: true, name: true } },
            consultation_request_details: {
              include: { procedure_details: { select: { id: true, name: true } } }
            },
            consultation_responses: {
              where: { hospital_id: hospitalId },
              select: { id: true, status: true, created_at: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    ```

    각 match에서 `responded = match.request.consultation_responses.length > 0` 계산.

    status 필터 적용:
    - `pending`: responded === false
    - `responded`: responded === true
    - `all`: 필터 없음

    응답 구조:
    ```typescript
    {
      consultations: [
        {
          matchId: number,
          requestId: number,
          status: 'pending' | 'responded',
          createdAt: string,
          category: { id, name },
          description: string,
          preferredPeriod: string | null,
          photoPublic: boolean,
          details: [{ id, name }],    // 부위 상세
          coordinatorNote: string | null,
          response: { id, status, created_at } | null
        }
      ]
    }
    ```

    **consultations/[id]/respond/route.ts — POST:**
    `[id]` = consultationRequest.id.
    인증: `getSessionHospitalId()` → null이면 401.
    body: `{ intro?: string, experience?: string, message: string }`.

    검증:
    - message 없거나 길이 < 10 → 400 `{ error: "메시지는 10자 이상 입력해주세요" }`
    - message 길이 > 3000 → 400 `{ error: "메시지는 3,000자 이하로 입력해주세요" }`
    - intro 길이 > 60 → 400
    - experience 길이 > 60 → 400

    CoordinatorMatch 존재 확인:
    ```typescript
    const match = await prisma.coordinatorMatch.findUnique({
      where: { requestId_hospitalId: { requestId: BigInt(id), hospitalId } }
    })
    if (!match) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    ```

    응답 생성 (upsert — 재발송 방지):
    ```typescript
    const response = await prisma.consultation_responses.upsert({
      where: { request_id_hospital_id: { request_id: BigInt(id), hospital_id: hospitalId } },
      create: { request_id: BigInt(id), hospital_id: hospitalId, intro, experience, message, status: 'sent' },
      update: { intro, experience, message, status: 'sent' }
    })
    ```

    201 응답: `{ response }`.
  </action>
  <verify>
    <automated>cd /Users/jeonminjun/claude/letmein/cms && npx tsc --noEmit -p apps/admin/tsconfig.json 2>&1 | head -30</automated>
  </verify>
  <done>두 Route Handler 파일 타입 오류 없음. GET /api/v1/hospital/consultations?status=pending → 200 + consultations 배열. POST /api/v1/hospital/consultations/1/respond `{ message: "안녕하세요..." }` → 201.</done>
</task>

<task type="auto">
  <name>Task 2: 상담 목록 + 상세 + 응답 UI (HCONS-01~04)</name>
  <files>
    cms/apps/admin/src/features/hospital-portal/consultations/api.ts,
    cms/apps/admin/src/features/hospital-portal/consultations/queries.ts,
    cms/apps/admin/src/features/hospital-portal/consultations/index.ts,
    cms/apps/admin/src/views/hospital/consultations/HospitalConsultationsView.tsx,
    cms/apps/admin/src/app/(hospital)/(hospital-dashboard)/consultations/page.tsx
  </files>
  <action>
    **feature module:**
    - `api.ts`: fetchConsultations(status?: 'all' | 'pending' | 'responded'), respondToConsultation(requestId: number, data: { intro?, experience?, message })
    - `queries.ts`:
      ```typescript
      useConsultationsQuery(status: 'all' | 'pending' | 'responded')
      // queryKey: ['hospital', 'consultations', status]
      useRespondToConsultationMutation()
      // onSuccess: invalidateQueries(['hospital', 'consultations'])
      ```
    - `index.ts`: re-export

    **HospitalConsultationsView.tsx (`'use client'`):**

    레이아웃: 좌우 split (md 이상) 또는 모바일에서 스택 레이아웃.
    - 좌측: 탭 필터 + 목록
    - 우측: 선택한 요청 상세 + 응답 폼

    **탭 섹션 (HCONS-01):**
    탭 버튼 3개: "전체", "대기", "응답완료" (Accordion 없음, 탭 클릭으로 상태 전환).
    현재 선택 탭에 맞는 useConsultationsQuery 호출.

    **목록 아이템:**
    각 아이템: 카테고리명, 날짜, 상태 배지(대기=주황, 응답완료=녹색), 설명 미리보기 1줄.
    클릭 시 selectedConsultation 상태 업데이트 → 우측 패널에 상세 표시.

    **상세 패널 (HCONS-02):**
    선택된 상담 요청:
    - 카테고리명
    - 부위 상세 (details 배열을 칩 형태로 나열)
    - 시기 (preferredPeriod)
    - 상담 내용 (description)
    - 코디네이터 메모 (coordinatorNote, 있을 경우)
    - 사진: photoPublic=true이면 "사진 공개" 배지 표시 (실제 이미지 URL이 없으면 배지만)
    - 이미 응답이 있는 경우: "이미 응답을 발송했습니다" 안내 텍스트 + 응답일시 표시

    **응답 작성 폼 (HCONS-03):**
    status==='responded'인 경우 폼 숨김(읽기전용 상태 표시).
    status==='pending'인 경우:
    - intro: 텍스트 input, maxLength=60, 글자수 카운터 (예: "12 / 60")
    - experience: 텍스트 input, maxLength=60, 글자수 카운터
    - message: textarea, minLength=10, maxLength=3000, 글자수 카운터
    - "응답 발송" 버튼 → useRespondToConsultationMutation 호출
    - 발송 중 버튼 로딩 상태
    - 성공 시 (HCONS-04): 목록 갱신, 상태 배지 "응답완료"로 변경, 폼 숨김

    클라이언트 검증:
    - message.length < 10 시 버튼 비활성화
    - 에러 발생 시 toast 또는 인라인 에러 텍스트

    **page.tsx:**
    ```tsx
    import HospitalConsultationsView from '@/views/hospital/consultations/HospitalConsultationsView'
    export default function HospitalConsultationsPage() {
      return <HospitalConsultationsView />
    }
    ```
  </action>
  <verify>
    <automated>cd /Users/jeonminjun/claude/letmein/cms && npx tsc --noEmit -p apps/admin/tsconfig.json 2>&1 | head -30</automated>
  </verify>
  <done>
    /hospital/consultations 페이지 타입 오류 없이 빌드됨.
    탭 3개("전체", "대기", "응답완료")가 항상 펼쳐진 상태로 렌더링됨.
    응답 폼에 intro(60자), experience(60자), message(3000자) 카운터가 표시됨.
    message 길이 < 10 이면 "응답 발송" 버튼이 비활성화됨.
    응답 발송 성공 후 consultations 쿼리가 invalidate됨.
  </done>
</task>

</tasks>

<verification>
1. `npx tsc --noEmit` 오류 없음
2. GET /api/v1/hospital/consultations → 200 + `{ consultations: [...] }`
3. GET /api/v1/hospital/consultations?status=pending → 200, 모두 response=null
4. POST /api/v1/hospital/consultations/1/respond `{ message: "감사합니다. 저희 병원은..." }` (10자+) → 201
5. POST 동일 requestId 재발송 → 200 (upsert, 오류 없음)
6. message 9자 이하 POST → 400 + 에러 메시지
7. /hospital/consultations 페이지에서 Accordion 없음, 탭 클릭으로 목록 전환 확인
</verification>

<success_criteria>
- 병원 사용자가 전체/대기/응답완료 탭으로 상담 요청을 필터링할 수 있음
- 요청 클릭 시 카테고리·부위·시기·메모를 확인할 수 있음
- 소개(60자)·경험(60자)·메시지(10~3000자) 응답을 발송할 수 있음
- 응답 발송 후 해당 요청이 즉시 "응답완료" 상태로 표시됨
- Accordion/드롭다운 없이 탭+패널 구조로 UI 구성됨
</success_criteria>

<output>
완료 후 `.planning/phases/03-hospital-profile-consult/03-PLAN-3-SUMMARY.md` 생성
</output>
