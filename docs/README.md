# LetMeIn - 성형 상담 매칭 플랫폼

## 1. 프로젝트 개요

**한 줄 정의:** 성형 상담 요청을 등록하면 조건에 맞는 병원이 자동 매칭되어 상담 안내를 보내는 마켓플레이스.

### 대상 사용자

| 역할 | 설명 |
|------|------|
| 일반 유저 | 성형 상담 요청 등록, 병원 탐색, 채팅, 후기 열람 |
| 병원 (의료진/상담실장) | 매칭된 요청 확인, 상담 안내 발송, 채팅 응대 |
| CMS 관리자 | 병원 승인, 콘텐츠 관리, 신고 처리, 통계 |

### 핵심 가치

- 유저: 여러 병원의 상담 안내를 한 곳에서 비교
- 병원: 관심 높은 잠재 고객에게 직접 도달
- 플랫폼: 매칭 무료, 광고/프리미엄 구독 수익 모델

### 핵심 플로우

```
유저: 상담 요청 등록 → 시스템: 병원 자동 매칭 (최대 5곳)
→ 병원: 상담 안내 발송 → 유저: 채팅으로 상세 소통 → 유저: 병원 선택
```

---

## 2. 기술 스택

| 레이어 | 기술 | 비고 |
|--------|------|------|
| App | Flutter 3.x | iOS / Android 동시 지원 |
| 상태관리 | Riverpod 2.x | code generation 사용 |
| 라우팅 | GoRouter | 딥링크, 리다이렉트 가드 |
| 모델 | Freezed | 불변 모델 생성 |
| API 서버 | Next.js | API Routes / Server Actions |
| 관리자 CMS | Next.js | 백엔드와 같은 프로젝트 내 웹 |
| ORM | Prisma 6.x | PostgreSQL 연결 |
| DB | PostgreSQL 16 + PostGIS | 위치 기반 검색 (GiST 인덱스) |
| DB 풀링 | PgBouncer | letmein 전용, Transaction mode |
| 캐시 | Redis | 피드 JSON 캐시, JWT 캐시, 매칭 응답률 (DB fallback 설계) |
| 작업 큐 | BullMQ (Redis 위) | 이미지 비동기 처리, DLQ + 3회 재시도 |
| 실시간 채팅 | Centrifugo 5.x | 기존 ws.codeb.kr 재사용, 네임스페이스 분리 |
| 파일 저장 | Cloudflare R2 | S3 호환, presigned URL, private/public 버킷 |
| 푸시 | FCM + APNs | Next.js에서 발송, 야간 무음 + 아침 요약 |
| 인증 | JWT (Redis 캐시 + DB 저장) | 카카오 로그인 + Apple 로그인 (iOS만) |
| 배포 | CodeB CI/CD | Blue-Green, Docker |

### 2.1 인프라 배치도 (CodeB 서버 재사용, 서버 추가 없음)

```
App 서버 (158.247.203.55)
├── [기존] workb 컨테이너              ← 변경 없음
├── [추가] letmein-api                 ← Next.js (API + CMS 웹)
└── [추가] letmein-worker              ← BullMQ 이미지 처리 워커

Streaming 서버 (141.164.42.213)
└── [기존] Centrifugo 5.x
    ├── namespace: workb               ← 변경 없음
    └── namespace: letmein             ← 추가 (JWT secret 별도)

Storage 서버 (64.176.226.119)
├── PostgreSQL :5432
│   ├── DB: workb                      ← 변경 없음
│   └── DB: letmein                    ← 추가 (PostGIS 확장)
├── PgBouncer :6432                    ← 추가 (letmein 전용, Transaction mode)
│   └── pool: letmein (max 30, reserve 5)
└── Redis
    ├── prefix: workb:                 ← 변경 없음
    └── prefix: letmein:               ← 추가

Cloudflare R2
├── bucket: letmein-private            ← 상담/채팅 사진 (서명 URL, 1시간 만료)
└── bucket: letmein-public             ← 커뮤니티/병원/리뷰 (CDN)
```

