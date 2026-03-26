# API 설계 — CMS Admin
> Next.js API Routes 기반 REST API | prefix: `/api/v1`

---

## 설계 원칙

- **인증**: 모든 API는 세션 쿠키 또는 Bearer 토큰 필요 (공개 API 제외)
- **권한**: 어드민 API는 역할(Role) 기반 권한 검사
- **응답 포맷**: 일관된 JSON 구조
- **에러**: HTTP 상태 코드 + 에러 코드 조합
- **페이지네이션**: cursor 기반 또는 offset 기반 선택

### 응답 포맷

```ts
// 성공
{
  "success": true,
  "data": { ... },
  "meta": {           // 목록 조회 시
    "total": 100,
    "page": 1,
    "limit": 20,
    "hasNext": true
  }
}

// 에러
{
  "success": false,
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "사용자를 찾을 수 없습니다.",
    "field": "email"  // 유효성 검사 에러 시
  }
}
```

### HTTP 상태 코드

| 코드 | 용도 |
|------|------|
| 200 | 성공 |
| 201 | 생성 성공 |
| 400 | 잘못된 요청 (유효성 검사 실패) |
| 401 | 인증 필요 |
| 403 | 권한 없음 |
| 404 | 리소스 없음 |
| 409 | 충돌 (중복 등) |
| 429 | Rate limit 초과 |
| 500 | 서버 에러 |

---

## 인증 API

### 사용자 인증

```
POST   /api/v1/auth/signup              회원가입
POST   /api/v1/auth/signin              로그인
POST   /api/v1/auth/signout             로그아웃
POST   /api/v1/auth/refresh             토큰 갱신
GET    /api/v1/auth/me                  내 정보 조회
POST   /api/v1/auth/email/verify        이메일 인증 (토큰)
POST   /api/v1/auth/email/resend        인증 메일 재발송
POST   /api/v1/auth/password/forgot     비밀번호 재설정 요청
POST   /api/v1/auth/password/reset      비밀번호 재설정 (토큰)
POST   /api/v1/auth/social/:provider    소셜 로그인 (kakao|google|naver...)
```

**POST /api/v1/auth/signup**
```ts
// Request
{
  email: string
  password: string
  nickname: string
  terms_agreed: number[]   // 동의한 terms.id 목록
}

// Response 201
{
  user: { id, email, nickname, grade }
}
```

**POST /api/v1/auth/signin**
```ts
// Request
{
  email: string
  password: string
}

// Response 200
{
  user: { id, email, nickname, grade, points }
  // Set-Cookie: session_token (HttpOnly)
}
```

---

### 어드민 인증

```
POST   /api/v1/admin/auth/signin        어드민 로그인
POST   /api/v1/admin/auth/signout       어드민 로그아웃
POST   /api/v1/admin/auth/2fa/setup     2FA 설정 (QR 코드 발급)
POST   /api/v1/admin/auth/2fa/verify    2FA 인증
POST   /api/v1/admin/auth/2fa/disable   2FA 해제 (슈퍼 어드민만)
```

**POST /api/v1/admin/auth/signin**
```ts
// Request
{
  email: string
  password: string
  totp_code?: string   // 2FA 활성화 시 필수
}

// Response 200
{
  admin: { id, email, role, permissions }
  requires_2fa: boolean  // true면 2FA 코드 입력 필요
}
```

---

## 사용자 API (일반)

### 내 정보

```
GET    /api/v1/users/me                 내 정보
PATCH  /api/v1/users/me                 내 정보 수정
DELETE /api/v1/users/me                 회원 탈퇴
GET    /api/v1/users/me/points          포인트 내역
GET    /api/v1/users/me/notifications   내 알림 목록
PATCH  /api/v1/users/me/notifications/read-all  전체 읽음
DELETE /api/v1/users/me/notifications/:id       알림 삭제
GET    /api/v1/users/me/notification-settings   알림 설정 조회
PATCH  /api/v1/users/me/notification-settings   알림 설정 변경
```

