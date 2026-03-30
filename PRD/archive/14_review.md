# 14. 병원 리뷰 시스템

> Phase: **MVP-B**
> 선행 의존: [06_auth.md](./06_auth.md) (인증/JWT), [04_hospital.md](./04_hospital.md) (병원 상세), [05_chat.md](./05_chat.md) (상담 매칭 기반 리뷰 작성 자격)
> 연관: [08_media.md](./08_media.md) (리뷰 사진 업로드), [10_legal.md](./10_legal.md) (키워드 필터링 — 금액/연락처 차단), [02_consultation.md](./02_consultation.md) (코디네이터 매칭)

---

## 개요

병원 상담을 실제로 진행한 유저만 리뷰를 작성할 수 있는 **검증된 리뷰 시스템**.
코디네이터 매칭을 통해 채팅 중이거나 상담 완료된 유저에게만 작성 권한을 부여하여 허위 리뷰를 원천 차단한다.

| 항목 | 내용 |
|------|------|
| 리뷰 구성 | 별점 (1~5, 0.5단위) + 텍스트 (30~1,000자) + 사진 (최대 5장, 선택) |
| 작성 자격 | 해당 병원과의 상담 매칭 상태가 CHATTING 또는 COMPLETED인 유저 |
| 중복 방지 | 병원-매칭 조합 기준 1건만 허용 (수정 가능, 재작성 불가) |
| 노출 위치 | 병원 상세 페이지 하단 — 평균 별점 + 최신 리뷰 목록 |
| 필터링 | 금액/연락처 키워드 필터링 동일 적용 -> [10_legal.md](./10_legal.md), [05_chat.md](./05_chat.md) |

---

## 리뷰 작성 자격

### 자격 조건

```
유저가 해당 병원과 코디네이터 매칭을 통해 채팅방이 개설된 상태 (CHATTING)
또는 상담이 완료된 상태 (COMPLETED)일 때만 리뷰 작성 가능
```

| 매칭 상태 | 리뷰 작성 | 비고 |
|----------|----------|------|
| PENDING (매칭 대기) | ❌ | 아직 병원과 연결 전 |
| MATCHED (매칭 완료, 채팅 미시작) | ❌ | 채팅 시작 전 |
| CHATTING (채팅 진행 중) | ✅ | 상담 경험 있음 |
| COMPLETED (상담 완료) | ✅ | 상담 완료 확인 |
| CANCELLED (취소) | ❌ | 유효한 상담 아님 |

### AC (Acceptance Criteria)
- [ ] CHATTING 또는 COMPLETED 상태의 매칭이 없는 유저는 리뷰 작성 버튼이 비활성화된다
- [ ] 작성 버튼 탭 시 자격이 없으면 "해당 병원과 상담을 진행한 후 리뷰를 작성할 수 있습니다" 안내 표시
- [ ] 하나의 병원에 여러 매칭이 있어도 매칭 건별로 각각 1건의 리뷰만 허용

---

## 리뷰 작성

### 별점

| 항목 | 내용 |
|------|------|
| 범위 | 1.0 ~ 5.0 |
| 단위 | 0.5 단위 (1.0, 1.5, 2.0 ... 5.0) |
| 필수 여부 | 필수 |
| UI | 별 아이콘 탭/드래그 선택 |

### 텍스트

| 항목 | 내용 |
|------|------|
| 최소 글자 수 | 30자 |
| 최대 글자 수 | 1,000자 |
| 필수 여부 | 필수 |
| 키워드 필터링 | 금액 (만원, 원, 가격 등) + 연락처 (전화번호, 카카오 ID 패턴) 차단 -> [10_legal.md](./10_legal.md) |
| 작성 중 글자 수 | 실시간 카운터 표시 (예: "42 / 1,000") |

### 사진

| 항목 | 내용 |
|------|------|
| 필수 여부 | 선택 |
| 최대 장수 | 5장 |
| 단일 파일 크기 | 최대 10MB |
| 처리 | -> [08_media.md](./08_media.md) (EXIF 제거, 리사이징, WebP 변환) |
| 저장 | 공개 버킷 (CDN) — 병원 상세에서 모든 유저에게 노출 |