기존 서비스 영향: 없음 (Caddy, PowerDNS, workb 일체 변경 없음)

---

## 3. 프로젝트 구조

### 3.1 Flutter (Feature-based)

```
lib/
├── main.dart
├── app.dart                          # MaterialApp, GoRouter 설정
├── core/
│   ├── constants/
│   │   ├── colors.dart               # 디자인 시스템 컬러
│   │   ├── typography.dart           # 텍스트 스타일
│   │   └── api_endpoints.dart
│   ├── network/
│   │   ├── dio_client.dart           # Dio 인스턴스, 인터셉터
│   │   └── api_exception.dart
│   ├── storage/
│   │   ├── local_db.dart             # drift DB
│   │   └── secure_storage.dart       # 토큰 저장
│   ├── router/
│   │   ├── app_router.dart           # GoRouter 정의
│   │   └── guards.dart               # 인증/나이 가드
│   └── utils/
│       ├── keyword_filter.dart       # 금액/연락처 필터
│       └── validators.dart
├── features/
│   ├── auth/
│   │   ├── data/                     # repository, dto
│   │   ├── domain/                   # model, usecase
│   │   └── presentation/            # screen, widget, provider
│   ├── consultation/                 # 상담 요청 등록/목록/상세
│   │   ├── data/
│   │   ├── domain/
│   │   └── presentation/
│   ├── matching/                     # 매칭 결과, 병원 안내 카드
│   │   ├── data/
│   │   ├── domain/
│   │   └── presentation/
│   ├── hospital/                     # 병원 탐색, 상세, 리뷰
│   │   ├── data/
│   │   ├── domain/
│   │   └── presentation/
│   ├── chat/                         # Centrifugo 연동 채팅
│   │   ├── data/
│   │   ├── domain/
│   │   └── presentation/
│   ├── community/                    # 비포앤애프터, 후기, 커뮤니티
│   │   ├── data/
│   │   ├── domain/
│   │   └── presentation/
│   └── mypage/                       # 프로필, 설정, 내 상담 내역
│       ├── data/
│       ├── domain/
│       └── presentation/
├── shared/
│   ├── widgets/                      # 공용 위젯 (Button, Card, Input 등)
│   └── providers/                    # 공용 프로바이더 (auth state 등)
└── gen/                              # 코드 생성 파일 (freezed, riverpod)
```

### 3.2 Server (Next.js)

```
server/
├── src/
│   ├── app/
│   │   └── api/
│   │       └── v1/
│   │           ├── auth/                  # 카카오/Apple 로그인, JWT
│   │           ├── consultations/         # 상담 요청 CRUD
│   │           ├── matching/              # 매칭 로직, 병원 배정
│   │           ├── hospitals/             # 병원 정보, 검색
│   │           ├── chats/                 # Centrifugo 토큰 발급, 메시지 저장
│   │           ├── posts/                 # 커뮤니티 (후기, 비포앤애프터)
│   │           ├── reviews/               # 리뷰 CRUD
│   │           ├── notifications/         # 알림 목록, 읽음 처리
│   │           ├── images/                # R2 presigned URL 발급
│   │           ├── bookmarks/             # 찜 추가/삭제, 병원 비교
│   │           ├── reports/               # 신고
│   │           ├── users/                 # 사용자 정보
│   │           └── admin/                 # CMS API (병원 승인, 신고, 금칙어)
│   ├── services/
│   │   ├── matching.service.ts            # 매칭 알고리즘 (PostGIS)
│   │   ├── keyword-filter.service.ts      # 금칙어 필터 (DB 사전 + Redis 캐시)
│   │   ├── centrifugo.service.ts          # Centrifugo HTTP API (letmein 네임스페이스)
│   │   ├── notification.service.ts        # FCM/APNs + 야간 보류 + Presence 중복 방지
│   │   └── image.service.ts               # BullMQ 이미지 처리 워커
│   ├── middleware/
│   │   ├── auth.ts                        # JWT 검증 (Redis 캐시 → DB fallback)
│   │   ├── age-verify.ts                  # 18세 미만 차단
│   │   └── hospital-verify.ts             # 병원 인증 상태 확인
│   └── lib/
│       ├── prisma.ts                      # Prisma 클라이언트 (PgBouncer 연결)
│       ├── redis.ts                       # Redis 클라이언트
│       └── bullmq.ts                      # BullMQ 큐/워커 설정
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── worker/
│   └── image-worker.ts                    # BullMQ 이미지 처리 워커 (별도 프로세스)
├── Dockerfile
├── Dockerfile.worker                      # 이미지 워커 전용
└── package.json
```

