---
phase: 04-hospital-chat-ads
plan: 2
type: execute
wave: 1
depends_on: []
files_modified:
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
autonomous: true
requirements:
  - HAD-01
  - HAD-02
  - HAD-03
  - HAD-04
  - HAD-05

must_haves:
  truths:
    - "광고 크레딧 잔액을 숫자로 확인할 수 있다"
    - "이미지 URL + 헤드라인으로 크리에이티브를 등록할 수 있다"
    - "기간/일예산/크리에이티브를 선택해 캠페인을 생성할 수 있다"
    - "캠페인 목록에서 각 캠페인의 노출/클릭/소비 수치를 확인할 수 있다"
    - "실행 중인 캠페인을 일시정지하고 일시정지된 캠페인을 재개할 수 있다"
  artifacts:
    - path: "cms/apps/admin/src/app/api/v1/hospital/ads/credit/route.ts"
      provides: "GET — 광고 크레딧 잔액 (Go GET /api/v1/ads/credit 프록시)"
      exports: ["GET"]
    - path: "cms/apps/admin/src/app/api/v1/hospital/ads/creatives/route.ts"
      provides: "GET/POST — 크리에이티브 목록/등록 (Go 프록시)"
      exports: ["GET", "POST"]
    - path: "cms/apps/admin/src/app/api/v1/hospital/ads/campaigns/route.ts"
      provides: "GET/POST — 캠페인 목록/생성 (Go 프록시)"
      exports: ["GET", "POST"]
    - path: "cms/apps/admin/src/app/api/v1/hospital/ads/campaigns/[id]/report/route.ts"
      provides: "GET — 캠페인 성과 리포트 (Go GET /api/v1/ads/campaigns/:id/report 프록시)"
      exports: ["GET"]
    - path: "cms/apps/admin/src/app/api/v1/hospital/ads/campaigns/[id]/pause/route.ts"
      provides: "PATCH — 캠페인 일시정지/재개 (Go PATCH /api/v1/ads/campaigns/:id/pause 프록시)"
      exports: ["PATCH"]
    - path: "cms/apps/admin/src/features/hospital-ads/api.ts"
      provides: "fetch 함수 — fetchCredit, fetchCreatives, createCreative, fetchCampaigns, createCampaign, fetchCampaignReport, toggleCampaignPause"
    - path: "cms/apps/admin/src/views/hospital/ads/HospitalAdsView.tsx"
      provides: "광고 관리 전체 UI — 크레딧 + 크리에이티브 + 캠페인 탭 구조"
  key_links:
    - from: "cms/apps/admin/src/views/hospital/ads/HospitalAdsView.tsx"
      to: "/api/v1/hospital/ads/credit"
      via: "useAdCredit() 훅 → fetchCredit fetch"
      pattern: "fetchCredit|useAdCredit"
    - from: "cms/apps/admin/src/app/api/v1/hospital/ads/campaigns/[id]/pause/route.ts"
      to: "Go PATCH /api/v1/ads/campaigns/:id/pause"
      via: "hospitalJwt 첨부 프록시"
      pattern: "ads/campaigns.*pause"
    - from: "cms/apps/admin/src/views/hospital/ads/HospitalAdsView.tsx"
      to: "캠페인 성과 리포트"
      via: "캠페인 행 클릭 → useCampaignReport(id) 훅 → inline 리포트 표시"
      pattern: "useCampaignReport|fetchCampaignReport"
---

<objective>
병원 사용자가 CMS에서 광고 크레딧을 확인하고, 크리에이티브를 등록하고, 캠페인을 생성·관리하고, 성과 리포트를 보고, 일시정지/재개를 할 수 있는 광고 관리 기능을 구현한다.

Purpose: 병원 비즈니스 루프 완성 — HAD-01~05 전부 커버
Output:
- 광고 관리 페이지 (/hospital/ads) — 탭 3개: 크레딧/크리에이티브/캠페인
- Next.js Route Handler 5개 (Go 서버 프록시)
- hospital-ads feature module
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/codebase/STRUCTURE.md