### AC (Acceptance Criteria)
- [ ] 별점 미선택 시 제출 불가 (에러 메시지 표시)
- [ ] 텍스트 30자 미만 시 "최소 30자 이상 작성해주세요" 표시
- [ ] 텍스트 1,000자 초과 시 입력 차단
- [ ] 금액/연락처 키워드 포함 시 "금액 및 연락처 정보는 기재할 수 없습니다" 경고 + 제출 차단
- [ ] 사진 5장 초과 선택 시 "사진은 최대 5장까지 첨부할 수 있습니다" 안내
- [ ] 사진 10MB 초과 시 "10MB 이하 사진만 첨부할 수 있습니다" 안내
- [ ] 제출 완료 시 "리뷰가 등록되었습니다" 토스트 표시

---

## 중복 방지 및 수정

| 항목 | 내용 |
|------|------|
| 고유 기준 | (user_id, hospital_id, match_id) 조합 — 1건만 허용 |
| 중복 작성 시도 | "이미 해당 상담에 대한 리뷰를 작성했습니다" 안내 + 수정 화면 이동 유도 |
| 수정 | 별점, 텍스트, 사진 모두 수정 가능 |
| 수정 횟수 | 제한 없음 |
| 수정 표시 | 수정된 리뷰에 "(수정됨)" 라벨 표시 + 최종 수정 시각 |
| 삭제 | 본인만 삭제 가능. 삭제 시 확인 다이얼로그 ("삭제된 리뷰는 복구할 수 없습니다") |

### AC (Acceptance Criteria)
- [ ] 동일 (hospital_id, match_id) 조합으로 두 번째 리뷰 작성 시도 시 409 Conflict 응답
- [ ] 수정 화면에 기존 별점/텍스트/사진이 프리필된다
- [ ] 수정 완료 시 updated_at 갱신 + "(수정됨)" 표시
- [ ] 삭제 확인 다이얼로그에서 "취소" 선택 시 삭제되지 않는다
- [ ] 삭제 완료 시 병원 평균 별점이 즉시 재계산된다

---

## 병원 상세 페이지 노출

> 병원 상세 페이지 구조는 -> [04_hospital.md](./04_hospital.md) 참조

### 리뷰 요약 영역

| 항목 | 내용 |
|------|------|
| 노출 위치 | 병원 상세 페이지 — "커뮤니티 태깅 후기" 섹션 위 |
| 평균 별점 | 소수점 첫째 자리까지 표시 (예: 4.3) |
| 별점 분포 | 5점~1점 가로 막대 그래프 |
| 총 리뷰 수 | "리뷰 N개" 표시 |
| 리뷰 0건 시 | "아직 리뷰가 없습니다" 안내 |

### 리뷰 목록

| 항목 | 내용 |
|------|------|
| 정렬 | 최신순 (기본) / 별점 높은순 / 별점 낮은순 |
| 페이지네이션 | 커서 기반 무한 스크롤 (페이지당 10건) |
| 리뷰 카드 구성 | 닉네임 + 별점 + 텍스트 + 사진 썸네일 + 작성일 + "(수정됨)" 라벨 |
| 사진 탭 시 | 풀스크린 이미지 뷰어 |
| 내 리뷰 | 상단 고정 + "수정" / "삭제" 버튼 노출 |

### AC (Acceptance Criteria)
- [ ] 병원 상세 페이지에 평균 별점과 리뷰 수가 표시된다
- [ ] 리뷰 0건인 병원에서 빈 상태 UI가 정상 표시된다
- [ ] 정렬 변경 시 목록이 즉시 갱신된다
- [ ] 무한 스크롤로 다음 페이지 로드 시 기존 목록 아래에 추가된다
- [ ] 본인 리뷰는 목록 최상단에 고정 + 수정/삭제 버튼 노출
- [ ] 사진 썸네일 탭 시 풀스크린 뷰어가 열린다

---

## 키워드 필터링

> 채팅과 동일한 필터 로직 공유 -> [05_chat.md](./05_chat.md), [10_legal.md](./10_legal.md)

| 항목 | 내용 |
|------|------|
| 금액 키워드 | "만원", "원", "가격", "비용", "견적", 숫자+만원 패턴 등 |
| 연락처 키워드 | 전화번호 패턴 (010-xxxx-xxxx 등), 카카오톡 ID, 라인 ID 등 |
| 적용 시점 | 리뷰 제출 시 서버에서 검증 (클라이언트 사전 경고 + 서버 최종 차단) |
| 차단 시 | 422 Unprocessable Entity + 구체적 차단 사유 반환 |
| 우회 시도 | "만 원", "만w" 등 변형 패턴도 감지 (정규식 + 사전 기반) |