---

## 4. 디자인 시스템

### 4.1 컬러 팔레트

**기본 테마: Premium Dark / 라이트 테마 옵션 제공**

| 토큰 | Dark 값 | Light 값 | 용도 |
|------|---------|----------|------|
| `bg-primary` | `#0D0D0D` | `#FAFAFA` | 앱 배경 |
| `bg-secondary` | `#1A1A1A` | `#F0F0F0` | 섹션 배경 |
| `surface` | `#1E1E2E` | `#FFFFFF` | 카드, 시트 |
| `surface-elevated` | `#252535` | `#F8F8F8` | 모달, 드롭다운 |
| `accent` | `#C0392B` | `#C0392B` | 주요 CTA, 강조 |
| `accent-pressed` | `#A93226` | `#A93226` | 버튼 pressed 상태 |
| `sub-accent` | `#D4A574` | `#B8956A` | 프리미엄 라벨, 골드 뱃지 |
| `text-primary` | `#F5F5F5` | `#1A1A1A` | 본문 텍스트 |
| `text-secondary` | `#9E9E9E` | `#757575` | 부가 정보 |
| `text-disabled` | `#616161` | `#BDBDBD` | 비활성 텍스트 |
| `divider` | `#2A2A3A` | `#E0E0E0` | 구분선 |
| `success` | `#27AE60` | `#27AE60` | 성공 상태 |
| `warning` | `#F39C12` | `#F39C12` | 경고 |
| `error` | `#E74C3C` | `#E74C3C` | 에러 |
| `ad-label` | `#F39C12` | `#E67E22` | 광고 라벨 (의료법 56조) |

### 4.2 타이포그래피

**폰트: Pretendard** (가변 폰트, 한/영 최적화)

| 토큰 | 크기 | 굵기 | 행간 | 용도 |
|------|------|------|------|------|
| `h1` | 24px | Light (300) | 1.4 | 화면 제목 |
| `h2` | 18px | Medium (500) | 1.4 | 섹션 제목 |
| `h3` | 16px | Medium (500) | 1.4 | 카드 제목 |
| `body1` | 14px | Regular (400) | 1.6 | 본문 |
| `body2` | 13px | Regular (400) | 1.5 | 보조 본문 |
| `caption` | 12px | Regular (400) | 1.4 | 부가 정보, 타임스탬프 |
| `cta` | 16px | SemiBold (600) | 1.0 | CTA 버튼 텍스트 |
| `label` | 11px | Medium (500) | 1.2 | 뱃지, 태그 |

### 4.3 컴포넌트 스펙

**Card (상담 안내 카드)**
- 배경: `surface`
- border-radius: 16px
- padding: 20px
- 그림자: 없음 (다크 테마), `0 2px 8px rgba(0,0,0,0.08)` (라이트)
- 병원 로고: 48x48, border-radius 12px
- 간격: 항목 간 12px

**CTA Button (Primary)**
- 배경: `accent` (`#C0392B`)
- 텍스트: `#FFFFFF`, `cta` 토큰
- height: 52px
- border-radius: 12px
- pressed: `accent-pressed`
- disabled: opacity 0.4

**CTA Button (Secondary)**
- 배경: transparent
- border: 1px solid `divider`
- 텍스트: `text-primary`, `cta` 토큰
- height: 48px
- border-radius: 12px

**Chip (카테고리/시술 태그)**
- 배경: `surface-elevated`
- 텍스트: `text-secondary`, `label` 토큰
- height: 32px
- padding: 0 12px
- border-radius: 16px
- 선택 시: border 1px `accent`, 텍스트 `accent`

