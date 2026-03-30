---
phase: 04-hospital-chat-ads
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - cms/apps/admin/src/app/api/v1/hospital/chat/rooms/route.ts
  - cms/apps/admin/src/app/api/v1/hospital/chat/rooms/[id]/messages/route.ts
  - cms/apps/admin/src/app/api/v1/hospital/chat/rooms/[id]/visit-card/route.ts
  - cms/apps/admin/src/app/api/v1/hospital/chat/rooms/[id]/visit-cards/route.ts
  - cms/apps/admin/src/features/hospital-chat/api.ts
  - cms/apps/admin/src/features/hospital-chat/queries.ts
  - cms/apps/admin/src/features/hospital-chat/index.ts
  - cms/apps/admin/src/views/hospital/chat/HospitalChatListView.tsx
  - cms/apps/admin/src/views/hospital/chat/HospitalChatRoomView.tsx
  - cms/apps/admin/src/app/(hospital)/(hospital-dashboard)/chat/page.tsx
  - cms/apps/admin/src/app/(hospital)/(hospital-dashboard)/chat/[id]/page.tsx
autonomous: true
requirements:
  - HCHAT-01
  - HCHAT-02
  - HCHAT-03
  - HCHAT-04
  - HCHAT-05

must_haves:
  truths:
    - "채팅 목록 페이지에서 각 채팅방의 안읽음 수, 마지막 메시지, 시간을 표시한다"
    - "채팅방에 입장해 메시지를 주고받을 수 있다 (3초 polling)"
    - "방문 예약 카드(날짜/시간/메모)를 발송할 수 있다"
    - "채팅방 상단에 면책 고지 배너가 항상 고정 표시된다"
    - "유저가 방문 예약 카드를 수락/거절한 상태가 표시된다"
  artifacts:
    - path: "cms/apps/admin/src/app/api/v1/hospital/chat/rooms/route.ts"
      provides: "GET — 병원 채팅방 목록 (Go GET /api/v1/chat/rooms/hospital 프록시)"
      exports: ["GET"]
    - path: "cms/apps/admin/src/app/api/v1/hospital/chat/rooms/[id]/messages/route.ts"
      provides: "GET/POST — 메시지 조회 및 발송 (Go GET/POST /api/v1/chat/rooms/:id/messages 프록시)"
      exports: ["GET", "POST"]
    - path: "cms/apps/admin/src/app/api/v1/hospital/chat/rooms/[id]/visit-card/route.ts"
      provides: "POST — 방문 예약 카드 생성 (Go POST /api/v1/chat/rooms/:id/visit-card 프록시)"
      exports: ["POST"]
    - path: "cms/apps/admin/src/app/api/v1/hospital/chat/rooms/[id]/visit-cards/route.ts"
      provides: "GET — 방문 예약 카드 목록 (Go GET /api/v1/chat/rooms/:id/visit-cards/hospital 프록시)"
      exports: ["GET"]
    - path: "cms/apps/admin/src/features/hospital-chat/api.ts"
      provides: "fetch 함수 — fetchHospitalChatRooms, fetchMessages, sendMessage, createVisitCard, fetchVisitCards"
    - path: "cms/apps/admin/src/views/hospital/chat/HospitalChatListView.tsx"
      provides: "채팅 목록 UI — 채팅방 카드 리스트"
    - path: "cms/apps/admin/src/views/hospital/chat/HospitalChatRoomView.tsx"
      provides: "채팅방 UI — 면책 고지 배너 + 메시지 목록 + 입력 + 방문 예약 카드 발송 폼"
  key_links:
    - from: "cms/apps/admin/src/views/hospital/chat/HospitalChatRoomView.tsx"
      to: "/api/v1/hospital/chat/rooms/[id]/messages"
      via: "setInterval 3초 polling + fetch POST"
      pattern: "setInterval.*fetchMessages"
    - from: "cms/apps/admin/src/app/api/v1/hospital/chat/rooms/route.ts"
      to: "Go GET /api/v1/chat/rooms/hospital"
      via: "병원 JWT를 Authorization 헤더에 첨부하여 프록시"
      pattern: "chat/rooms/hospital"
    - from: "cms/apps/admin/src/app/api/v1/hospital/chat/rooms/[id]/visit-card/route.ts"
      to: "Go POST /api/v1/chat/rooms/:id/visit-card"
      via: "hospitalJwt 첨부 프록시"
      pattern: "visit-card"