### AC (Acceptance Criteria)
- [ ] "50만원" 포함 리뷰 제출 시 차단된다
- [ ] "010-1234-5678" 포함 리뷰 제출 시 차단된다
- [ ] "오십 만원" 등 변형 패턴도 차단된다
- [ ] 차단 시 사용자에게 구체적인 사유가 안내된다
- [ ] 클라이언트에서 실시간 타이핑 중 경고가 표시된다

---

## API 명세

### 1. 리뷰 작성 — `POST /api/v1/reviews`

> 인증: JWT 필수 -> [06_auth.md](./06_auth.md)

**Request**

```json
{
  "hospital_id": "uuid-hospital-001",
  "match_id": "uuid-match-001",
  "rating": 4.5,
  "content": "코디네이터 매칭으로 상담 받았는데, 상담이 정말 친절하고 자세했습니다. 병원 분위기도 좋고 시설도 깨끗했어요.",
  "image_ids": [
    "uuid-image-001",
    "uuid-image-002"
  ]
}
```

**Response — 201 Created**

```json
{
  "id": "uuid-review-001",
  "hospital_id": "uuid-hospital-001",
  "match_id": "uuid-match-001",
  "user": {
    "id": "uuid-user-001",
    "nickname": "성형고민중"
  },
  "rating": 4.5,
  "content": "코디네이터 매칭으로 상담 받았는데, 상담이 정말 친절하고 자세했습니다. 병원 분위기도 좋고 시설도 깨끗했어요.",
  "images": [
    {
      "id": "uuid-image-001",
      "url": "https://cdn.example.com/reviews/uuid-image-001.webp",
      "thumbnail_url": "https://cdn.example.com/reviews/uuid-image-001_thumb.webp"
    },
    {
      "id": "uuid-image-002",
      "url": "https://cdn.example.com/reviews/uuid-image-002.webp",
      "thumbnail_url": "https://cdn.example.com/reviews/uuid-image-002_thumb.webp"
    }
  ],
  "is_edited": false,
  "created_at": "2026-03-30T14:30:00Z",
  "updated_at": "2026-03-30T14:30:00Z"
}
```

**에러 응답**

| 상태 코드 | 조건 | 응답 body |
|----------|------|----------|
| 401 Unauthorized | JWT 없음/만료 | `{"error": "인증이 필요합니다"}` |
| 403 Forbidden | 해당 매칭의 상태가 CHATTING/COMPLETED가 아님 | `{"error": "리뷰 작성 자격이 없습니다"}` |
| 409 Conflict | 동일 (hospital_id, match_id) 리뷰 이미 존재 | `{"error": "이미 해당 상담에 대한 리뷰를 작성했습니다"}` |
| 422 Unprocessable Entity | 키워드 필터링 차단 | `{"error": "금액 및 연락처 정보는 기재할 수 없습니다", "blocked_keywords": ["50만원"]}` |
| 422 Unprocessable Entity | 글자 수 미달/초과 | `{"error": "리뷰 내용은 30자 이상 1,000자 이하로 작성해주세요"}` |

---

### 2. 리뷰 목록 조회 — `GET /api/v1/hospitals/:id/reviews`

> 인증: 선택 (로그인 시 본인 리뷰 is_mine 플래그 포함)

**Query Parameters**

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|---------|------|------|--------|------|
| sort | string | ❌ | `recent` | 정렬: `recent` / `rating_high` / `rating_low` |
| cursor | string | ❌ | null | 커서 (이전 응답의 next_cursor) |
| limit | int | ❌ | 10 | 페이지당 건수 (최대 20) |

**Response — 200 OK**