**Bottom Navigation**
- 배경: `bg-primary`
- 상단 border: 1px `divider`
- 아이콘: 24x24
- 라벨: `caption` 토큰
- 비활성: `text-disabled`, 활성: `accent`
- 탭: 홈, 병원, 내 상담, 커뮤니티, MY

**Input Field**
- 배경: `surface`
- border: 1px `divider`, focus 시 `accent`
- height: 48px
- padding: 0 16px
- border-radius: 10px
- placeholder: `text-disabled`
- 에러 상태: border `error`, 하단 에러 메시지 `caption` 토큰 `error` 색상

**Avatar (병원 프로필)**
- 크기: S(32px), M(48px), L(72px)
- border-radius: 50%
- fallback: 병원명 첫 글자, `surface-elevated` 배경

---

## 5. 핵심 제약 사항

### 5.1 법적 제약

| 법률 | 조항 | 구현 요구사항 |
|------|------|--------------|
| 의료법 27조 | 매칭 무료, 수수료 금지 | 매칭에 대한 병원 과금 불가. 수익은 광고/구독만 허용 |
| 의료법 56조 | 의료 광고 라벨 필수 | 유료 노출 콘텐츠에 `[광고]` 라벨 상시 표시 (색상: `ad-label`) |
| 의료법 56조 | 치료 효과 보장 표현 금지 | "100% 성공", "확실한 효과" 등 키워드 필터링 |
| 개인정보보호법 | 민감정보 별도 동의 | 신체 사진 업로드 시 별도 동의 UI 필수 (체크박스 + 전문) |
| 개인정보보호법 | 제3자 제공 동의 | 상담 요청 시 병원에 정보 전달 동의 UI 필수 |
| 청소년보호법 | 미성년자 보호 | 만 18세 미만 가입 차단 (본인인증 기반) |

### 5.2 금액 기재 절대 금지

- 채팅, 상담 안내, 후기, 프로필 등 **모든 UGC에 금액 필터 적용**
- 필터 대상 패턴: `\d+만원`, `\d+원`, `\d+만`, `가격`, `비용`, `할인`, `이벤트가`, `특가`
- 필터 동작: 발송 차단 + 발신자에게 안내 메시지 표시
- 서버/클라이언트 양쪽에서 이중 필터링
- 필터 우회 시도 (예: "삼백만") 대응: 한글 숫자 + 단위 조합도 필터링
- 금칙어 사전(Dictionary) 테이블을 DB + Redis 캐시에 운영
- 관리자 CMS에서 즉시 금칙어 추가/삭제 가능 (Redis 즉시 갱신)
- 정규식 우회 대응: "공일공", "ㅋr톡", "오만원" 등 한국어 변형 패턴 포함

### 5.3 채팅 제약

- 면책 고지 채팅방 상단 고정: "본 채팅은 상담 참고용이며, 정확한 진단은 대면 진료를 통해 확인하세요."
- 외부 연락처 유도 차단: 전화번호, 카카오톡 ID, URL 패턴 필터링
- 채팅 보관 기간: 상담 종료 후 1년, 이후 자동 삭제
- 채팅방 자동 만료: 마지막 메시지 후 30일 경과 시 비활성화

### 5.4 회원 탈퇴

- 탈퇴 요청 후 **7일 유예** 기간 적용 (유예 중 재로그인 시 탈퇴 철회)
- 유예 만료 후 개인정보 영구 삭제 (채팅 기록, 상담 요청, 프로필 사진 포함)
- 탈퇴 후 동일 휴대폰 번호로 재가입은 30일 후 가능

### 5.5 Rate Limit

- 인증 유저: 100 req/min per IP
- 비인증: 20 req/min per IP
- 초과 시 429 Too Many Requests

### 5.6 Claude Code 구현 금지 목록

코드 작성 시 아래 사항을 절대 위반하지 않는다:

```
NEVER: 금액/가격 관련 필드를 DB 스키마나 API 응답에 포함
NEVER: 매칭 수수료, 중개 수수료 관련 로직 구현
NEVER: 미성년자 가입을 허용하는 우회 경로
NEVER: 민감정보(신체 사진) 동의 없이 업로드 처리
NEVER: 광고 콘텐츠에 [광고] 라벨 누락
NEVER: 채팅 면책 고지 비표시 또는 dismiss 가능하게 구현
NEVER: 외부 연락처(전화번호, SNS ID) 필터 없이 채팅 메시지 전송
NEVER: 치료 효과 보장 문구를 하드코딩
NEVER: 사용자 신체 사진을 공개 버킷에 저장 (반드시 private + presigned URL)
NEVER: 병원 인증 상태 미확인 상태에서 매칭 참여 허용
```

---

## 6. UX 아키텍처

### 6.1 민감정보 심리적 안전감
- 사진 업로드 전 안내: "사진은 매칭된 병원만 볼 수 있어요", "상담 종료 후 자동 삭제됩니다"
- 암호화 아이콘 + 보안 배지 시각적 표시
- 민감정보 동의 모달 (동의하고 계속하기 / 취소)
- "사진 없이 상담하기" 선택지 제공

### 6.2 사용자 식별
- 닉네임 기반 활동, 실명 비공개
- 상담 매칭 시 병원에 노출되는 정보: 닉네임 + 나이대 + 관심시술만
- 채팅에서 실명은 유저가 자발적으로 공유

### 6.3 병원 비교 (찜 기능)
- 병원 상세에서 "찜" 가능
- 찜한 병원 복수 선택 → 비교 화면 (전문분야, 평점, 리뷰 수, 거리, 응답시간 나란히 비교)

### 6.4 상담 상태 실시간 피드백
- 3단계 스텝 인디케이터: 상담 접수 → 병원 확인 → 상담 진행
- 각 단계별 예상 소요시간 표시
- Centrifugo WS로 실시간 상태 업데이트

### 6.5 후기 신뢰도
- 인증 배지: 매칭 → 채팅 → 방문 확인 완료 유저만 "인증 후기" 배지
- 광고 콘텐츠 `[광고]` 라벨 필수 (의료법)
- 피드 기본 정렬: 최신순

### 6.6 로딩 최적화 5계층
1. 스켈레톤 UI → 즉시 레이아웃 표시 (0ms)
2. Redis JSON 캐시 → 피드 데이터 즉시 반환 (~5ms)
3. WebP 썸네일 300px → 경량 이미지 우선 로딩 (~30KB)
4. 원본 지연 로딩 → 상세 진입 시 800px, 확대 시 2048px
5. R2 CDN → 엣지 캐시로 이미지 전송 최적화

### 6.7 피드 썸네일 로테이션
- 게시글 사진 전체에 대해 썸네일 생성
- 일자 기반 로테이션: `thumbnailIndex = hash(postId + 날짜) % thumbnails.length`
- 같은 글이 매일 다른 사진으로 노출 → 신선함 유지

### 6.8 야간 푸시 배려
- 기본값 22:00~08:00 무음, 설정에서 시간대 조절 가능
- 아침 8시 일괄 요약 발송: "밤사이 N곳의 병원에서 상담 안내가 도착했어요"

### 6.9 폼 상태 보존
- 5단계 폼 작성 중 앱 종료 → 로컬 저장소 임시 저장
- 재진입 시 "작성 중인 상담이 있어요. 이어서 할까요?" 안내
- 뒤로가기 시 이전 단계 입력값 보존

---

## 7. 용어 사전

