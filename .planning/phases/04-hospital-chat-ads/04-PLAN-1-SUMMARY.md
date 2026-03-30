---
phase: 04-hospital-chat-ads
plan: 1
subsystem: hospital-chat
tags: [chat, polling, visit-card, disclaimer, prisma]
dependency_graph:
  requires: []
  provides:
    - hospital-chat feature module (api.ts, queries.ts, index.ts)
    - Route Handler: GET /api/v1/hospital/chat/rooms
    - Route Handler: GET/POST /api/v1/hospital/chat/rooms/[id]/messages
    - Route Handler: POST /api/v1/hospital/chat/rooms/[id]/visit-card
    - Route Handler: GET /api/v1/hospital/chat/rooms/[id]/visit-cards
    - Page: /hospital/chat (HospitalChatListView)
    - Page: /hospital/chat/[id] (HospitalChatRoomView)
  affects:
    - hospital dashboard (activeChats count)
tech_stack:
  added: []
  patterns:
    - Prisma direct query (no Go proxy) — same as dashboard route
    - $queryRaw for visit_cards table (no Prisma model)
    - setInterval 3-second polling in useEffect with clearInterval cleanup
    - React Query: refetchInterval: false, manual refetch via interval
key_files:
  created:
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
  modified: []
decisions:
  - "Prisma 직접 조회 사용 (Go 서버 프록시 패턴 아님) — session.ts에 hospitalJwt 없음, 기존 dashboard 패턴과 일치"
  - "visit_cards 테이블: Prisma 모델 없어 $queryRaw 사용 (reviews 테이블과 동일 패턴)"
  - "sender_type 컬럼 없음 — senderId vs room.userId 비교로 hospital/user 판별"
  - "방문 예약 카드 발송 시 visit_card 타입 ChatMessage도 함께 생성하여 채팅 흐름에 표시"
metrics:
  duration: 246s
  completed: 2026-03-30
  tasks_completed: 2
  files_created: 11
---

# Phase 04 Plan 1: 병원 채팅 기능 전체 구현 Summary

**One-liner:** Prisma 직접 조회 기반 채팅 목록/방/방문 예약 카드/면책 고지 배너 — HCHAT-01~05 완전 구현

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | 채팅 Route Handler 4개 + feature module | f6b8ac96 | 7 files created |
| 2 | 채팅 목록 + 채팅방 View + 페이지 라우트 | 1b33441c | 4 files created |

## What Was Built

### Route Handlers (Prisma 직접 조회)
- **GET /api/v1/hospital/chat/rooms** — hospitalId 기반 채팅방 목록, 유저 정보 join, unreadCount(user 발신 & readAt null) 계산
- **GET /api/v1/hospital/chat/rooms/[id]/messages** — 메시지 목록, senderId vs userId 비교로 senderType 결정
- **POST /api/v1/hospital/chat/rooms/[id]/messages** — 텍스트 메시지 저장, lastMessageAt 갱신
- **POST /api/v1/hospital/chat/rooms/[id]/visit-card** — $queryRaw로 visit_cards 테이블 INSERT + visit_card 타입 ChatMessage 동시 생성
- **GET /api/v1/hospital/chat/rooms/[id]/visit-cards** — $queryRaw로 방문 예약 카드 목록

### Feature Module (hospital-chat)
- `api.ts`: 5개 fetch 함수 (ChatRoomListItem, Message, VisitCard 타입 포함)
- `queries.ts`: 5개 React Query 훅 (useHospitalChatRooms, useChatMessages, useSendMessage, useCreateVisitCard, useVisitCards)
- `index.ts`: re-export

### UI Components
- **HospitalChatListView**: 채팅방 카드 목록, unread 뱃지(빨간), 마지막 메시지/시간, 스켈레톤 3개, 빈 상태
- **HospitalChatRoomView**:
  - DisclaimerBanner: `sticky top-0 z-10` 면책 고지 배너 (HCHAT-05)
  - 3초 setInterval polling with clearInterval cleanup (HCHAT-02)
  - 말풍선: hospital=오른쪽 파란(bg-blue-500), user=왼쪽 회색
  - visit_card 메시지: JSON parse → 날짜/시간/메모/상태 카드 UI (HCHAT-04)
  - VisitCardForm: date/time/textarea 인라인 div 토글 (드롭다운 X) (HCHAT-03)
  - Enter 전송 / Shift+Enter 줄바꿈
  - useRef + scrollIntoView 자동 스크롤

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Architectural Mismatch] Go 서버 프록시 대신 Prisma 직접 조회 사용**
- **Found during:** Task 1
- **Issue:** 계획서는 Go 서버 프록시 + hospitalJwt 패턴을 명시했으나, 실제 codebase는 session.ts에 hospitalJwt가 없고 대신 hospitalId를 JWT sub로 관리. 기존 dashboard route도 Prisma 직접 조회 패턴 사용.
- **Fix:** Prisma 직접 조회로 구현. NEXT_PUBLIC_API_URL 환경변수도 없음을 확인.
- **Files modified:** 모든 Route Handler 파일

**2. [Rule 2 - Missing Critical] sender_type 컬럼 없음**
- **Found during:** Task 1 (Prisma 스키마 분석)
- **Issue:** ChatMessage 모델에 sender_type 컬럼 없음. 계획서는 sender_type 필드를 가정.
- **Fix:** senderId === room.userId 비교로 'user'/'hospital' 판별 로직 추가. API 응답에 senderType 필드 포함.

**3. [Rule 2 - Missing Critical] visit_cards Prisma 모델 없음**
- **Found during:** Task 1
- **Issue:** Prisma 스키마에 VisitCard 모델 없음. $queryRaw 패턴(reviews 테이블과 동일)으로 처리.
- **Fix:** visit-card route, visit-cards route 모두 $queryRaw 사용.

**4. [Rule 2 - Missing] visit_card 메시지 자동 생성**
- **Found during:** Task 1
- **Issue:** 방문 예약 카드 발송 시 채팅 흐름에서 카드를 볼 수 없음.
- **Fix:** POST visit-card 시 messageType='visit_card' ChatMessage를 동시 생성. content에 JSON 직렬화.

## Known Stubs

없음 — 모든 데이터 소스 연결됨. visit_cards 테이블은 $queryRaw로 실제 DB 조회.

## Success Criteria Check

- [x] HCHAT-01: /hospital/chat — unreadCount, lastMessage, lastMessageAt 표시
- [x] HCHAT-02: /hospital/chat/[id] — 3초 polling (setInterval/clearInterval), 텍스트 발송
- [x] HCHAT-03: 방문 예약 카드 인라인 폼 (날짜/시간/메모), 드롭다운 X
- [x] HCHAT-04: visit_card status pending/accepted/declined 배지 표시
- [x] HCHAT-05: 면책 고지 배너 sticky top-0 z-10 고정
- [x] TypeScript 컴파일 에러 없음 (신규 파일 기준)

## Self-Check: PASSED