**PATCH /api/v1/users/me**
```ts
// Request
{
  nickname?: string
  avatar?: File           // multipart/form-data
  current_password?: string
  new_password?: string
}
```

---

## 게시판 API

### 게시판 목록

```
GET    /api/v1/boards                   전체 게시판 트리
GET    /api/v1/boards/:slug             게시판 단건 (slug로 조회)
```

### 게시물

```
GET    /api/v1/boards/:slug/posts            게시물 목록
POST   /api/v1/boards/:slug/posts            게시물 작성
GET    /api/v1/boards/:slug/posts/:id        게시물 단건
PATCH  /api/v1/boards/:slug/posts/:id        게시물 수정
DELETE /api/v1/boards/:slug/posts/:id        게시물 삭제
GET    /api/v1/boards/:slug/posts/:id/revisions  수정 이력
```

**GET /api/v1/boards/:slug/posts**
```ts
// Query Params
{
  page?: number         // default 1
  limit?: number        // default 20
  category?: string     // 카테고리 슬러그
  sort?: 'latest' | 'popular' | 'views'
  search?: string
  tag?: string
}

// Response
{
  posts: [{
    id, title, user: { nickname, grade },
    view_count, like_count, comment_count,
    created_at, thumbnail_url
  }],
  meta: { total, page, limit, hasNext }
}
```

**POST /api/v1/boards/:slug/posts**
```ts
// Request
{
  title: string
  content: string          // HTML (TipTap 출력)
  category_id?: number
  tags?: string[]
  is_anonymous?: boolean
  is_secret?: boolean
  scheduled_at?: string    // ISO 8601
  meta_title?: string
  meta_desc?: string
  no_index?: boolean
  summary?: string         // AO
  faq_data?: object[]      // AO
}
```

### 댓글

```
GET    /api/v1/posts/:id/comments        댓글 목록
POST   /api/v1/posts/:id/comments        댓글 작성
PATCH  /api/v1/posts/:id/comments/:cid   댓글 수정
DELETE /api/v1/posts/:id/comments/:cid   댓글 삭제
POST   /api/v1/posts/:id/comments/:cid/replies  대댓글 작성
```

### 인터랙션

```
POST   /api/v1/posts/:id/like            좋아요 (토글)
POST   /api/v1/posts/:id/dislike         싫어요 (토글)
POST   /api/v1/posts/:id/view            조회수 증가
POST   /api/v1/posts/:id/report          신고
POST   /api/v1/comments/:id/like         댓글 좋아요
POST   /api/v1/comments/:id/report       댓글 신고
```

---

## 미디어 API

```
POST   /api/v1/media/upload              파일 업로드
GET    /api/v1/media/:id                 파일 단건 조회 (이미지 바이너리 반환)
GET    /api/v1/media/:id/thumb           썸네일 반환
DELETE /api/v1/media/:id                 파일 삭제
GET    /api/v1/media/folders             폴더 목록
POST   /api/v1/media/folders             폴더 생성
DELETE /api/v1/media/folders/:id         폴더 삭제
GET    /api/v1/media                     내 미디어 목록 (폴더별)
```

**POST /api/v1/media/upload**
```ts
// Request: multipart/form-data
{
  file: File
  folder_id?: number
  alt_text?: string
}

// Response 201
{
  media: {
    id, original_name, mime_type,
    size_bytes, width, height,
    url: '/api/v1/media/{id}',
    thumb_url: '/api/v1/media/{id}/thumb'
  }
}
```

**GET /api/v1/media/:id**
```
응답: WebP 바이너리 (Content-Type: image/webp)
Cache-Control: public, max-age=31536000, immutable
```

---

## 임시저장 API

```
GET    /api/v1/drafts                    임시저장 목록
POST   /api/v1/drafts                    임시저장
PATCH  /api/v1/drafts/:id               임시저장 업데이트
DELETE /api/v1/drafts/:id               임시저장 삭제
```

