# Roadmap: Black Label (LetMeIn) — 병원 페르소나 + CMS 정상화

## Overview

현재 유저 앱(Flutter)과 Go 서버는 대부분 구현되어 있으나, 병원이 CMS에서 실제로 비즈니스를 운영할 수 없는 상태다. CMS 핵심 플로우 누락 수정(Phase 1)으로 코디네이터 워크플로우를 완성하고, 병원 인증/대시보드(Phase 2)로 병원이 CMS에 입장하는 문을 열고, 프로필/의료진/상담(Phase 3)으로 일상 운영 기능을 완성하고, 채팅/광고/프리미엄(Phase 4)으로 비즈니스 전체 루프를 닫는다. Phase 5는 PRD 문서 정리로 마무리한다.

## Phases

- [ ] **Phase 1: CMS Critical 수정** - 채팅방 자동 생성·세션·인증·병원 상세·프리미엄 부여 5개 핵심 버그/누락 수정
- [ ] **Phase 2: 병원 인증 + 대시보드** - 병원 로그인, 역할 분기 사이드바, 병원 전용 대시보드 구축
- [ ] **Phase 3: 병원 프로필 + 의료진 + 상담** - 프로필 편집, 의료진 CRUD, 상담 요청 확인 및 응답
- [ ] **Phase 4: 병원 채팅 + 광고 + 프리미엄** - 채팅 목록/방, 방문 예약, 광고 캠페인, 프리미엄 상태
- [ ] **Phase 5: PRD 리팩토링** - 17개 PRD 파일을 3개로 통합 정리

## Phase Details

### Phase 1: CMS Critical 수정
**Goal**: 코디네이터가 매칭을 완료하면 채팅방이 자동 생성되고, 세션/인증이 실제 DB 기반으로 동작하며, 어드민이 병원 상세를 조회하고 프리미엄을 부여할 수 있다
**Depends on**: Nothing (first phase)
**Requirements**: CMS-01, CMS-02, CMS-03, CMS-04, CMS-05
**Success Criteria** (what must be TRUE):
  1. 코디네이터가 매칭을 확정하면 해당 유저-병원 채팅방이 자동으로 생성된다
  2. CMS 로그인 화면에서 실제 DB 계정으로 로그인하고, 세션이 실제 로그인 유저 ID로 동작한다 (하드코딩 adminId=1 제거됨)
  3. 어드민 CMS에서 병원 상세 페이지를 열면 병원 정보·전문분야·의료진을 조회할 수 있다
  4. 어드민이 특정 병원 사용자에게 프리미엄 구독을 부여하고 티어·만료일을 확인할 수 있다
**Plans**: 2 plans
Plans:
- [ ] 01-PLAN-1.md — DB 기반 인증 + 세션 정상화 + 채팅방 자동 생성 (CMS-01, CMS-02, CMS-03)
- [ ] 01-PLAN-2.md — 병원 상세 페이지 + 프리미엄 구독 부여 (CMS-04, CMS-05)