```json
{
  "hospital_id": "uuid-hospital-001",
  "summary": {
    "average_rating": 4.3,
    "total_count": 47,
    "distribution": {
      "5": 20,
      "4": 15,
      "3": 8,
      "2": 3,
      "1": 1
    }
  },
  "my_review": {
    "id": "uuid-review-005",
    "rating": 4.5,
    "content": "상담이 정말 친절하고 자세했습니다...",
    "images": [],
    "is_edited": true,
    "created_at": "2026-03-28T10:00:00Z",
    "updated_at": "2026-03-29T15:30:00Z"
  },
  "reviews": [
    {
      "id": "uuid-review-001",
      "user": {
        "id": "uuid-user-002",
        "nickname": "뷰티러버"
      },
      "rating": 5.0,
      "content": "친구 추천으로 상담 받았는데 너무 만족합니다. 의사 선생님이 꼼꼼하게 설명해주셨어요.",
      "images": [
        {
          "id": "uuid-image-010",
          "url": "https://cdn.example.com/reviews/uuid-image-010.webp",
          "thumbnail_url": "https://cdn.example.com/reviews/uuid-image-010_thumb.webp"
        }
      ],
      "is_edited": false,
      "is_mine": false,
      "created_at": "2026-03-30T09:00:00Z",
      "updated_at": "2026-03-30T09:00:00Z"
    }
  ],
  "next_cursor": "eyJjcmVhdGVkX2F0IjoiMjAyNi0wMy0yOVQxMjowMDowMFoiLCJpZCI6InV1aWQtcmV2aWV3LTAwMiJ9",
  "has_more": true
}
```

---

### 3. 리뷰 수정 — `PUT /api/v1/reviews/:id`

> 인증: JWT 필수, 본인 리뷰만 수정 가능

**Request**

```json
{
  "rating": 4.0,
  "content": "수정합니다. 재방문했는데 역시 좋았어요. 상담도 친절하고 시설도 깔끔합니다. 다음에도 여기서 상담 받을 예정입니다.",
  "image_ids": [
    "uuid-image-001",
    "uuid-image-003"
  ]
}
```

**Response — 200 OK**

```json
{
  "id": "uuid-review-001",
  "hospital_id": "uuid-hospital-001",
  "match_id": "uuid-match-001",
  "user": {
    "id": "uuid-user-001",
    "nickname": "성형고민중"
  },
  "rating": 4.0,
  "content": "수정합니다. 재방문했는데 역시 좋았어요. 상담도 친절하고 시설도 깔끔합니다. 다음에도 여기서 상담 받을 예정입니다.",
  "images": [
    {
      "id": "uuid-image-001",
      "url": "https://cdn.example.com/reviews/uuid-image-001.webp",
      "thumbnail_url": "https://cdn.example.com/reviews/uuid-image-001_thumb.webp"
    },
    {
      "id": "uuid-image-003",
      "url": "https://cdn.example.com/reviews/uuid-image-003.webp",
      "thumbnail_url": "https://cdn.example.com/reviews/uuid-image-003_thumb.webp"
    }
  ],
  "is_edited": true,
  "created_at": "2026-03-30T14:30:00Z",
  "updated_at": "2026-03-30T16:00:00Z"
}
```

**에러 응답**

| 상태 코드 | 조건 | 응답 body |
|----------|------|----------|
| 401 Unauthorized | JWT 없음/만료 | `{"error": "인증이 필요합니다"}` |
| 403 Forbidden | 본인 리뷰가 아님 | `{"error": "본인의 리뷰만 수정할 수 있습니다"}` |
| 404 Not Found | 리뷰 존재하지 않음 | `{"error": "리뷰를 찾을 수 없습니다"}` |
| 422 Unprocessable Entity | 키워드 필터링 / 글자 수 | 작성 API와 동일 |

---

### 4. 리뷰 삭제 — `DELETE /api/v1/reviews/:id`

> 인증: JWT 필수, 본인 리뷰만 삭제 가능

**Response — 200 OK**

```json
{
  "message": "리뷰가 삭제되었습니다",
  "hospital_id": "uuid-hospital-001"
}
```

**에러 응답**

| 상태 코드 | 조건 | 응답 body |
|----------|------|----------|
| 401 Unauthorized | JWT 없음/만료 | `{"error": "인증이 필요합니다"}` |
| 403 Forbidden | 본인 리뷰가 아님 | `{"error": "본인의 리뷰만 삭제할 수 있습니다"}` |
| 404 Not Found | 리뷰 존재하지 않음 | `{"error": "리뷰를 찾을 수 없습니다"}` |

---

## DB 스키마

### reviews 테이블

