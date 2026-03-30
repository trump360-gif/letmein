# 15. 푸시 알림 시스템

> Phase: **MVP-B**
> 선행 의존: [06_auth.md](./06_auth.md) (인증/JWT, 알림 설정 UI), [05_chat.md](./05_chat.md) (채팅 알림 이벤트), [02_consultation.md](./02_consultation.md) (상담 매칭 알림)
> 연관: [03_community.md](./03_community.md) (댓글/좋아요 알림), [14_review.md](./14_review.md) (리뷰 알림), [09_tech.md](./09_tech.md) (FCM 인프라)

---

## 개요

Firebase Cloud Messaging(FCM) 기반 푸시 알림 시스템. 상담, 채팅, 커뮤니티, 리뷰 등 서비스 전반의 이벤트를 유저 및 병원에게 실시간으로 전달한다. 인앱 알림 센터와 뱃지 카운트를 함께 제공하여, 앱을 열지 않은 상태에서도 핵심 정보를 놓치지 않도록 한다.

```
이벤트 발생 → 알림 서비스 → 야간 여부 판별
  ├─ 주간 (08:00~22:00) → FCM 즉시 발송 + 인앱 저장 + 뱃지 갱신
  └─ 야간 (22:00~08:00) → 인앱 저장 + 뱃지 갱신 + 푸시 보류 큐 → 08:00 일괄 발송
```

---

## 알림 이벤트 매트릭스

총 **14개** 이벤트를 정의한다. 각 이벤트별 푸시 제목, 대상, 딥링크, 채널을 아래 표에 명시한다.

| # | 이벤트 | 푸시 제목 | 대상 | 딥링크 | 채널 |
|---|--------|----------|------|--------|------|
| 1 | 상담 접수 확인 | "상담이 접수되었습니다" | 유저 | `/consultations/:id` | 푸시 + 인앱 |
| 2 | 코디네이터 검토 시작 | "코디네이터가 상담을 검토하고 있습니다" | 유저 | `/consultations/:id` | 푸시 + 인앱 |
| 3 | 매칭 완료 (병원 배정) | "맞춤 병원 {N}곳이 추천되었습니다" | 유저 | `/consultations/:id/matches` | 푸시 + 인앱 + 뱃지 |
| 4 | 새 채팅 메시지 | "{병원명}에서 메시지가 왔습니다" | 유저/병원 | `/chats/:roomId` | 푸시 + 인앱 + 뱃지 |
| 5 | 채팅 만료 3일 전 | "상담이 3일 후 자동 종료됩니다" | 유저/병원 | `/chats/:roomId` | 푸시 + 인앱 |
| 6 | 채팅 만료 | "{병원명}과의 상담이 종료되었습니다" | 유저/병원 | `/chats/:roomId` | 푸시 + 인앱 |
| 7 | 방문 예약 확정 | "{병원명} 방문 예약이 확정되었습니다" | 유저 | `/chats/:roomId` | 푸시 + 인앱 + 뱃지 |
| 8 | 리뷰 작성 요청 (상담 완료 3일 후) | "상담은 만족스러우셨나요? 리뷰를 남겨주세요" | 유저 | `/reviews/create?consultationId=:id` | 푸시 + 인앱 |
| 9 | 새 리뷰 등록 (병원 대상) | "새로운 리뷰가 등록되었습니다" | 병원 | `/hospital/reviews/:reviewId` | 푸시 + 인앱 + 뱃지 |
| 10 | 새 댓글 (내 글) | "{닉네임}님이 댓글을 남겼습니다" | 유저 | `/community/posts/:postId` | 푸시 + 인앱 |
| 11 | 좋아요 N개 도달 (10, 50, 100) | "내 글에 좋아요가 {N}개를 넘었습니다!" | 유저 | `/community/posts/:postId` | 푸시 + 인앱 |
| 12 | 새 매칭 상담 (병원 대상) | "새로운 상담이 매칭되었습니다" | 병원 | `/hospital/consultations/:id` | 푸시 + 인앱 + 뱃지 |
| 13 | 매칭 유효기간 만료 | "매칭 유효기간이 만료되었습니다" | 병원 | `/hospital/consultations/:id` | 푸시 + 인앱 |
| 14 | 상담 요청 만료 | "상담 요청이 만료되었습니다" | 유저 | `/consultations/:id` | 인앱 |