<interfaces>
<!-- Go 서버 병원 광고 API (hospitalOnly 미들웨어 적용, Authorization: Bearer {hospitalJwt} 필요) -->

GET  /api/v1/ads/credit
  Response: { credit: AdCredit }
  AdCredit { id, hospital_id, balance, updated_at }

GET  /api/v1/ads/creatives?page&limit
  Response: { creatives: AdCreative[], total, page, limit, hasNext }
  AdCreative { id, hospital_id, imageUrl, headline, reviewStatus: "pending"|"approved"|"rejected", createdAt }

POST /api/v1/ads/creatives
  Body: { imageUrl: string, headline: string }
  Response: { creative: AdCreative }

GET  /api/v1/ads/campaigns?page&limit&status
  Response: { campaigns: AdCampaign[], total, page, limit, hasNext }
  AdCampaign { id, hospital_id, creativeId, startDate, endDate, dailyBudget, status: "active"|"paused"|"ended", createdAt }

POST /api/v1/ads/campaigns
  Body: { creativeId: number, startDate: string, endDate: string, dailyBudget: number }
  Response: { campaign: AdCampaign }

PATCH /api/v1/ads/campaigns/:id/pause
  Body: {} (toggle — active → paused, paused → active)
  Response: { campaign: AdCampaign }

GET  /api/v1/ads/campaigns/:id/report
  Response: { report: AdPerformanceReport }
  AdPerformanceReport { campaignId, totalImpressions, totalClicks, totalSpend, ctr, daily: AdImpressionDaily[] }
  AdImpressionDaily { date, impressions, clicks, spend }

<!-- CMS 세션에서 hospitalJwt 추출 방법 (Phase 2/3 패턴) -->
<!-- getSession() → session.hospitalJwt → Authorization: Bearer {hospitalJwt} -->
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: 광고 Route Handler 5개 + feature module</name>
  <files>
    cms/apps/admin/src/app/api/v1/hospital/ads/credit/route.ts,
    cms/apps/admin/src/app/api/v1/hospital/ads/creatives/route.ts,
    cms/apps/admin/src/app/api/v1/hospital/ads/campaigns/route.ts,
    cms/apps/admin/src/app/api/v1/hospital/ads/campaigns/[id]/report/route.ts,
    cms/apps/admin/src/app/api/v1/hospital/ads/campaigns/[id]/pause/route.ts,
    cms/apps/admin/src/features/hospital-ads/api.ts,
    cms/apps/admin/src/features/hospital-ads/queries.ts,
    cms/apps/admin/src/features/hospital-ads/index.ts
  </files>
  <action>
    Go 서버 광고 API를 CMS에서 호출할 수 있도록 Route Handler 5개와 feature module을 생성한다.

    **Route Handler 패턴 (Phase 2/3과 동일):**
    - `getSession()` → `session.hospitalJwt` 없으면 `Response.json({error:'Unauthorized'}, {status:401})`
    - Go 서버 URL: `process.env.NEXT_PUBLIC_API_URL` (또는 서버사이드는 `process.env.API_URL`)
    - Go 응답 status code 그대로 반환

    **Route Handler 1: `ads/credit/route.ts`**
    - `GET`: Go `GET /api/v1/ads/credit` 프록시

    **Route Handler 2: `ads/creatives/route.ts`**
    - `GET`: query params(`page`, `limit`) 전달 → Go `GET /api/v1/ads/creatives` 프록시
    - `POST`: Body(`imageUrl`, `headline`) → Go `POST /api/v1/ads/creatives` 프록시

    **Route Handler 3: `ads/campaigns/route.ts`**
    - `GET`: query params(`page`, `limit`, `status`) → Go `GET /api/v1/ads/campaigns` 프록시
    - `POST`: Body(`creativeId`, `startDate`, `endDate`, `dailyBudget`) → Go `POST /api/v1/ads/campaigns` 프록시

    **Route Handler 4: `ads/campaigns/[id]/report/route.ts`**
    - `GET`: Go `GET /api/v1/ads/campaigns/:id/report` 프록시

    **Route Handler 5: `ads/campaigns/[id]/pause/route.ts`**
    - `PATCH`: Body `{}` → Go `PATCH /api/v1/ads/campaigns/:id/pause` 프록시

    **feature module (`features/hospital-ads/api.ts`):**
    ```typescript
    export async function fetchCredit(): Promise<AdCredit>
    export async function fetchCreatives(params?: { page?: number; limit?: number }): Promise<{ creatives: AdCreative[]; total: number }>
    export async function createCreative(imageUrl: string, headline: string): Promise<AdCreative>
    export async function fetchCampaigns(params?: { page?: number; limit?: number; status?: string }): Promise<{ campaigns: AdCampaign[]; total: number }>
    export async function createCampaign(data: { creativeId: number; startDate: string; endDate: string; dailyBudget: number }): Promise<AdCampaign>
    export async function fetchCampaignReport(id: number): Promise<AdPerformanceReport>
    export async function toggleCampaignPause(id: number): Promise<AdCampaign>
    ```

    **`features/hospital-ads/queries.ts`:**
    - `useAdCredit()`: `useQuery(['ad-credit'])`, 30초 refetchInterval
    - `useAdCreatives()`: `useQuery(['ad-creatives'])`
    - `useCreateCreative()`: `useMutation`, 성공 시 `['ad-creatives']` invalidate
    - `useAdCampaigns(status?)`: `useQuery(['ad-campaigns', status])`
    - `useCreateCampaign()`: `useMutation`, 성공 시 `['ad-campaigns']` invalidate + `['ad-credit']` invalidate
    - `useCampaignReport(id: number, enabled: boolean)`: `useQuery(['campaign-report', id], { enabled })`
    - `useToggleCampaignPause()`: `useMutation`, 성공 시 `['ad-campaigns']` invalidate

    타입 정의: `AdCredit`, `AdCreative`, `AdCampaign`, `AdPerformanceReport` 인터페이스를 `api.ts` 상단에 로컬 정의 (또는 `@letmein/types` import 가능 시 import)
  </action>
  <verify>
    `ls cms/apps/admin/src/app/api/v1/hospital/ads/campaigns/\[id\]/report/route.ts` — 파일 존재
    `cd cms && npx tsc --noEmit -p apps/admin/tsconfig.json 2>&1 | grep "hospital-ads" | head -10` — 타입 에러 없음
  </verify>
  <done>Route Handler 5개 + feature module 파일 존재, TypeScript 컴파일 에러 없음</done>