| 용어 | 영문 키 | 정의 |
|------|---------|------|
| 상담 요청 | `consultation_request` | 유저가 원하는 시술/부위/지역을 명시하여 등록하는 요청 |
| 매칭 | `matching` | 상담 요청에 적합한 병원을 시스템이 자동 배정하는 과정 |
| 상담 안내 | `consultation_guide` | 병원이 매칭된 유저에게 보내는 안내 (금액 제외) |
| 병원 탐색 | `hospital_browse` | 유저가 직접 병원을 검색/필터하여 조회하는 기능 |
| 비포앤애프터 | `before_after` | 시술 전후 사진 기반 콘텐츠 (민감정보 동의 필수) |
| 프리미엄 병원 | `premium_hospital` | 광고 구독 중인 병원 (상단 노출, [광고] 라벨 필수) |
| 채팅방 | `chat_room` | 유저-병원 1:1 상담 채널 (Centrifugo 채널) |
| 시술 카테고리 | `procedure_category` | 눈, 코, 윤곽, 가슴, 지방흡입, 피부 등 대분류 |
| 응답률 | `response_rate` | 병원의 매칭 요청 대비 상담 안내 발송 비율 |
| 본인인증 | `identity_verification` | 나이 확인 목적의 휴대폰/PASS 인증 |

---

## 8. 알림 매트릭스

### 8.1 유저 알림

| 이벤트 | 채널 | 제목 | 본문 템플릿 |
|--------|------|------|------------|
| 매칭 완료 | Push + InApp | 상담 안내 도착 | "{hospital_name}에서 상담 안내를 보냈어요" |
| 새 채팅 메시지 | Push + InApp | 새 메시지 | "{hospital_name}: {message_preview}" |
| 추가 병원 매칭 | Push + InApp | 새로운 병원 매칭 | "새로운 병원이 상담 안내를 보냈어요" |
| 채팅방 만료 임박 | Push | 채팅 만료 예정 | "{hospital_name} 채팅이 3일 후 만료돼요" |
| 채팅방 만료 | InApp | 채팅 종료 | "{hospital_name} 채팅이 종료되었어요" |
| 후기 작성 요청 | Push | 후기 작성 | "상담은 어떠셨나요? 후기를 남겨주세요" |
| 상담 요청 만료 | Push + InApp | 상담 요청 종료 | "등록한 상담 요청이 만료되었어요" |

### 8.2 병원 알림

| 이벤트 | 채널 | 제목 | 본문 템플릿 |
|--------|------|------|------------|
| 새 매칭 배정 | Push + InApp | 새 상담 요청 | "새로운 {category} 상담 요청이 도착했어요" |
| 유저 채팅 메시지 | Push + InApp | 새 메시지 | "{user_nickname}: {message_preview}" |
| 매칭 응답 기한 임박 | Push | 응답 기한 알림 | "상담 안내 발송 기한이 12시간 남았어요" |
| 매칭 응답 기한 만료 | InApp | 매칭 만료 | "응답 기한이 지나 매칭이 취소되었어요" |
| 새 후기 등록 | Push + InApp | 새 후기 | "새로운 후기가 등록되었어요" |
| 프리미엄 만료 임박 | Push | 구독 만료 예정 | "프리미엄 구독이 7일 후 만료돼요" |

### 8.3 알림 설정

- 유저/병원 모두 항목별 Push ON/OFF 가능
- InApp 알림은 항상 표시 (OFF 불가)
- 야간 시간대 (22:00~08:00) Push 자동 보류, 아침 8시 일괄 발송
- 매칭 관련 알림은 OFF 불가 (서비스 핵심 기능)

---

## 9. IA (Information Architecture) 페이지 넘버링

> 디자인 시안(.pen) 확정 후 작성 예정

### 넘버링 규칙

- 바텀 탭 기준 대분류: `0.공통` / `1.홈` / `2.병원` / `3.내 상담` / `4.커뮤니티` / `5.MY` / `6.병원측` / `7.관리자 CMS`
- 하위 화면은 소수점으로 확장: `2.2.1` (병원 상세 > 정보 탭)
- 모달/바텀시트는 부모 화면 번호 + M: `3.1.4-M1` (민감정보 동의 모달)

### 페이지 맵

| 번호 | 화면명 | 설명 | API 매핑 | 디자인 Node ID |
|------|--------|------|----------|---------------|
| -    | -      | -    | -        | -             |

> ※ .pen 디자인 시안 분석 후 전체 화면 기준으로 확정
> ※ QA 버그 리포트, 개발 작업, 디자인 시안 간 동일 넘버링 사용
> ※ 디자인 Node ID를 함께 기록하여 .pen 파일과 1:1 매핑