---

## 검색 API

```
GET    /api/v1/search                    통합 검색
GET    /api/v1/search/posts              게시물 검색
GET    /api/v1/search/users              유저 검색 (닉네임)
```

**GET /api/v1/search/posts**
```ts
// Query
{
  q: string          // 검색어
  board?: string     // 게시판 슬러그
  page?: number
  limit?: number
}
```

---

## 배너 / 팝업 API (공개)

```
GET    /api/v1/banners                   활성 배너 목록 (위치별)
POST   /api/v1/banners/:id/click         클릭 이벤트 기록
POST   /api/v1/banners/:id/dismiss       배너 닫기 (로그인 시 DB 저장)
GET    /api/v1/popups                    활성 팝업 목록
POST   /api/v1/popups/:id/dismiss        팝업 닫기
```

**GET /api/v1/banners**
```ts
// Query
{
  position: 'hero' | 'sub' | 'sidebar' | 'bottom' | 'text_strip'
  board_id?: number
}
```

---

## 알림 구독 API

```
POST   /api/v1/push/subscribe            푸시 구독 등록
DELETE /api/v1/push/unsubscribe          푸시 구독 해제
POST   /api/v1/subscriptions/board/:id   게시판 구독
DELETE /api/v1/subscriptions/board/:id   게시판 구독 취소
POST   /api/v1/subscriptions/user/:id    유저 구독
DELETE /api/v1/subscriptions/user/:id    유저 구독 취소
```

---

## SSE (실시간 알림)

```
GET    /api/v1/notifications/stream      Server-Sent Events 연결
```

```ts
// 이벤트 포맷
data: {
  "type": "notification",
  "payload": {
    "id": 123,
    "title": "댓글이 달렸습니다",
    "link_url": "/community/free/456"
  }
}

// 하트비트 (30초마다)
data: { "type": "ping" }
```

---

## 어드민 API

prefix: `/api/v1/admin` — 어드민 세션 필수

### 대시보드

```
GET    /api/v1/admin/dashboard/stats     핵심 지표 카드
GET    /api/v1/admin/dashboard/chart     차트 데이터
GET    /api/v1/admin/dashboard/todo      오늘 할 일 목록
```

---

### 회원 관리

```
GET    /api/v1/admin/users               회원 목록 (검색/필터)
GET    /api/v1/admin/users/:id           회원 상세
PATCH  /api/v1/admin/users/:id           회원 정보 수정
PATCH  /api/v1/admin/users/:id/grade     등급 수동 변경
POST   /api/v1/admin/users/:id/points    포인트 수동 지급/차감
POST   /api/v1/admin/users/:id/suspend   계정 정지
POST   /api/v1/admin/users/:id/unsuspend 정지 해제
POST   /api/v1/admin/users/:id/force-logout  강제 로그아웃
DELETE /api/v1/admin/users/:id           회원 탈퇴 처리
GET    /api/v1/admin/users/:id/logs      회원 관련 어드민 로그
```

**GET /api/v1/admin/users**
```ts
// Query
{
  page?: number
  limit?: number
  search?: string          // 이름, 닉네임, 이메일
  grade?: number
  status?: 'active' | 'dormant' | 'suspended' | 'withdrawn'
  join_from?: string       // ISO date
  join_to?: string
  sort?: 'latest' | 'grade' | 'points'
}
```

---

### 등급 관리

```
GET    /api/v1/admin/grades              등급 목록
PATCH  /api/v1/admin/grades/:grade       등급 설정 수정
```

---

### 게시판 관리

```
GET    /api/v1/admin/boards              게시판 전체 목록
POST   /api/v1/admin/boards              게시판 생성
PATCH  /api/v1/admin/boards/:id          게시판 수정
DELETE /api/v1/admin/boards/:id          게시판 삭제
PATCH  /api/v1/admin/boards/reorder      순서 변경 (드래그)
```

---