</task>

<task type="auto">
  <name>Task 2: 광고 관리 View + 페이지 라우트</name>
  <files>
    cms/apps/admin/src/views/hospital/ads/HospitalAdsView.tsx,
    cms/apps/admin/src/app/(hospital)/(hospital-dashboard)/ads/page.tsx
  </files>
  <action>
    광고 관리 전체 UI를 구현한다. 드롭다운/아코디언 금지 — 탭/칩만 사용.

    **`HospitalAdsView.tsx` (`'use client'`):**

    **(1) 상단 크레딧 카드 (HAD-01):**
    - `useAdCredit()` 훅 사용
    - 광고 크레딧 잔액(원 단위 포맷: `toLocaleString('ko-KR')`) 표시
    - 30초마다 자동 refetch (훅에서 이미 설정)

    **(2) 탭 구조 — 드롭다운 X, 탭 버튼으로 전환 (state: 'creatives' | 'campaigns'):**

    **탭 1 — 크리에이티브 (HAD-02):**
    - `useAdCreatives()` 훅으로 목록 조회
    - 크리에이티브 카드 그리드: 썸네일 이미지(imageUrl), 헤드라인, reviewStatus 뱃지(pending=노란, approved=녹색, rejected=빨간)
    - 크리에이티브 등록 인라인 폼 (탭 내부에 토글 버튼 → div 표시, 아코디언 X):
      - imageUrl input[type=url], headline input[type=text]
      - 등록 버튼 → `useCreateCreative()` mutation 호출
      - 성공 시 폼 닫기

    **탭 2 — 캠페인 (HAD-03, HAD-04, HAD-05):**
    - 상태 필터 칩: 전체 / active / paused / ended (button 스타일 chip, onClick으로 state 변경)
    - `useAdCampaigns(status)` 훅으로 목록 조회 (선택된 칩 status 전달)
    - 캠페인 테이블 또는 카드 목록:
      - 캠페인 기간, 일 예산, 상태 표시
      - 각 행에 "리포트 보기" 버튼 → 해당 캠페인 행 아래 inline 리포트 표시 (toggle, 아코디언 X — 단순 조건부 렌더링)
      - inline 리포트: `useCampaignReport(id, enabled)` 훅 → 총 노출수, 총 클릭수, 총 소비 금액 표시 (HAD-04)
      - 일시정지/재개 버튼: status === 'active' → "일시정지" 버튼, status === 'paused' → "재개" 버튼 (HAD-05)
      - 버튼 클릭 → `useToggleCampaignPause()` mutation 호출
    - 캠페인 생성 인라인 폼 (탭 내부 토글 버튼 → div 표시):
      - creativeId select(승인된 크리에이티브만, `useAdCreatives()` 활용)
        → NOTE: creativeId 선택은 `<select>`가 아닌 크리에이티브 카드 체크박스 또는 라디오 버튼 UI 사용 (드롭다운 금지)
      - startDate input[type=date], endDate input[type=date]
      - dailyBudget input[type=number] (원 단위)
      - 생성 버튼 → `useCreateCampaign()` mutation 호출

    **페이지 파일:**
    - `ads/page.tsx`: `import { HospitalAdsView } from '@/views/hospital/ads/HospitalAdsView'` → 렌더링
  </action>
  <verify>
    `cd cms && npx tsc --noEmit -p apps/admin/tsconfig.json 2>&1 | grep "HospitalAds" | head -10` — 타입 에러 없음
    `ls cms/apps/admin/src/app/\(hospital\)/\(hospital-dashboard\)/ads/page.tsx` — 파일 존재
    `grep -n "useTab\|useState\|active.*paused\|칩\|chip" cms/apps/admin/src/views/hospital/ads/HospitalAdsView.tsx | head -10` — 탭/칩 구조 확인
  </verify>
  <done>
    /hospital/ads 페이지 존재, 크레딧 카드 + 크리에이티브 탭 + 캠페인 탭 구조,
    캠페인 일시정지/재개 버튼, inline 성과 리포트, TypeScript 에러 없음
  </done>
