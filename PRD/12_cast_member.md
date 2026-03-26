# 12. 출연자 (Cast Member) 시스템

> Phase: **MVP-A** (기본 인증/배지) / **MVP-B** (스토리 피드, 팔로우, Q&A)
> 선행 의존: [06_auth.md](./06_auth.md) (인증), [08_media.md](./08_media.md) (사진/영상)
> 연관: [03_community.md](./03_community.md) (출연자 스토리 Q&A 피드), [07_cms.md](./07_cms.md) (출연자 관리), [04_hospital.md](./04_hospital.md) (병원 상세 내 출연자 후기)

---

## 개요

유튜브 **'렛미인'** 채널 출연 경험자를 앱 내에서 인증된 출연자(Cast Member)로 관리하고, 출연자의 스토리 피드를 통해 팬덤을 플랫폼으로 락인(Lock-in)하는 시스템.

---

## 출연자 정의

| 항목 | 내용 |
|------|------|
| 자격 | 렛미인 유튜브 채널에 출연한 경험이 있는 유저 |
| 인증 방식 | CMS 관리자가 수동 승인 → [07_cms.md](./07_cms.md) |
| 앱 내 표시 | 닉네임 옆 **"렛미인 출연자"** 인증 배지 |
| 기본 계정 | 일반 유저와 동일 (추가 역할 부여) |

---

## 출연자 인증 플로우

```
일반 유저로 앱 가입 → 마이페이지에서 "출연자 인증 신청"
→ 출연 회차 정보 + 본인 확인 자료 제출
→ CMS 관리자 검토 (유튜브 영상 대조 확인)
→ 승인 → 출연자 배지 부여 + 스토리 업로드 권한 활성화
```

| 단계 | 상세 |
|------|------|
| 신청 정보 | 출연 회차 (에피소드 번호 또는 URL), 간단한 본인 소개 |
| 확인 방법 | CMS 관리자가 유튜브 영상과 프로필 대조 |
| 승인 소요 | 1~3 영업일 |
| 반려 시 | 사유 안내 + 재신청 가능 |

---

## 배지 시스템

| 배지 | 조건 | 표시 |
|------|------|------|
| 🏷️ 렛미인 출연자 | 1회 이상 출연 확인 | 닉네임 옆 인증 배지 |

> 향후 확장: 다회 출연, 시리즈 레귤러 등 추가 배지 검토 가능

배지 노출 위치:
- 커뮤니티 게시물 작성자명
- 스토리 피드 프로필
- 댓글 작성자명
- 채팅 (출연자가 상담 요청 시)

---

## 출연자 프로필

일반 유저 프로필에 추가되는 항목:

| 항목 | 내용 |
|------|------|
| 출연 에피소드 | 유튜브 에피소드 링크 리스트 (CMS에서 등록) |
| 시술 타임라인 | 시술 종류 + 시기 (출연자 자발적 입력) |
| 팔로워 수 | 이 출연자를 팔로우한 유저 수 |
| 스토리 피드 | 출연자가 올린 스토리 목록 |

---

## 팔로우 시스템

| 항목 | 내용 |
|------|------|
| 팔로우 방법 | 출연자 프로필 또는 스토리에서 "팔로우" 버튼 |
| 효과 — 피드 | 팔로우한 출연자의 스토리가 홈 피드 상단 노출 |
| 효과 — 알림 | 새 스토리 업로드 시 푸시 알림 발송 |
| 해제 | 언제든 언팔로우 가능 |
| 마이페이지 | "팔로잉 출연자" 목록 확인 가능 |

---

## 스토리 포스트

출연자만 업로드할 수 있는 전용 콘텐츠 유형.

### 스토리 구성

| 항목 | 내용 |
|------|------|
| 텍스트 | 최소 10자 / 최대 1,000자 |
| 사진 | 최대 10장 → [08_media.md](./08_media.md) |
| 영상 링크 | 유튜브 URL (앱 내 재생 없음, 딥링크) |
| 유튜브 회차 고정 | 출연 에피소드 링크가 스토리 하단에 자동 고정 |

### 스토리 유형