### 게시물 / 댓글 관리

```
GET    /api/v1/admin/posts               게시물 목록 (전체 게시판)
GET    /api/v1/admin/posts/:id           게시물 상세
PATCH  /api/v1/admin/posts/:id/blind     블라인드 처리
PATCH  /api/v1/admin/posts/:id/unblind   블라인드 해제
DELETE /api/v1/admin/posts/:id           게시물 삭제
PATCH  /api/v1/admin/posts/:id/move      게시판 이동
GET    /api/v1/admin/comments            댓글 목록
PATCH  /api/v1/admin/comments/:id/blind  댓글 블라인드
DELETE /api/v1/admin/comments/:id        댓글 삭제
```

---

### 신고 관리

```
GET    /api/v1/admin/reports             신고 목록 (필터/검색)
GET    /api/v1/admin/reports/:id         신고 상세
POST   /api/v1/admin/reports/:id/process 신고 처리 (블라인드/삭제/반려)
GET    /api/v1/admin/sanctions           제재 이력
POST   /api/v1/admin/sanctions           제재 적용
DELETE /api/v1/admin/sanctions/:id       제재 해제
```

**POST /api/v1/admin/reports/:id/process**
```ts
// Request
{
  action: 'blind' | 'delete' | 'dismiss'
  sanction?: {
    type: 'warning' | 'suspend_temp' | 'suspend_permanent'
    duration_days?: number
    reason: string
  }
}
```

---

### 금칙어 관리

```
GET    /api/v1/admin/banned-words        금칙어 목록
POST   /api/v1/admin/banned-words        금칙어 추가
DELETE /api/v1/admin/banned-words/:id    금칙어 삭제
POST   /api/v1/admin/banned-words/test   패턴 테스트
```

---

### 메뉴 관리

```
GET    /api/v1/admin/menus               메뉴 전체 (트리)
POST   /api/v1/admin/menus               메뉴 생성
PATCH  /api/v1/admin/menus/:id           메뉴 수정
DELETE /api/v1/admin/menus/:id           메뉴 삭제
PATCH  /api/v1/admin/menus/reorder       순서/상하위 변경
```

---

### 배너 관리

```
GET    /api/v1/admin/banners             배너 목록
POST   /api/v1/admin/banners             배너 생성
GET    /api/v1/admin/banners/:id         배너 상세
PATCH  /api/v1/admin/banners/:id         배너 수정
DELETE /api/v1/admin/banners/:id         배너 삭제
PATCH  /api/v1/admin/banners/:id/toggle  활성/비활성 토글
GET    /api/v1/admin/banners/:id/stats   배너 통계
GET    /api/v1/admin/banner-groups       배너 그룹 목록
POST   /api/v1/admin/banner-groups       그룹 생성
PATCH  /api/v1/admin/banner-groups/:id/toggle  그룹 전체 ON/OFF
```

---

### 팝업 관리

```
GET    /api/v1/admin/popups              팝업 목록
POST   /api/v1/admin/popups              팝업 생성
PATCH  /api/v1/admin/popups/:id          팝업 수정
DELETE /api/v1/admin/popups/:id          팝업 삭제
PATCH  /api/v1/admin/popups/:id/toggle   활성/비활성 토글
```

---

### 알림 관리

```
GET    /api/v1/admin/notifications/templates     이메일 템플릿 목록
PATCH  /api/v1/admin/notifications/templates/:type  템플릿 수정
POST   /api/v1/admin/notifications/templates/:type/test  테스트 발송
POST   /api/v1/admin/notifications/send          수동 발송
GET    /api/v1/admin/notifications/queue         발송 큐 현황
GET    /api/v1/admin/notifications/logs          발송 이력
GET    /api/v1/admin/webhooks                    웹훅 목록
POST   /api/v1/admin/webhooks                    웹훅 등록
PATCH  /api/v1/admin/webhooks/:id                웹훅 수정
DELETE /api/v1/admin/webhooks/:id                웹훅 삭제
```