</task>

</tasks>

<verification>
1. TypeScript 컴파일: `cd cms && npx tsc --noEmit -p apps/admin/tsconfig.json 2>&1 | tail -5` — 에러 0
2. Route Handler 파일 존재: `find cms/apps/admin/src/app/api/v1/hospital/ads -name "route.ts" | sort`
3. 광고 페이지 존재: `ls cms/apps/admin/src/app/\(hospital\)/\(hospital-dashboard\)/ads/page.tsx`
4. 드롭다운 사용 여부 확인(금지): `grep -r "<select\|dropdown\|Dropdown" cms/apps/admin/src/views/hospital/ads/` — 결과 없어야 함
5. 크레딧 표시 확인: `grep -n "fetchCredit\|useAdCredit\|balance" cms/apps/admin/src/views/hospital/ads/HospitalAdsView.tsx`
</verification>

<success_criteria>
- HAD-01: /hospital/ads 페이지 상단에 광고 크레딧 잔액 숫자 표시
- HAD-02: 크리에이티브 탭에서 imageUrl + headline 입력 후 등록 가능
- HAD-03: 캠페인 탭에서 기간/일예산/크리에이티브 선택 후 생성 가능
- HAD-04: 캠페인 행에서 "리포트 보기" 클릭 시 노출/클릭/소비 인라인 표시
- HAD-05: active 캠페인에 "일시정지", paused 캠페인에 "재개" 버튼 작동
- 드롭다운/아코디언 없음, 탭/칩 사용
- TypeScript 컴파일 에러 없음
</success_criteria>

<output>
완료 후 `.planning/phases/04-hospital-chat-ads/04-ads-SUMMARY.md` 생성
</output>