| 유형 | 설명 |
|------|------|
| 회복 일지 | 시술 후 회복 과정 업데이트 |
| Q&A | 유저 질문에 출연자가 답변 |
| 일상 | 변신 후 일상 공유 |

### 댓글 Q&A

- 유저가 스토리에 질문 댓글 작성
- 출연자가 답변 시 **"출연자 답변"** 배지 표시
- 출연자 답변은 댓글 상단 고정 옵션

---

## 홈 피드 노출

### 상단 스토리 바 (인스타그램 스타일)

```
[출연자A] [출연자B] [출연자C] [출연자D] ...
 (원형)    (원형)    (원형)    (원형)
```

- 원형 프로필 이미지 + 닉네임
- 새 스토리가 있는 출연자: 레드/버건디 테두리 → [13_design.md](./13_design.md) Accent 컬러
- 팔로우 중인 출연자 우선 정렬
- 탭 시 해당 출연자의 최신 스토리 피드로 이동

---

## 유튜브 에피소드 관리

> CMS에서 관리 → [07_cms.md](./07_cms.md)

| 항목 | 내용 |
|------|------|
| 등록 정보 | 유튜브 URL, 에피소드 제목, 출연자 연결, 방영일 |
| 썸네일 | `img.youtube.com/vi/{ID}/hqdefault.jpg` 자동 수집 |
| 출연자 연결 | 1개 에피소드에 여러 출연자 연결 가능 |
| 히어로 노출 | 선택된 에피소드는 홈 히어로 캐러셀에 노출 |

---

## 엣지 케이스

| 상황 | 처리 |
|------|------|
| 출연자 인증 후 탈퇴 | 스토리는 "탈퇴한 출연자"로 표시, 콘텐츠는 유지 (삭제 선택 가능) |
| 출연자 배지 박탈 | CMS에서 관리자가 배지 회수 가능 (정책 위반 시) |
| 출연자가 0명인 초기 | 히어로 캐러셀에 유튜브 영상만 노출, 스토리 바 미표시 |

---

## DB 스키마 추가

```sql
-- 출연자 인증 정보
CREATE TABLE cast_members (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) UNIQUE,
    badge_type VARCHAR(50) DEFAULT 'verified',
    bio TEXT,
    verified_at TIMESTAMP,
    verified_by BIGINT REFERENCES users(id), -- 승인한 관리자
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected, revoked
    created_at TIMESTAMP DEFAULT NOW()
);

-- 출연 에피소드
CREATE TABLE cast_member_episodes (
    id BIGSERIAL PRIMARY KEY,
    cast_member_id BIGINT NOT NULL REFERENCES cast_members(id),
    youtube_video_id VARCHAR(20) NOT NULL,
    episode_title VARCHAR(200),
    air_date DATE,
    thumbnail_url TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 팔로우
CREATE TABLE cast_member_followers (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    cast_member_id BIGINT NOT NULL REFERENCES cast_members(id),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, cast_member_id)
);
```

> 스토리 포스트는 기존 `posts` 테이블에 `board_type = 'cast_story'` 추가로 처리

---

## 구현 체크리스트

### 백엔드
- [ ] DB 마이그레이션 (cast_members, cast_member_episodes, cast_member_followers)
- [ ] 출연자 인증 신청 API
- [ ] 출연자 승인/반려 API (CMS)
- [ ] 출연자 프로필 조회 API
- [ ] 팔로우/언팔로우 API
- [ ] 팔로잉 출연자 목록 API
- [ ] 스토리 포스트 CRUD API (기존 post API 확장)
- [ ] 에피소드 CRUD API (CMS)
- [ ] 출연자 스토리 알림 발송

### 프론트엔드
- [ ] 출연자 인증 신청 UI (마이페이지)
- [ ] 출연자 프로필 UI (배지, 에피소드, 타임라인)
- [ ] 홈 상단 스토리 바 UI (원형 프로필)
- [ ] 스토리 피드 UI
- [ ] 팔로우 버튼 + 팔로잉 목록
- [ ] 스토리 Q&A 댓글 UI (출연자 답변 배지)