### 이벤트 상세

- **#4 새 채팅 메시지**: 상대방이 채팅방에 접속 중(포그라운드)이면 푸시 발송 생략, 인앱만 갱신
- **#8 리뷰 작성 요청**: 상담 완료(`status=completed`) 기준 3일(72시간) 후 스케줄러가 발송. 1회만 발송
- **#11 좋아요 도달**: 임계값(10, 50, 100) 최초 도달 시 각 1회만 발송. 중복 발송 방지 필요

---

## 알림 설정 (카테고리별 ON/OFF)

> 기존 설정 UI: [06_auth.md](./06_auth.md) — 마이페이지 > 설정 > 알림 관리

| 카테고리 | 기본값 | OFF 가능 | 포함 이벤트 | 비고 |
|---------|--------|---------|------------|------|
| 상담 알림 | ON | **OFF 불가** | #1, #2, #3, #12, #13, #14 | 핵심 서비스 알림 — 사용자가 끌 수 없음 |
| 채팅 메시지 알림 | ON | O | #4, #5, #6, #7 | |
| 커뮤니티 알림 | ON | O | #10, #11 | |
| 리뷰 알림 | ON | O | #8, #9 | |
| 이벤트/공지 | ON | O | 시스템 공지, 이벤트 안내 | 운영팀 수동 발송 |
| 마케팅 | **OFF** | O | 프로모션, 할인 안내 | 회원가입 시 별도 동의 필요 → [06_auth.md](./06_auth.md) |

### 설정 동기화

- 알림 설정은 서버에 저장하며, 다중 기기 간 동기화
- OS 레벨 알림 권한이 거부된 경우: 설정 화면에 "기기 알림이 꺼져 있습니다" 안내 + 시스템 설정 이동 버튼

---

## 야간 시간대 규칙

> 정보통신망법 제50조 준수: 야간 시간대 광고성 알림 발송 제한

| 항목 | 내용 |
|------|------|
| 야간 시간대 | **22:00 ~ 08:00** (KST 기준) |
| 푸시 처리 | 야간 발생 이벤트는 인앱 알림 즉시 저장, 푸시는 보류 큐에 적재 |
| 일괄 발송 | 08:00에 보류 큐의 알림을 일괄 발송 |
| 보류 큐 병합 | 동일 유형 알림이 다수인 경우 최신 1건으로 병합 (예: 채팅 메시지 5건 → "읽지 않은 메시지가 5건 있습니다") |
| 예외 | 상담 알림(OFF 불가 카테고리)은 야간에도 **즉시 발송** |
| 마케팅 알림 | 야간 시간대 발송 절대 금지 (법적 의무) |

---

## AC (Acceptance Criteria)

### 푸시 발송

- [ ] FCM 토큰 등록 시 유효성 검증 (플랫폼: android/ios 구분)
- [ ] 14개 이벤트 각각에 대해 올바른 대상에게 푸시가 발송된다
- [ ] 딥링크 탭 시 해당 화면으로 정확히 이동한다
- [ ] 앱 포그라운드 상태에서 채팅 메시지 푸시가 중복 발송되지 않는다
- [ ] 푸시 발송 실패 시 3회까지 재시도 (지수 백오프)
- [ ] FCM 토큰 만료/무효 시 자동 삭제 처리

### 인앱 알림

- [ ] 알림 센터에서 최신순 커서 기반 페이지네이션으로 알림 목록을 조회할 수 있다
- [ ] 알림 탭 시 읽음 처리되며, 읽지 않은 알림은 시각적으로 구분된다
- [ ] 앱 아이콘 뱃지에 미읽 알림 수가 정확히 반영된다
- [ ] 뱃지 카운트는 알림 읽음 처리 시 실시간 감소한다