**POST /api/v1/admin/notifications/send**
```ts
// Request
{
  title: string
  body: string
  channels: ('inapp' | 'email' | 'kakao' | 'sms' | 'push')[]
  target: {
    type: 'all' | 'grade' | 'users' | 'board_subscribers'
    grade?: number
    user_ids?: number[]
    board_id?: number
  }
  scheduled_at?: string   // 예약 발송 (ISO 8601)
}
```

---

### 통계

```
GET    /api/v1/admin/stats/summary       대시보드 요약
GET    /api/v1/admin/stats/users         회원 통계
GET    /api/v1/admin/stats/posts         게시물 통계
GET    /api/v1/admin/stats/reports       신고/제재 통계
GET    /api/v1/admin/stats/banners       배너/팝업 통계
GET    /api/v1/admin/stats/notifications 알림 통계
GET    /api/v1/admin/stats/revenue       결제 통계
GET    /api/v1/admin/stats/funnel        퍼널 분석
GET    /api/v1/admin/stats/export        통계 내보내기 (CSV/엑셀)
```

**GET /api/v1/admin/stats/users**
```ts
// Query
{
  from: string    // ISO date
  to: string
  granularity?: 'day' | 'week' | 'month'
}
```

---

### 시스템 / 어드민 로그

```
GET    /api/v1/admin/activity-logs       어드민 활동 로그 (복합 검색)
GET    /api/v1/admin/activity-logs/export  로그 내보내기
GET    /api/v1/admin/login-history       어드민 로그인 이력
GET    /api/v1/admin/system-logs         시스템 에러 로그
GET    /api/v1/admin/roles               역할 목록
POST   /api/v1/admin/roles               역할 생성
PATCH  /api/v1/admin/roles/:id           역할 수정
DELETE /api/v1/admin/roles/:id           역할 삭제
GET    /api/v1/admin/roles/:id/permissions  권한 조회
PATCH  /api/v1/admin/roles/:id/permissions  권한 수정
GET    /api/v1/admin/admins              어드민 목록
POST   /api/v1/admin/admins              어드민 추가
PATCH  /api/v1/admin/admins/:id/role     역할 변경
DELETE /api/v1/admin/admins/:id          어드민 제거
```

**GET /api/v1/admin/activity-logs**
```ts
// Query (AND 조합)
{
  admin_id?: number
  module?: string
  action?: string
  target_type?: string
  target_id?: number
  ip?: string
  from?: string
  to?: string
  page?: number
  limit?: number
}
```

---

### 사이트 설정

```
GET    /api/v1/admin/settings            전체 설정 조회
PATCH  /api/v1/admin/settings            설정 수정
GET    /api/v1/admin/settings/api-keys   API 키 목록 (마스킹)
PATCH  /api/v1/admin/settings/api-keys/:service  API 키 수정
POST   /api/v1/admin/settings/api-keys/:service/test  연동 테스트
GET    /api/v1/admin/terms               약관 목록
POST   /api/v1/admin/terms               약관 등록
GET    /api/v1/admin/terms/:id           약관 상세
```

---

## Rate Limit 정책

| 엔드포인트 그룹 | 제한 |
|---------------|------|
| 인증 API | 10회/분 (IP 기준) |
| 게시물 작성 | 5회/분 (유저 기준) |
| 댓글 작성 | 10회/분 (유저 기준) |
| 파일 업로드 | 20회/분 (유저 기준) |
| 신고 | 5회/분 (유저 기준) |
| 어드민 API | 100회/분 (어드민 기준) |
| 일반 조회 | 200회/분 (IP 기준) |

---

## 미들웨어 체인

```
Request
  → Rate Limiter
  → CORS
  → Auth 검사 (세션 / JWT)
  → Role 권한 검사 (어드민 API)
  → Zod 입력 유효성 검사
  → Handler
  → 어드민 활동 로그 기록 (변경 API)
  → Response
```
