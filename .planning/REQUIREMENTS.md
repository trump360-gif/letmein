# Requirements: Black Label — 병원 페르소나 + CMS 정상화

**Defined:** 2026-03-30
**Core Value:** 병원이 CMS 웹 포탈에서 전체 비즈니스를 운영할 수 있어야 한다.

## v1 Requirements

### CMS Critical 수정

- [ ] **CMS-01**: 코디네이터 매칭 시 채팅방 자동 생성
- [ ] **CMS-02**: 세션 관리 정상화 (하드코딩 adminId=1 → 실제 세션 유저)
- [ ] **CMS-03**: DB 기반 관리자 인증 (하드코딩 admin@admin.com/1234 제거)
- [ ] **CMS-04**: 병원 상세 페이지 (정보 확인, 전문분야, 의료진 조회)
- [ ] **CMS-05**: 프리미엄 구독 부여/관리 기능

### 병원 인증 및 역할 분기

- [x] **HAUTH-01**: 병원 전용 로그인 페이지 (/hospital-login)
- [x] **HAUTH-02**: 로그인 후 역할(admin/hospital)에 따라 다른 사이드바/대시보드 표시
- [x] **HAUTH-03**: 병원 역할은 hospital 전용 라우트만 접근 가능 (admin 라우트 차단)

### 병원 대시보드

- [x] **HDASH-01**: 대시보드 메인 — 신규 매칭 수, 활성 채팅 수, 평균 응답률, 평점 표시
- [x] **HDASH-02**: 대시보드에서 최근 상담 요청 3건 미리보기
- [x] **HDASH-03**: 대시보드에서 최근 리뷰 3건 미리보기

### 병원 프로필 관리

- [ ] **HPROF-01**: 병원 기본정보 조회/편집 (이름 읽기전용, 주소/전화/영업시간 편집)
- [ ] **HPROF-02**: 병원 대표 이미지 + 갤러리 관리 (최대 10장, 드래그앤드롭 순서 변경)
- [ ] **HPROF-03**: 전문분야 칩 추가/제거
- [ ] **HPROF-04**: 소개 텍스트 편집 (2,000자)

### 병원 의료진 관리

- [x] **HDOC-01**: 의료진 목록 조회
- [x] **HDOC-02**: 의료진 추가 (이름, 전문분야, 경력)
- [x] **HDOC-03**: 의료진 수정/삭제
- [x] **HDOC-04**: 의료진 순서 드래그앤드롭 변경

### 병원 상담 관리

- [x] **HCONS-01**: 매칭된 상담 요청 목록 조회 (상태별 탭 필터)
- [x] **HCONS-02**: 상담 요청 상세 확인 (카테고리, 부위, 시기, 사진, 메모)
- [x] **HCONS-03**: 상담 응답 작성 (소개 60자 + 경험 60자 + 메시지 10~3000자)
- [x] **HCONS-04**: 응답 발송 후 상태 변경 확인

### 병원 채팅

- [x] **HCHAT-01**: 병원 채팅방 목록 조회 (안읽음 수, 마지막 메시지, 시간)
- [x] **HCHAT-02**: 채팅방 메시지 실시간 송수신 (Centrifugo WebSocket 또는 polling)
- [x] **HCHAT-03**: 방문 예약 카드 발송 (날짜/시간/메모)
- [x] **HCHAT-04**: 유저 수락/거절 상태 확인
- [x] **HCHAT-05**: 면책 고지 배너 상단 고정

### 병원 광고 관리

- [x] **HAD-01**: 광고 크레딧 잔액 확인
- [x] **HAD-02**: 광고 크리에이티브 등록 (이미지 + 헤드라인)
- [x] **HAD-03**: 광고 캠페인 생성 (기간, 일 예산, 크리에이티브 선택)
- [x] **HAD-04**: 캠페인 목록 + 성과 리포트 (노출, 클릭, 소비)
- [x] **HAD-05**: 캠페인 일시정지/재개

### 병원 프리미엄

- [x] **HPREM-01**: 현재 구독 상태 확인 (티어, 만료일)
- [x] **HPREM-02**: 프리미엄 혜택 안내 페이지

### PRD 리팩토링

- [ ] **PRD-01**: 17개 PRD 파일 → 3개로 통합 (PRD.md, FEATURES.md, DESIGN.md)

## v2 Requirements (이번 마일스톤 이후)

- **V2-01**: Flutter 앱 병원 화면 (앱에서도 관리 가능)
- **V2-02**: FCM 실제 연동 (현재 placeholder)
- **V2-03**: Apple 로그인 앱 연동 (서버만 구현됨)
- **V2-04**: B/A 슬라이더 비교 뷰
- **V2-05**: 상담 임시저장 (SQLite)
- **V2-06**: 라이트 테마 토글

## Out of Scope

| Feature | Reason |
|---------|--------|
| Flutter 앱 병원 화면 | 병원은 CMS 웹 전용 (v2) |
| 자동 매칭 알고리즘 | 코디네이터 수동 매칭 유지 |
| 결제 시스템 | 어드민 수동 부여 |
| Centrifugo CMS 연동 | 채팅은 polling으로 구현 (v2에서 WebSocket) |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| CMS-01~05 | Phase 1 | Pending |
| HAUTH-01~03 | Phase 2 | Pending |
| HDASH-01~03 | Phase 2 | Pending |
| HPROF-01~04 | Phase 3 | Pending |
| HDOC-01~04 | Phase 3 | Pending |
| HCONS-01~04 | Phase 3 | Pending |
| HCHAT-01~05 | Phase 4 | Pending |
| HAD-01~05 | Phase 4 | Pending |
| HPREM-01~02 | Phase 4 | Pending |
| PRD-01 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 38 total
- Mapped to phases: 38
- Unmapped: 0

---
*Requirements defined: 2026-03-30*
*Last updated: 2026-03-30 after initialization*