### Phase 2: 병원 인증 + 대시보드
**Goal**: 병원 사용자가 /hospital-login으로 로그인하면 병원 전용 사이드바와 대시보드를 볼 수 있고, 어드민 라우트에는 접근이 차단된다
**Depends on**: Phase 1
**Requirements**: HAUTH-01, HAUTH-02, HAUTH-03, HDASH-01, HDASH-02, HDASH-03
**Success Criteria** (what must be TRUE):
  1. 병원 계정으로 /hospital-login 페이지에서 로그인하면 병원 전용 사이드바가 표시됨
  2. 같은 CMS 앱에서 admin 계정은 기존 어드민 사이드바를, hospital 계정은 병원 사이드바를 각각 표시한다
  3. 병원 계정이 어드민 전용 라우트(/admin/*)에 접근하면 자동으로 차단된다
  4. 병원 대시보드에서 신규 매칭 수, 활성 채팅 수, 평균 응답률, 평점 4개 통계를 한눈에 확인할 수 있다
  5. 대시보드에서 최근 상담 요청 3건과 최근 리뷰 3건 미리보기를 확인할 수 있다
**Plans**: 1 plan
Plans:
- [x] 02-01-PLAN.md — 병원 로그인 + 역할 분기 미들웨어 + 병원 사이드바 + 대시보드 (HAUTH-01~03, HDASH-01~03)

### Phase 3: 병원 프로필 + 의료진 + 상담
**Goal**: 병원 사용자가 CMS에서 병원 프로필을 직접 편집하고, 의료진을 관리하고, 매칭된 상담 요청에 응답을 작성할 수 있다
**Depends on**: Phase 2
**Requirements**: HPROF-01, HPROF-02, HPROF-03, HPROF-04, HDOC-01, HDOC-02, HDOC-03, HDOC-04, HCONS-01, HCONS-02, HCONS-03, HCONS-04
**Success Criteria** (what must be TRUE):
  1. 병원 사용자가 주소·전화·영업시간·소개(2,000자)를 편집하고 저장할 수 있다 (병원명은 읽기 전용)
  2. 병원 대표 이미지와 갤러리(최대 10장)를 드래그앤드롭으로 순서를 바꾸고 저장할 수 있다
  3. 전문분야를 칩 형태로 추가하거나 제거할 수 있다
  4. 의료진을 추가·수정·삭제하고, 드래그앤드롭으로 순서를 변경할 수 있다
  5. 상태별 탭(전체/대기/응답완료)으로 상담 요청을 필터링하고, 상세 내용(카테고리, 부위, 시기, 사진, 메모)을 확인한 후 응답(소개 60자 + 경험 60자 + 메시지 10~3000자)을 작성해 발송할 수 있다
**Plans**: 3 plans
Plans:
- [ ] 03-PLAN-1.md — 프로필 편집 (기본정보 + 이미지 DnD + 전문분야 칩 + 소개) (HPROF-01~04)
- [ ] 03-PLAN-2.md — 의료진 CRUD + 드래그앤드롭 정렬 (HDOC-01~04)
- [ ] 03-PLAN-3.md — 상담 요청 목록 탭 필터 + 상세 + 응답 발송 (HCONS-01~04)

### Phase 4: 병원 채팅 + 광고 + 프리미엄
**Goal**: 병원 사용자가 CMS에서 유저와 채팅하고, 방문 예약 카드를 발송하고, 광고 캠페인을 직접 관리하고, 자신의 프리미엄 구독 상태를 확인할 수 있다
**Depends on**: Phase 3
**Requirements**: HCHAT-01, HCHAT-02, HCHAT-03, HCHAT-04, HCHAT-05, HAD-01, HAD-02, HAD-03, HAD-04, HAD-05, HPREM-01, HPREM-02
**Success Criteria** (what must be TRUE):
  1. 채팅 목록에서 각 채팅방의 안읽음 수, 마지막 메시지, 시간을 확인하고 채팅방에 입장할 수 있다
  2. 채팅방에서 메시지를 송수신하고(polling 기반), 방문 예약 카드(날짜/시간/메모)를 발송하며, 유저의 수락/거절 상태를 확인할 수 있다
  3. 채팅방 상단에 면책 고지 배너가 항상 고정 표시된다
  4. 광고 크레딧 잔액을 확인하고, 크리에이티브를 등록하고, 캠페인(기간/일예산/크리에이티브)을 생성하고, 캠페인별 성과 리포트(노출/클릭/소비)를 확인하고, 일시정지/재개를 할 수 있다
  5. 현재 프리미엄 구독 티어·만료일과 프리미엄 혜택 안내를 확인할 수 있다
**Plans**: 3 plans
Plans:
- [ ] 04-PLAN-1.md — 채팅 목록 + 채팅방 + 방문 예약 카드 + 면책 고지 (HCHAT-01~05)
- [ ] 04-PLAN-2.md — 광고 크레딧/크리에이티브/캠페인/리포트/일시정지 (HAD-01~05)
- [ ] 04-PLAN-3.md — 프리미엄 구독 상태 + 혜택 안내 (HPREM-01~02)

### Phase 5: PRD 리팩토링
**Goal**: 분산된 17개 PRD 파일이 PRD.md, FEATURES.md, DESIGN.md 3개로 통합되어 프로젝트 문서를 한 곳에서 참조할 수 있다
**Depends on**: Phase 4
**Requirements**: PRD-01
**Success Criteria** (what must be TRUE):
  1. PRD/ 디렉토리에 PRD.md, FEATURES.md, DESIGN.md 3개 파일만 존재하고, 기존 17개 파일의 내용이 적절한 파일에 통합되어 있다
  2. 각 통합 파일에서 이전 PRD들의 핵심 내용을 참조할 수 있다
**Plans**: TBD

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. CMS Critical 수정 | 0/2 | Not started | - |
| 2. 병원 인증 + 대시보드 | 0/1 | Not started | - |
| 3. 병원 프로필 + 의료진 + 상담 | 0/3 | Not started | - |
| 4. 병원 채팅 + 광고 + 프리미엄 | 0/3 | Not started | - |
| 5. PRD 리팩토링 | 0/TBD | Not started | - |