---

<objective>
병원 사용자가 CMS에서 유저와 채팅하고, 방문 예약 카드를 발송하고, 면책 고지를 확인할 수 있는 채팅 기능 전체를 구현한다.

Purpose: Phase 4의 채팅 루프 완성 — HCHAT-01~05 전부 커버
Output:
- 채팅 목록 페이지 (/hospital/chat)
- 채팅방 페이지 (/hospital/chat/[id]) — polling, 면책 고지, 방문 예약 카드
- Next.js Route Handler 4개 (Go 서버 프록시)
- hospital-chat feature module
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
<!-- Go 서버 병원 채팅 API (hospitalOnly 미들웨어 적용, Authorization: Bearer {hospitalJwt} 필요) -->

GET    /api/v1/chat/rooms/hospital
  Response: { rooms: ChatRoomListItem[] }
  ChatRoomListItem { id, user_id, hospital_id, status, last_message, last_message_type, last_message_at, unread_count, created_at }

GET    /api/v1/chat/rooms/:id/messages?before=&limit=
  Response: { messages: Message[] }
  Message { id, room_id, sender_id, sender_type, message_type, content, created_at }

POST   /api/v1/chat/rooms/:id/messages
  Body: { type: "text", content: string }
  Response: { message: Message }

POST   /api/v1/chat/rooms/:id/visit-card
  Body: { scheduledAt: string (ISO), note?: string }
  Response: { visitCard: VisitCard }

GET    /api/v1/chat/rooms/:id/visit-cards/hospital
  Response: { visitCards: VisitCard[] }
  VisitCard { id, room_id, hospital_id, scheduled_at, note, status: "pending"|"accepted"|"declined", created_at }

<!-- CMS 세션에서 hospitalJwt 추출 방법 (Phase 2 패턴) -->
<!-- session.ts의 getSession()으로 { role: "hospital", hospitalJwt: string } 획득 -->
<!-- Route Handler에서: const session = await getSession(); headers: { Authorization: `Bearer ${session.hospitalJwt}` } -->

