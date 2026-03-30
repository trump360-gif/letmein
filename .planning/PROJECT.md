# Black Label (LetMeIn) — 병원 페르소나 + CMS 정상화

## What This Is

성형 상담 매칭 플랫폼. 유저가 상담 요청을 등록하면 코디네이터가 맞춤 병원 2~3곳을 매칭하고, 채팅으로 상세 소통 후 유저가 직접 병원을 선택한다. 현재 유저 앱(Flutter)과 Go 서버는 대부분 구현되어 있으나, **병원 사용자 화면이 전무**하고 **CMS에 핵심 플로우 누락**이 있다.

## Core Value

병원이 CMS 웹 포탈에서 상담 요청 확인 → 응답 → 채팅 → 광고/프리미엄 관리까지 전체 비즈니스를 운영할 수 있어야 한다.

## Requirements

### Validated

- ✓ 유저 인증 (카카오 로그인, JWT, 토큰 갱신) — existing
- ✓ 코디네이터 매칭 상담 시스템 (접수→매칭→채팅방 생성) — existing
- ✓ 1:1 채팅 (Centrifugo WebSocket, 멀티룸) — existing
- ✓ 커뮤니티 게시판 (before_after, free, 댓글, 좋아요) — existing
- ✓ 투표 시스템 (단일/다중, 생성/참여) — existing
- ✓ 병원 탐색 (검색, 필터, 상세, 프리미엄) — existing
- ✓ 캐스트 멤버 시스템 (인증, 스토리, 팔로우, 에피소드) — existing
- ✓ 프리미엄 구독 (Basic/Pro 티어) — existing (server API)
- ✓ 네이티브 광고 (CPM, 크리에이티브, 캠페인) — existing (server API)
- ✓ 리뷰 시스템 (별점, 사진, cursor 페이징) — existing
- ✓ 알림 시스템 (DB + API, FCM placeholder) — existing
- ✓ Apple 로그인 (서버 토큰 검증) — existing (server only)
- ✓ CMS 어드민 (병원 승인, 캐스트 인증, 게시물 관리, 광고 심사) — existing

### Active

- [ ] CMS 매칭 시 채팅방 자동 생성 (현재 누락)
- [ ] CMS 세션 관리 정상화 (하드코딩 adminId=1 제거)
- [ ] CMS 인증 강화 (DB 기반 로그인, 세션)
- [ ] CMS 병원 상세 페이지 (정보 확인/편집)
- [ ] CMS 프리미엄 구독 부여 기능
- [ ] 병원 CMS 로그인 (역할 분기)
- [ ] 병원 대시보드 (신규 매칭/활성 채팅/응답률/평점)
- [ ] 병원 프로필 편집 (기본정보/사진/전문분야)
- [ ] 병원 상담 요청 확인 + 응답 작성
- [ ] 병원 채팅 목록 + 채팅방 (방문 예약 카드 포함)
- [ ] 병원 광고 캠페인 관리 (크리에이티브/캠페인/리포트)
- [ ] 병원 프리미엄 구독 관리
- [ ] 병원 의료진 관리 (CRUD)
- [ ] PRD 리팩토링 (17개→3개 통합)

### Out of Scope

- Flutter 앱 병원 화면 — 병원은 CMS 웹에서만 관리 (앱은 유저 전용)
- 자동 매칭 알고리즘 — 코디네이터 수동 매칭 유지 (품질 우선)
- 결제 시스템 연동 — 프리미엄은 어드민이 수동 부여
- 라이트 테마 구현 — 다크 모드 유지
- B/A 슬라이더, 상담 임시저장 — 이번 마일스톤 이후

## Context

- **기술 스택**: Flutter(Riverpod) + Go(Gin) + Next.js(CMS) + PostgreSQL + Redis + Centrifugo
- **CMS 구조**: Turborepo 모노레포 (apps/admin, apps/web, packages/*)
- **CMS 데이터**: Prisma ORM으로 PostgreSQL 직접 접근 (Go 서버와 동일 DB)
- **서버 API**: 병원 전용 엔드포인트 24개 이미 구현 (hospitalOnly 미들웨어)
- **병원 역할**: users 테이블 role='hospital', hospitals 테이블에 상세 정보
- **UI 규칙**: 드롭다운 금지 → 탭/칩 사용, 순서 변경은 드래그앤드롭

## Constraints

- **법률**: 의료법 27조 (매칭 무료), 56조 (광고 라벨), 금액 기재 금지
- **Tech**: CMS는 기존 admin 앱에 역할 분기 추가 (별도 앱 X)
- **UI**: 드롭다운 사용 금지, 탭/칩/드래그앤드롭만 허용
- **DB**: CMS Prisma와 Go 서버가 같은 PostgreSQL 공유

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| 병원 포탈 = CMS 역할 분기 | 별도 앱 대비 개발/유지보수 비용 절감 | 채택 |
| Go 서버 API 재사용 | 24개 hospital API 이미 존재, CMS에서 호출 | 채택 |
| PRD 리팩토링 후순위 | 기능 구현이 우선, 문서는 마지막 | 채택 |
| 드롭다운 전면 금지 | 사용자 경험 일관성, 모바일 친화적 | 확정 |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition:**
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

---
*Last updated: 2026-03-30 after initialization*
