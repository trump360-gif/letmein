---
phase: 04-hospital-chat-ads
plan: 3
type: execute
wave: 1
depends_on: []
files_modified:
  - cms/apps/admin/src/app/api/v1/hospital/premium/status/route.ts
  - cms/apps/admin/src/features/hospital-premium/api.ts
  - cms/apps/admin/src/features/hospital-premium/queries.ts
  - cms/apps/admin/src/features/hospital-premium/index.ts
  - cms/apps/admin/src/views/hospital/premium/HospitalPremiumView.tsx
  - cms/apps/admin/src/app/(hospital)/(hospital-dashboard)/premium/page.tsx
autonomous: true
requirements:
  - HPREM-01
  - HPREM-02

must_haves:
  truths:
    - "프리미엄 페이지에서 현재 구독 티어와 만료일을 확인할 수 있다"
    - "프리미엄 구독이 없는 경우 혜택 안내 콘텐츠가 표시된다"
    - "구독 중인 경우와 미구독인 경우 UI가 구분된다"
  artifacts:
    - path: "cms/apps/admin/src/app/api/v1/hospital/premium/status/route.ts"
      provides: "GET — 프리미엄 구독 상태 (Go GET /api/v1/hospitals/premium/status 프록시)"
      exports: ["GET"]
    - path: "cms/apps/admin/src/features/hospital-premium/api.ts"
      provides: "fetchPremiumStatus fetch 함수"
    - path: "cms/apps/admin/src/views/hospital/premium/HospitalPremiumView.tsx"
      provides: "프리미엄 상태 확인 + 혜택 안내 UI"
  key_links:
    - from: "cms/apps/admin/src/views/hospital/premium/HospitalPremiumView.tsx"
      to: "/api/v1/hospital/premium/status"
      via: "usePremiumStatus() 훅 → fetchPremiumStatus fetch"
      pattern: "fetchPremiumStatus|usePremiumStatus"
    - from: "cms/apps/admin/src/app/api/v1/hospital/premium/status/route.ts"
      to: "Go GET /api/v1/hospitals/premium/status"
      via: "hospitalJwt 첨부 프록시"
      pattern: "hospitals/premium/status"
---

<objective>
병원 사용자가 CMS에서 현재 프리미엄 구독 상태(티어·만료일)를 확인하고, 프리미엄 혜택 안내를 볼 수 있는 페이지를 구현한다.

Purpose: HPREM-01~02 완성 — 병원 비즈니스 루프의 마지막 조각
Output:
- 프리미엄 페이지 (/hospital/premium)
- Next.js Route Handler 1개 (Go 서버 프록시)
- hospital-premium feature module
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
<!-- Go 서버 병원 프리미엄 API (hospitalOnly 미들웨어 적용, Authorization: Bearer {hospitalJwt} 필요) -->

GET /api/v1/hospitals/premium/status
  Response: { subscription: HospitalSubscription | null }
  HospitalSubscription {
    id: number,
    hospitalId: number,
    tier: "basic" | "premium" | "vip",
    startDate: string,    // ISO date
    endDate: string,      // ISO date
    isActive: boolean,
    createdAt: string
  }

<!-- subscription이 null이면 미구독 상태 -->