### 알림 설정

- [ ] 카테고리별 ON/OFF 토글이 정상 동작한다
- [ ] 상담 알림 카테고리는 OFF 토글이 비활성화(disabled) 상태이다
- [ ] 마케팅 알림은 회원가입 시 동의하지 않은 유저에게 OFF 기본값으로 표시된다
- [ ] 설정 변경 즉시 서버에 반영되며, 다른 기기에서도 동기화된다

### 야간 규칙

- [ ] 22:00~08:00 사이 발생한 일반 알림은 푸시 발송되지 않는다
- [ ] 08:00에 보류 큐의 알림이 일괄 발송된다
- [ ] 동일 유형 다수 알림은 병합되어 1건으로 발송된다
- [ ] 상담 알림은 야간에도 즉시 발송된다
- [ ] 마케팅 알림은 야간 시간대에 절대 발송되지 않는다

---

## API 명세

> Base URL: `/api/v1/notifications`
> 인증: Bearer Token (JWT) → [06_auth.md](./06_auth.md)

### POST /api/v1/notifications/device-token

FCM 디바이스 토큰 등록/갱신.

**Request**

```json
{
  "token": "fMJxk9Rl...(FCM token)",
  "platform": "ios",
  "device_id": "A1B2C3D4-E5F6-..."
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| token | string | O | FCM 디바이스 토큰 |
| platform | string | O | `ios` 또는 `android` |
| device_id | string | O | 기기 고유 식별자 (중복 등록 방지) |

**Response 200**

```json
{
  "success": true
}
```

---

### GET /api/v1/notifications

알림 목록 조회 (커서 기반 페이지네이션).

**Query Parameters**

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|---------|------|------|-------|------|
| cursor | string | X | null | 이전 응답의 `next_cursor` 값 |
| limit | int | X | 20 | 페이지당 알림 수 (최대 50) |

**Response 200**

```json
{
  "notifications": [
    {
      "id": "ntf_abc123",
      "type": "consultation_matched",
      "title": "맞춤 병원 3곳이 추천되었습니다",
      "body": "코디네이터가 고객님에게 적합한 병원을 선정했습니다. 지금 확인해 보세요.",
      "data": {
        "consultation_id": 42,
        "match_count": 3
      },
      "deep_link": "/consultations/42/matches",
      "read_at": null,
      "created_at": "2026-03-30T14:23:00Z"
    }
  ],
  "next_cursor": "ntf_xyz789",
  "has_more": true
}
```

---

### PUT /api/v1/notifications/:id/read

알림 읽음 처리.

**Response 200**

```json
{
  "success": true,
  "unread_count": 4
}
```

---

### GET /api/v1/notifications/unread-count

미읽 알림 수 조회 (뱃지용).

**Response 200**

```json
{
  "unread_count": 7
}
```

---

### PUT /api/v1/notifications/settings

알림 설정 업데이트.

**Request**

```json
{
  "consultation": true,
  "chat_message": true,
  "community": false,
  "review": true,
  "event_notice": true,
  "marketing": false
}
```

| 필드 | 타입 | 필수 | 기본값 | 설명 |
|------|------|------|-------|------|
| consultation | bool | X | true | 상담 알림 (서버에서 항상 true 강제) |
| chat_message | bool | X | true | 채팅 메시지 알림 |
| community | bool | X | true | 커뮤니티 알림 |
| review | bool | X | true | 리뷰 알림 |
| event_notice | bool | X | true | 이벤트/공지 |
| marketing | bool | X | false | 마케팅 알림 |

**Response 200**

```json
{
  "settings": {
    "consultation": true,
    "chat_message": true,
    "community": false,
    "review": true,
    "event_notice": true,
    "marketing": false
  }
}
```

> `consultation` 필드는 클라이언트에서 `false`로 전송해도 서버에서 `true`로 강제 반환한다.

---

### GET /api/v1/notifications/settings

현재 알림 설정 조회.

**Response 200**

```json
{
  "settings": {
    "consultation": true,
    "chat_message": true,
    "community": true,
    "review": true,
    "event_notice": true,
    "marketing": false
  }
}
```

---

## DB 스키마

### notifications 테이블

```sql
CREATE TABLE notifications (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type        VARCHAR(50) NOT NULL,
    title       VARCHAR(200) NOT NULL,
    body        TEXT,
    data        JSONB DEFAULT '{}',
    deep_link   VARCHAR(500),
    read_at     TIMESTAMP,
    created_at  TIMESTAMP DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_notifications_user_id_created_at
    ON notifications (user_id, created_at DESC);

CREATE INDEX idx_notifications_user_id_read_at
    ON notifications (user_id) WHERE read_at IS NULL;
```

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | BIGSERIAL | PK |
| user_id | BIGINT | 알림 수신자 (유저 또는 병원 계정) |
| type | VARCHAR(50) | 이벤트 유형 (`consultation_submitted`, `consultation_reviewing`, `consultation_matched`, `chat_message`, `chat_expiring`, `chat_expired`, `visit_confirmed`, `review_request`, `review_created`, `comment_new`, `likes_milestone`, `hospital_matched`, `match_expired`, `consultation_expired`) |
| title | VARCHAR(200) | 푸시 제목 |
| body | TEXT | 푸시 본문 |
| data | JSONB | 이벤트별 추가 데이터 (consultation_id, chat_room_id, post_id 등) |
| deep_link | VARCHAR(500) | 클라이언트 딥링크 경로 |
| read_at | TIMESTAMP | 읽음 시각 (NULL이면 미읽) |
| created_at | TIMESTAMP | 생성 시각 |

### notification_settings 테이블

```sql
CREATE TABLE notification_settings (
    user_id         BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    consultation    BOOLEAN NOT NULL DEFAULT TRUE,
    chat_message    BOOLEAN NOT NULL DEFAULT TRUE,
    community       BOOLEAN NOT NULL DEFAULT TRUE,
    review          BOOLEAN NOT NULL DEFAULT TRUE,
    event_notice    BOOLEAN NOT NULL DEFAULT TRUE,
    marketing       BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at      TIMESTAMP DEFAULT NOW()
);
```

### device_tokens 테이블 (기존)

> 이미 존재하는 테이블. 스키마 참고용으로 명시.

```sql
CREATE TABLE device_tokens (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token       VARCHAR(500) NOT NULL,
    platform    VARCHAR(10) NOT NULL CHECK (platform IN ('ios', 'android')),
    device_id   VARCHAR(200) NOT NULL,
    is_active   BOOLEAN DEFAULT TRUE,
    created_at  TIMESTAMP DEFAULT NOW(),
    updated_at  TIMESTAMP DEFAULT NOW(),
    UNIQUE (user_id, device_id)
);

CREATE INDEX idx_device_tokens_user_id
    ON device_tokens (user_id) WHERE is_active = TRUE;
```

### 야간 보류 큐 테이블

```sql
CREATE TABLE notification_queue (
    id              BIGSERIAL PRIMARY KEY,
    notification_id BIGINT NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
    scheduled_at    TIMESTAMP NOT NULL,
    sent_at         TIMESTAMP,
    merged_count    INT DEFAULT 1,
    created_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notification_queue_scheduled
    ON notification_queue (scheduled_at) WHERE sent_at IS NULL;
```

---

## 구현 체크리스트

### 백엔드

- [ ] DB 마이그레이션 (`notifications`, `notification_settings`, `notification_queue` 테이블 생성)
- [ ] FCM 디바이스 토큰 등록/갱신 API (`POST /device-token`)
- [ ] 알림 목록 조회 API (`GET /notifications`, 커서 페이지네이션)
- [ ] 알림 읽음 처리 API (`PUT /notifications/:id/read`)
- [ ] 미읽 알림 수 조회 API (`GET /notifications/unread-count`)
- [ ] 알림 설정 조회/업데이트 API (`GET/PUT /notifications/settings`)
- [ ] 알림 서비스 모듈 (이벤트 수신 → 알림 생성 → FCM 발송)
- [ ] 이벤트별 알림 트리거 연동 (14개 이벤트)
  - [ ] 상담 접수 확인 (#1) → [02_consultation.md](./02_consultation.md)
  - [ ] 코디네이터 검토 시작 (#2) → [02_consultation.md](./02_consultation.md)
  - [ ] 매칭 완료 (#3) → [02_consultation.md](./02_consultation.md)
  - [ ] 새 채팅 메시지 (#4) → [05_chat.md](./05_chat.md)
  - [ ] 채팅 만료 3일 전 (#5) → [05_chat.md](./05_chat.md)
  - [ ] 채팅 만료 (#6) → [05_chat.md](./05_chat.md)
  - [ ] 방문 예약 확정 (#7) → [05_chat.md](./05_chat.md)
  - [ ] 리뷰 작성 요청 (#8) → [14_review.md](./14_review.md)
  - [ ] 새 리뷰 등록 (#9) → [14_review.md](./14_review.md)
  - [ ] 새 댓글 (#10) → [03_community.md](./03_community.md)
  - [ ] 좋아요 N개 도달 (#11) → [03_community.md](./03_community.md)
  - [ ] 새 매칭 상담 (#12) → [02_consultation.md](./02_consultation.md)
  - [ ] 매칭 유효기간 만료 (#13) → [02_consultation.md](./02_consultation.md)
  - [ ] 상담 요청 만료 (#14) → [02_consultation.md](./02_consultation.md)
- [ ] 야간 시간대 판별 로직 (KST 22:00~08:00)
- [ ] 야간 보류 큐 적재 및 08:00 일괄 발송 스케줄러
- [ ] 보류 큐 동일 유형 알림 병합 로직
- [ ] FCM 발송 실패 재시도 (3회, 지수 백오프)
- [ ] FCM 토큰 무효 시 `is_active = false` 처리
- [ ] 리뷰 작성 요청 스케줄러 (상담 완료 72시간 후)
- [ ] 좋아요 임계값 도달 체크 (10, 50, 100)
- [ ] 알림 설정에 따른 발송 필터링

### 프론트엔드

- [ ] FCM 초기화 및 토큰 등록 (앱 시작 시)
- [ ] FCM 토큰 갱신 콜백 처리
- [ ] 포그라운드 알림 수신 핸들러
- [ ] 백그라운드/종료 상태 알림 탭 핸들러
- [ ] 딥링크 라우팅 처리 (14개 경로)
- [ ] 알림 센터 화면 (목록 + 읽음/미읽 구분)
- [ ] 커서 기반 무한 스크롤 페이지네이션
- [ ] 앱 아이콘 뱃지 카운트 갱신 (iOS: `flutter_app_badger`)
- [ ] 알림 설정 화면 (카테고리별 토글)
- [ ] 상담 알림 토글 비활성화(disabled) UI
- [ ] OS 알림 권한 미허용 시 안내 배너 + 설정 이동
- [ ] 채팅방 포그라운드 시 해당 채팅 푸시 억제 로직

---

## 참고 문서

| 문서 | 연관 내용 |
|------|----------|
| [06_auth.md](./06_auth.md) | 알림 설정 카테고리 정의, 마케팅 동의 |
| [05_chat.md](./05_chat.md) | 채팅 관련 알림 이벤트 (#4~#7) |
| [02_consultation.md](./02_consultation.md) | 상담/매칭 알림 이벤트 (#1~#3, #12~#14) |
| [03_community.md](./03_community.md) | 커뮤니티 알림 이벤트 (#10, #11) |
| [14_review.md](./14_review.md) | 리뷰 알림 이벤트 (#8, #9) |
| [09_tech.md](./09_tech.md) | FCM 인프라, 스케줄러 기술 스택 |
| [10_legal.md](./10_legal.md) | 정보통신망법 제50조 (야간 광고 제한) |