<!-- Phase 3 패턴 참조 — 병원 Route Handler 프록시 구조 -->
<!-- cms/apps/admin/src/app/api/v1/hospital/ 하위에 Next.js Route Handler 생성 -->
<!-- 각 Route Handler: getSession() → hospitalJwt → Go 서버 fetch → JSON 반환 -->
<!-- 인증 실패 시 401 반환 -->
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: 채팅 Route Handler 4개 + feature module</name>
  <files>
    cms/apps/admin/src/app/api/v1/hospital/chat/rooms/route.ts,
    cms/apps/admin/src/app/api/v1/hospital/chat/rooms/[id]/messages/route.ts,
    cms/apps/admin/src/app/api/v1/hospital/chat/rooms/[id]/visit-card/route.ts,
    cms/apps/admin/src/app/api/v1/hospital/chat/rooms/[id]/visit-cards/route.ts,
    cms/apps/admin/src/features/hospital-chat/api.ts,
    cms/apps/admin/src/features/hospital-chat/queries.ts,
    cms/apps/admin/src/features/hospital-chat/index.ts
  </files>
  <action>
    Go 서버 채팅 API를 CMS에서 호출할 수 있도록 Route Handler 4개와 feature module을 생성한다.

    **Route Handler 패턴 (Phase 2/3와 동일):**
    - `getSession()` 호출 → `session.hospitalJwt` 없으면 `Response.json({error:'Unauthorized'}, {status:401})` 반환
    - `fetch(\`${NEXT_PUBLIC_API_URL}/api/v1/...\`, { headers: { Authorization: \`Bearer ${session.hospitalJwt}\` } })`
    - Go 응답을 그대로 반환 (`Response.json(data, { status: res.status })`)

    **Route Handler 1: `rooms/route.ts`**
    - `GET`: Go `GET /api/v1/chat/rooms/hospital` 프록시 → 채팅방 목록 반환

    **Route Handler 2: `rooms/[id]/messages/route.ts`**
    - `GET`: Go `GET /api/v1/chat/rooms/:id/messages` 프록시 (query params `before`, `limit` 전달)
    - `POST`: Body `{ type, content }` → Go `POST /api/v1/chat/rooms/:id/messages` 프록시

    **Route Handler 3: `rooms/[id]/visit-card/route.ts`**
    - `POST`: Body `{ scheduledAt, note }` → Go `POST /api/v1/chat/rooms/:id/visit-card` 프록시

    **Route Handler 4: `rooms/[id]/visit-cards/route.ts`**
    - `GET`: Go `GET /api/v1/chat/rooms/:id/visit-cards/hospital` 프록시

    **feature module (`features/hospital-chat/api.ts`):**
    ```typescript
    export async function fetchHospitalChatRooms(): Promise<ChatRoomListItem[]>
    export async function fetchMessages(roomId: string, params?: { before?: number; limit?: number }): Promise<Message[]>
    export async function sendMessage(roomId: string, content: string): Promise<Message>
    export async function createVisitCard(roomId: string, scheduledAt: string, note?: string): Promise<VisitCard>
    export async function fetchVisitCards(roomId: string): Promise<VisitCard[]>
    ```
    모두 CMS 내부 Route Handler(`/api/v1/hospital/chat/...`)를 호출하는 클라이언트 fetch 함수.

    **`features/hospital-chat/queries.ts`:**
    - `useHospitalChatRooms()`: React Query `useQuery`, queryKey `['hospital-chat-rooms']`, refetchInterval 없음 (목록은 수동 refetch)
    - `useChatMessages(roomId, enabled)`: queryKey `['chat-messages', roomId]`, refetchInterval: false (컴포넌트에서 직접 polling)
    - `useSendMessage()`: `useMutation`, 성공 시 `['chat-messages', roomId]` invalidate
    - `useCreateVisitCard()`: `useMutation`
    - `useVisitCards(roomId)`: `useQuery`, queryKey `['visit-cards', roomId]`

    **타입 정의:** `ChatRoomListItem`, `Message`, `VisitCard` 인터페이스를 `features/hospital-chat/api.ts` 상단에 로컬 정의 (또는 `@letmein/types`에 이미 있으면 import)
  </action>
  <verify>
    `ls cms/apps/admin/src/app/api/v1/hospital/chat/rooms/route.ts cms/apps/admin/src/app/api/v1/hospital/chat/rooms/\[id\]/messages/route.ts` — 파일 존재 확인
    `cd cms && npx tsc --noEmit -p apps/admin/tsconfig.json 2>&1 | grep -E "hospital-chat|visit-card" | head -20` — 타입 에러 없음
  </verify>
  <done>Route Handler 4개 + feature module 파일 존재, TypeScript 컴파일 에러 없음</done>
</task>