<!-- CMS 세션에서 hospitalJwt 추출 방법 (Phase 2/3/4 패턴) -->
<!-- getSession() → session.hospitalJwt → Authorization: Bearer {hospitalJwt} -->
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: 프리미엄 Route Handler + feature module + View + 페이지</name>
  <files>
    cms/apps/admin/src/app/api/v1/hospital/premium/status/route.ts,
    cms/apps/admin/src/features/hospital-premium/api.ts,
    cms/apps/admin/src/features/hospital-premium/queries.ts,
    cms/apps/admin/src/features/hospital-premium/index.ts,
    cms/apps/admin/src/views/hospital/premium/HospitalPremiumView.tsx,
    cms/apps/admin/src/app/(hospital)/(hospital-dashboard)/premium/page.tsx
  </files>
  <action>
    프리미엄 상태 확인 + 혜택 안내 페이지 전체를 한 태스크에서 구현한다 (범위가 작으므로 합산).

    **Route Handler (`premium/status/route.ts`):**
    - `GET`: `getSession()` → `session.hospitalJwt` 없으면 `401` 반환
    - Go `GET /api/v1/hospitals/premium/status` 프록시
    - 404 응답도 그대로 전달 (미구독 시 Go가 null 반환하므로 200으로 옴)

    **feature module (`features/hospital-premium/api.ts`):**
    ```typescript
    export interface HospitalSubscription {
      id: number
      hospitalId: number
      tier: 'basic' | 'premium' | 'vip'
      startDate: string
      endDate: string
      isActive: boolean
      createdAt: string
    }

    export async function fetchPremiumStatus(): Promise<{ subscription: HospitalSubscription | null }>
    ```
    - CMS 내부 Route Handler `/api/v1/hospital/premium/status` 호출

    **`features/hospital-premium/queries.ts`:**
    - `usePremiumStatus()`: `useQuery(['premium-status'])`, staleTime 5분

    **`HospitalPremiumView.tsx` (`'use client'`):**

    **(1) 구독 중인 경우 (HPREM-01) — subscription !== null:**
    - 구독 상태 카드:
      - 티어 배지: "BASIC" / "PREMIUM" / "VIP" (tier에 따라 색상 구분 — basic: 회색, premium: 파란, vip: 금색)
      - 구독 시작일: `startDate` 포맷 (YYYY.MM.DD)
      - 만료일: `endDate` 포맷 (YYYY.MM.DD)
      - isActive === false 이면 "만료됨" 텍스트 표시
    - 현재 티어에 해당하는 혜택 목록 표시 (HPREM-02 — 구독자도 혜택 안내 확인 가능)

    **(2) 미구독인 경우 (HPREM-02) — subscription === null:**
    - "현재 프리미엄 구독이 없습니다" 상태 텍스트
    - 혜택 안내 섹션 (구독 유도 목적):
      - BASIC 혜택: 의료진 프로필 최대 3명 등록, 검색 노출 기본
      - PREMIUM 혜택: 의료진 최대 10명, 검색 상단 노출, 광고 크레딧 월 10,000포인트 무료 지급
      - VIP 혜택: 의료진 무제한, 검색 최상단 노출, 광고 크레딧 월 30,000포인트, 전담 매니저
      - 각 혜택은 칩/카드 형태로 나열 (드롭다운 X, 아코디언 X)
    - "구독 문의" 안내 문구: "구독 업그레이드는 담당자에게 문의하세요." (현재 자동 결제 없음, 어드민 수동 부여)

    **(3) 로딩 상태:** 스켈레톤 카드 1개

    **페이지 파일:**
    - `premium/page.tsx`: `import { HospitalPremiumView } from '@/views/hospital/premium/HospitalPremiumView'` → 렌더링
  </action>
  <verify>
    `ls cms/apps/admin/src/app/api/v1/hospital/premium/status/route.ts` — 파일 존재
    `ls cms/apps/admin/src/app/\(hospital\)/\(hospital-dashboard\)/premium/page.tsx` — 파일 존재
    `cd cms && npx tsc --noEmit -p apps/admin/tsconfig.json 2>&1 | grep "hospital-premium\|HospitalPremium" | head -10` — 타입 에러 없음
    `grep -n "subscription\|tier\|endDate\|isActive" cms/apps/admin/src/views/hospital/premium/HospitalPremiumView.tsx | head -10` — 구독 상태 분기 확인
  </verify>
  <done>
    /hospital/premium 페이지 존재,
    구독 중: 티어 배지 + 만료일 표시,
    미구독: 혜택 안내 3티어 카드 표시,
    TypeScript 에러 없음
  </done>
</task>

</tasks>

<verification>
1. TypeScript 컴파일: `cd cms && npx tsc --noEmit -p apps/admin/tsconfig.json 2>&1 | tail -5` — 에러 0
2. Route Handler 파일 존재: `ls cms/apps/admin/src/app/api/v1/hospital/premium/status/route.ts`
3. 페이지 파일 존재: `ls cms/apps/admin/src/app/\(hospital\)/\(hospital-dashboard\)/premium/page.tsx`
4. 구독/미구독 분기 확인: `grep -n "null\|subscription\b" cms/apps/admin/src/views/hospital/premium/HospitalPremiumView.tsx | head -5`
5. 드롭다운 미사용 확인: `grep -r "dropdown\|<select\|accordion" cms/apps/admin/src/views/hospital/premium/` — 결과 없어야 함
</verification>

<success_criteria>
- HPREM-01: /hospital/premium 페이지에서 티어(basic/premium/vip)와 만료일 확인 가능
- HPREM-02: 미구독 시 BASIC/PREMIUM/VIP 혜택 안내 카드 3개 표시, 구독 중에도 현재 티어 혜택 표시
- subscription === null 분기와 !== null 분기 모두 렌더링
- TypeScript 컴파일 에러 없음
</success_criteria>

<output>
완료 후 `.planning/phases/04-hospital-chat-ads/04-premium-SUMMARY.md` 생성
</output>