```sql
CREATE TABLE reviews (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    match_id    UUID NOT NULL REFERENCES consultation_matches(id) ON DELETE CASCADE,
    rating      DECIMAL(2,1) NOT NULL CHECK (rating >= 1.0 AND rating <= 5.0),
    content     TEXT NOT NULL CHECK (char_length(content) >= 30 AND char_length(content) <= 1000),
    is_edited   BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- 병원-매칭 조합 유니크 제약 (중복 리뷰 방지)
    CONSTRAINT uq_reviews_hospital_match UNIQUE (hospital_id, match_id)
);

-- 인덱스
CREATE INDEX idx_reviews_hospital_id ON reviews(hospital_id);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_reviews_hospital_created ON reviews(hospital_id, created_at DESC);
CREATE INDEX idx_reviews_hospital_rating ON reviews(hospital_id, rating DESC);
```

### review_images 테이블

```sql
CREATE TABLE review_images (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id  UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    image_url  TEXT NOT NULL,
    thumbnail_url TEXT NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- 리뷰당 최대 5장 제한은 애플리케이션 레벨에서 검증
    CONSTRAINT chk_sort_order CHECK (sort_order >= 0 AND sort_order < 5)
);

-- 인덱스
CREATE INDEX idx_review_images_review_id ON review_images(review_id);
```

### 병원 평균 별점 캐시 (hospital_review_stats)

```sql
CREATE TABLE hospital_review_stats (
    hospital_id    UUID PRIMARY KEY REFERENCES hospitals(id) ON DELETE CASCADE,
    average_rating DECIMAL(2,1) NOT NULL DEFAULT 0.0,
    total_count    INT NOT NULL DEFAULT 0,
    rating_1       INT NOT NULL DEFAULT 0,
    rating_2       INT NOT NULL DEFAULT 0,
    rating_3       INT NOT NULL DEFAULT 0,
    rating_4       INT NOT NULL DEFAULT 0,
    rating_5       INT NOT NULL DEFAULT 0,
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 리뷰 생성/수정/삭제 시 트리거로 자동 갱신
```

---

## 구현 체크리스트

### 백엔드
- [ ] DB 스키마 (reviews, review_images, hospital_review_stats 테이블)
- [ ] 리뷰 생성 API — `POST /api/v1/reviews`
- [ ] 매칭 상태 검증 로직 (CHATTING / COMPLETED 확인)
- [ ] 중복 리뷰 검증 (hospital_id + match_id 유니크)
- [ ] 키워드 필터링 로직 (금액/연락처 패턴) -> [10_legal.md](./10_legal.md)
- [ ] 리뷰 목록 조회 API — `GET /api/v1/hospitals/:id/reviews` (커서 페이지네이션)
- [ ] 정렬 옵션 (최신순 / 별점 높은순 / 별점 낮은순)
- [ ] 리뷰 수정 API — `PUT /api/v1/reviews/:id` (본인 검증)
- [ ] 리뷰 삭제 API — `DELETE /api/v1/reviews/:id` (본인 검증)
- [ ] 평균 별점 + 분포 자동 갱신 (트리거 또는 이벤트)
- [ ] 리뷰 사진 presigned URL 업로드 연동 -> [08_media.md](./08_media.md)
- [ ] 리뷰 사진 후처리 (EXIF 제거, 리사이징, WebP) -> [08_media.md](./08_media.md)

### 프론트엔드
- [ ] 리뷰 작성 화면 UI (별점 선택 + 텍스트 입력 + 사진 첨부)
- [ ] 별점 0.5단위 탭/드래그 인터랙션
- [ ] 글자 수 실시간 카운터 (30~1,000자)
- [ ] 키워드 필터 실시간 경고 UI
- [ ] 사진 선택 + 미리보기 UI (최대 5장)
- [ ] 리뷰 수정 화면 UI (기존 데이터 프리필)
- [ ] 리뷰 삭제 확인 다이얼로그
- [ ] 병원 상세 — 리뷰 요약 영역 (평균 별점 + 분포 그래프 + 총 리뷰 수)
- [ ] 병원 상세 — 리뷰 목록 (무한 스크롤 + 정렬)
- [ ] 병원 상세 — 내 리뷰 상단 고정 + 수정/삭제 버튼
- [ ] 리뷰 사진 풀스크린 뷰어
- [ ] 리뷰 0건 빈 상태 UI
- [ ] 작성 자격 없을 시 비활성 상태 + 안내 메시지

---

## 현재 세션 로그
- 2026-03-30: 문서 작성 완료 (MVP-B)