<task type="auto">
  <name>Task 2: 채팅 목록 + 채팅방 View + 페이지 라우트</name>
  <files>
    cms/apps/admin/src/views/hospital/chat/HospitalChatListView.tsx,
    cms/apps/admin/src/views/hospital/chat/HospitalChatRoomView.tsx,
    cms/apps/admin/src/app/(hospital)/(hospital-dashboard)/chat/page.tsx,
    cms/apps/admin/src/app/(hospital)/(hospital-dashboard)/chat/[id]/page.tsx
  </files>
  <action>
    채팅 목록과 채팅방 UI를 구현한다. 드롭다운/아코디언 전면 금지 — 탭/칩/카드만 사용.

    **`HospitalChatListView.tsx` (`'use client'`):**
    - `useHospitalChatRooms()` 훅 사용
    - 채팅방 카드 목록 렌더링. 각 카드: 유저 이름(또는 ID), 마지막 메시지 텍스트, 마지막 메시지 시간, 안읽음 배지(unread_count > 0 이면 빨간 뱃지)
    - 카드 클릭 → `router.push('/hospital/chat/{id}')` (Next.js `useRouter`)
    - 로딩 상태: 스켈레톤 카드 3개
    - 빈 상태: "채팅방이 없습니다" 텍스트

    **`HospitalChatRoomView.tsx` (`'use client'`):**

    **(1) 면책 고지 배너 (HCHAT-05) — 상단 sticky:**
    ```
    이 채팅은 의료 상담이 아니며 법적 책임을 지지 않습니다.
    구체적인 의료 문의는 병원에 직접 방문하시기 바랍니다.
    ```
    `position: sticky, top: 0` 또는 Tailwind `sticky top-0` 클래스. 배경색 주의: 스크롤 시 메시지 위에 덮여야 함.

    **(2) 메시지 목록:**
    - `useChatMessages(roomId, true)` 훅 사용
    - `useEffect`에서 `setInterval(refetch, 3000)` — 3초 polling. `clearInterval` cleanup 포함.
    - 메시지 렌더링: sender_type === 'hospital' → 오른쪽 정렬(파란 말풍선), 'user' → 왼쪽(회색 말풍선)
    - message_type === 'visit_card' 인 경우 → 방문 예약 카드 UI로 표시 (날짜/시간/메모 + 상태 배지)
    - 메시지 추가 시 자동 스크롤 하단 (`useRef`, `scrollIntoView`)

    **(3) 방문 예약 카드 발송 버튼 (HCHAT-03):**
    - 입력 영역 위에 "방문 예약 카드 발송" 버튼
    - 클릭 시 인라인 폼 토글 (드롭다운 X — div 토글): 날짜 input[type=date], 시간 input[type=time], 메모 textarea
    - 발송 시 `useCreateVisitCard()` mutation 호출
    - 성공 후 폼 닫기 + `['chat-messages', roomId]` refetch

    **(4) 방문 예약 카드 상태 (HCHAT-04):**
    - `useVisitCards(roomId)` 훅으로 카드 목록 조회
    - message_type === 'visit_card' 메시지 렌더링 시 해당 카드의 status 표시: "pending" → 대기중, "accepted" → 수락됨(녹색), "declined" → 거절됨(빨간)

    **(5) 텍스트 입력:**
    - textarea + 전송 버튼 (Enter 키 전송 가능, Shift+Enter 줄바꿈)
    - `useSendMessage()` mutation 호출

    **페이지 파일:**
    - `chat/page.tsx`: `import { HospitalChatListView } from '@/views/hospital/chat/HospitalChatListView'` → 렌더링
    - `chat/[id]/page.tsx`: `params.id` 추출 → `<HospitalChatRoomView roomId={params.id} />`
  </action>
  <verify>
    `cd cms && npx tsc --noEmit -p apps/admin/tsconfig.json 2>&1 | grep -E "HospitalChat|chat/\[id\]" | head -20` — 타입 에러 없음
    `ls cms/apps/admin/src/app/\(hospital\)/\(hospital-dashboard\)/chat/\[id\]/page.tsx` — 파일 존재
  </verify>
  <done>
    채팅 목록 (/hospital/chat)과 채팅방 (/hospital/chat/[id]) 페이지 존재,
    면책 고지 배너 sticky, polling 3초, 방문 예약 카드 발송 인라인 폼,
    방문 카드 수락/거절 상태 표시, TypeScript 에러 없음
  </done>
</task>

</tasks>

<verification>
1. TypeScript 컴파일: `cd cms && npx tsc --noEmit -p apps/admin/tsconfig.json 2>&1 | tail -5` — 에러 0
2. Route Handler 파일 존재 확인: `find cms/apps/admin/src/app/api/v1/hospital/chat -name "route.ts" | sort`
3. 채팅 페이지 파일 존재 확인: `find cms/apps/admin/src/app/\(hospital\) -name "*.tsx" | grep chat`
4. 면책 고지 텍스트 포함 확인: `grep -r "의료 상담이 아니며" cms/apps/admin/src/views/hospital/chat/`
5. setInterval polling 포함 확인: `grep -r "setInterval" cms/apps/admin/src/views/hospital/chat/`
</verification>

<success_criteria>
- HCHAT-01: /hospital/chat 페이지에서 안읽음 수·마지막 메시지·시간 표시
- HCHAT-02: /hospital/chat/[id] 페이지에서 3초 polling으로 메시지 수신 + 텍스트 발송
- HCHAT-03: 방문 예약 카드(날짜/시간/메모) 인라인 폼으로 발송
- HCHAT-04: 방문 카드 status(pending/accepted/declined) 시각적 표시
- HCHAT-05: 면책 고지 배너 sticky top-0으로 항상 고정
- TypeScript 컴파일 에러 없음
</success_criteria>

<output>
완료 후 `.planning/phases/04-hospital-chat-ads/04-chat-SUMMARY.md` 생성
</output>
