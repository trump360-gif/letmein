# CLAUDE.md - LetMeIn CMS Admin

## UI 규칙

- **펼침목록(Accordion/Collapsible) 절대 사용 금지**: Accordion, Collapsible, 토글 펼침 등 접었다 펼치는 UI 패턴을 절대 사용하지 않는다. 목록은 항상 펼쳐진 상태로 직관적으로 보여주고, 항목이 많을 경우 페이지네이션으로 처리한다. 복잡한 입력 폼은 스텝바이스텝(Wizard/Stepper) 방식을 사용한다.

---

## 이 프로젝트가 하는 일

**LetMeIn 성형 플랫폼 관리 시스템(CMS)**이다.
cms_admin 기반으로 구축되었으며, LetMeIn 전용 기능이 추가되어 있다.

주요 관리 대상:
- 병원 등록 승인/관리
- 상담 요청 코디네이터 매칭
- 출연자(Cast Member) 인증/관리
- YouTube 에피소드 관리
- 프리미엄 구독 관리
- 광고 소재 심사 및 캠페인 관리

기존 CMS Admin 기능 (커뮤니티, 게시판, 배너, 팝업 등)도 그대로 유지.

---

## 모노레포 구조

```
cms/
├── apps/admin/     # 관리자 대시보드 (포트 3001)
├── apps/web/       # 공개 사이트 (기존 beauti, 추후 letmein으로 전환)
└── packages/
    ├── db/         # Prisma 스키마 (PostgreSQL 16)
    ├── types/      # 공유 타입 (letmein.ts 포함)
    ├── ui/         # 공유 UI 컴포넌트
    ├── utils/      # cn, date 등 유틸
    └── config/     # ESLint, Tailwind, TypeScript 설정
```

---

## LetMeIn 전용 모델 (Prisma)

packages/db/prisma/schema.prisma 하단에 추가됨:

| 모델 | 테이블 | 설명 |
|------|--------|------|
| Hospital | hospitals | 병원 |
| HospitalSpecialty | hospital_specialties | 병원 전문 분야 |
| HospitalDoctor | hospital_doctors | 소속 의사 |
| ProcedureCategory | procedure_categories | 시술 카테고리 |
| ProcedureDetail | procedure_details | 시술 상세 |
| ConsultationRequest | consultation_requests | 상담 요청 |
| CoordinatorMatch | coordinator_matches | 코디네이터 매칭 |
| ChatRoom | chat_rooms | 채팅방 |
| ChatMessage | messages | 채팅 메시지 |
| CastMember | cast_members | 출연자 |
| YouTubeEpisode | youtube_episodes | 에피소드 |
| EpisodeCastMember | episode_cast_members | 에피소드-출연자 연결 |
| CastStory | cast_stories | 출연자 스토리 |
| CastFollow | cast_follows | 출연자 팔로우 |
| HospitalSubscription | hospital_subscriptions | 프리미엄 구독 |
| AdCredit | ad_credits | 광고 크레딧 |
| AdCreative | ad_creatives | 광고 소재 |
| AdCampaign | ad_campaigns | 광고 캠페인 |

---

## 코드 패턴

- **API Route**: apps/admin/src/app/api/v1/admin/ 아래, Prisma 직접 조회
- **Feature**: apps/admin/src/features/{name}/ - api.ts (fetch), queries.ts (React Query), index.ts (re-export)
- **View**: apps/admin/src/views/{name}/ - 'use client' 컴포넌트
- **Page**: apps/admin/src/app/(dashboard)/{name}/page.tsx - View import

---

## 환경변수

```
DATABASE_URL=postgresql://letmein:letmein@localhost:15432/letmein
CENTRIFUGO_API_URL=...
CENTRIFUGO_API_KEY=...
NEXT_PUBLIC_CENTRIFUGO_WS_URL=...
```

외부 크롤링 DB (SUNGYESA_DB_URL 등)는 제거됨.
GEMINI_API_KEY, NANOBANA_API_KEY도 제거됨.
