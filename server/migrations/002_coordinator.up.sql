-- ============================================================
-- 002: 코디네이터 매칭 시스템 + 출연자 시스템 + 프리미엄 입점
-- PRD v2.1 기반 증축 마이그레이션
-- ============================================================

-- ============================================================
-- A. 코디네이터 매칭 (02_consultation.md)
-- ============================================================

-- consultation_requests 에 코디네이터 필드 추가
ALTER TABLE consultation_requests
    ADD COLUMN coordinator_id BIGINT REFERENCES users(id),
    ADD COLUMN coordinator_note TEXT,
    ADD COLUMN matched_at TIMESTAMPTZ;

-- 코디네이터 매칭 기록
CREATE TABLE coordinator_matches (
    id BIGSERIAL PRIMARY KEY,
    request_id BIGINT NOT NULL REFERENCES consultation_requests(id),
    hospital_id BIGINT NOT NULL REFERENCES hospitals(id),
    matched_by BIGINT NOT NULL REFERENCES users(id),  -- 코디네이터 user_id
    note TEXT,
    status VARCHAR(20) DEFAULT 'matched',  -- matched, chat_active, completed, cancelled
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(request_id, hospital_id)
);

CREATE INDEX idx_coordinator_matches_request ON coordinator_matches(request_id);
CREATE INDEX idx_coordinator_matches_hospital ON coordinator_matches(hospital_id);
CREATE INDEX idx_consultation_requests_coordinator ON consultation_requests(coordinator_id);

-- ============================================================
-- B. 출연자 시스템 (12_cast_member.md)
-- ============================================================

-- 출연자 프로필
CREATE TABLE cast_members (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT UNIQUE NOT NULL REFERENCES users(id),
    display_name VARCHAR(50) NOT NULL,
    bio TEXT,
    profile_image VARCHAR(500),
    badge_type VARCHAR(20) DEFAULT 'verified',  -- verified
    verification_status VARCHAR(20) DEFAULT 'pending',  -- pending, approved, rejected
    verified_at TIMESTAMPTZ,
    verified_by BIGINT REFERENCES users(id),  -- admin user_id
    rejection_reason TEXT,
    youtube_channel_url VARCHAR(500),
    follower_count INT DEFAULT 0,
    story_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cast_members_verification ON cast_members(verification_status);
CREATE INDEX idx_cast_members_user ON cast_members(user_id);

-- 유튜브 에피소드
CREATE TABLE youtube_episodes (
    id BIGSERIAL PRIMARY KEY,
    youtube_url VARCHAR(500) NOT NULL,
    youtube_video_id VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    thumbnail_url VARCHAR(500),
    air_date DATE,
    is_hero BOOLEAN DEFAULT FALSE,  -- 홈 히어로 캐러셀 노출 여부
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 에피소드-출연자 연결 (다대다)
CREATE TABLE episode_cast_members (
    episode_id BIGINT NOT NULL REFERENCES youtube_episodes(id) ON DELETE CASCADE,
    cast_member_id BIGINT NOT NULL REFERENCES cast_members(id) ON DELETE CASCADE,
    PRIMARY KEY (episode_id, cast_member_id)
);

-- 출연자 스토리 (피드)
CREATE TABLE cast_stories (
    id BIGSERIAL PRIMARY KEY,
    cast_member_id BIGINT NOT NULL REFERENCES cast_members(id),
    episode_id BIGINT REFERENCES youtube_episodes(id),  -- 연결된 에피소드 (선택)
    content TEXT NOT NULL,
    story_type VARCHAR(20) DEFAULT 'general',  -- general, recovery, qa, tip
    status VARCHAR(20) DEFAULT 'active',  -- active, blinded, deleted
    like_count INT DEFAULT 0,
    comment_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cast_stories_member ON cast_stories(cast_member_id);
CREATE INDEX idx_cast_stories_status ON cast_stories(status);

-- 스토리 이미지 (다중)
CREATE TABLE cast_story_images (
    id BIGSERIAL PRIMARY KEY,
    story_id BIGINT NOT NULL REFERENCES cast_stories(id) ON DELETE CASCADE,
    image_id BIGINT NOT NULL REFERENCES images(id),
    sort_order INT DEFAULT 0
);

-- 출연자 팔로우
CREATE TABLE cast_follows (
    user_id BIGINT NOT NULL REFERENCES users(id),
    cast_member_id BIGINT NOT NULL REFERENCES cast_members(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, cast_member_id)
);

CREATE INDEX idx_cast_follows_member ON cast_follows(cast_member_id);

-- 출연자 답변 표시 (댓글 테이블의 확장)
-- comments 테이블에 출연자 답변 여부 + 고정 여부 추가
ALTER TABLE comments
    ADD COLUMN is_cast_answer BOOLEAN DEFAULT FALSE,
    ADD COLUMN is_pinned BOOLEAN DEFAULT FALSE;

-- ============================================================
-- C. 프리미엄 입점 (12_revenue.md)
-- ============================================================

-- 병원 프리미엄 구독
CREATE TABLE hospital_subscriptions (
    id BIGSERIAL PRIMARY KEY,
    hospital_id BIGINT NOT NULL REFERENCES hospitals(id),
    tier VARCHAR(20) NOT NULL DEFAULT 'basic',  -- basic, pro
    status VARCHAR(20) NOT NULL DEFAULT 'active',  -- active, expired, cancelled
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    cancelled_at TIMESTAMPTZ,
    monthly_price INT NOT NULL,  -- 원 단위
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_hospital_subscriptions_hospital ON hospital_subscriptions(hospital_id);
CREATE INDEX idx_hospital_subscriptions_status ON hospital_subscriptions(status);

-- hospitals 테이블에 프리미엄 관련 확장 필드 추가
ALTER TABLE hospitals
    ADD COLUMN is_premium BOOLEAN DEFAULT FALSE,
    ADD COLUMN premium_tier VARCHAR(20),
    ADD COLUMN intro_video_url VARCHAR(500),
    ADD COLUMN detailed_description TEXT,
    ADD COLUMN case_count INT DEFAULT 0;

-- 병원 의료진 프로필 (프리미엄 전용)
CREATE TABLE hospital_doctors (
    id BIGSERIAL PRIMARY KEY,
    hospital_id BIGINT NOT NULL REFERENCES hospitals(id),
    name VARCHAR(50) NOT NULL,
    title VARCHAR(100),  -- 예: "대표원장", "코성형 전문"
    experience TEXT,  -- 예: "코성형 15년 경력"
    profile_image VARCHAR(500),
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_hospital_doctors_hospital ON hospital_doctors(hospital_id);

-- 병원 시술 상세 설명 (프리미엄 전용)
CREATE TABLE hospital_procedure_details (
    id BIGSERIAL PRIMARY KEY,
    hospital_id BIGINT NOT NULL REFERENCES hospitals(id),
    category_id INT NOT NULL REFERENCES procedure_categories(id),
    description TEXT,
    image_url VARCHAR(500),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(hospital_id, category_id)
);

-- ============================================================
-- D. 네이티브 광고 (12_revenue.md, 3차)
-- ============================================================

-- 광고 크레딧
CREATE TABLE ad_credits (
    id BIGSERIAL PRIMARY KEY,
    hospital_id BIGINT NOT NULL REFERENCES hospitals(id),
    balance INT NOT NULL DEFAULT 0,  -- 원 단위 잔액
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_ad_credits_hospital ON ad_credits(hospital_id);

-- 광고 크레딧 내역
CREATE TABLE ad_credit_transactions (
    id BIGSERIAL PRIMARY KEY,
    hospital_id BIGINT NOT NULL REFERENCES hospitals(id),
    amount INT NOT NULL,  -- 양수: 충전, 음수: 차감
    type VARCHAR(20) NOT NULL,  -- charge, spend, refund
    description VARCHAR(200),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ad_credit_transactions_hospital ON ad_credit_transactions(hospital_id);

-- 광고 소재
CREATE TABLE ad_creatives (
    id BIGSERIAL PRIMARY KEY,
    hospital_id BIGINT NOT NULL REFERENCES hospitals(id),
    image_url VARCHAR(500) NOT NULL,
    headline VARCHAR(60) NOT NULL,
    review_status VARCHAR(20) DEFAULT 'pending',  -- pending, approved, rejected
    rejection_reason TEXT,
    reviewed_at TIMESTAMPTZ,
    reviewed_by BIGINT REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ad_creatives_hospital ON ad_creatives(hospital_id);
CREATE INDEX idx_ad_creatives_status ON ad_creatives(review_status);

-- 광고 캠페인
CREATE TABLE ad_campaigns (
    id BIGSERIAL PRIMARY KEY,
    hospital_id BIGINT NOT NULL REFERENCES hospitals(id),
    creative_id BIGINT NOT NULL REFERENCES ad_creatives(id),
    placement VARCHAR(30) NOT NULL,  -- community_feed
    status VARCHAR(20) DEFAULT 'active',  -- active, paused, completed, exhausted
    daily_budget INT NOT NULL,  -- 일 예산 (원)
    cpm_price INT NOT NULL,  -- 1000회 노출당 가격 (원)
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_impressions BIGINT DEFAULT 0,
    total_clicks BIGINT DEFAULT 0,
    total_spent INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ad_campaigns_hospital ON ad_campaigns(hospital_id);
CREATE INDEX idx_ad_campaigns_status ON ad_campaigns(status);
CREATE INDEX idx_ad_campaigns_dates ON ad_campaigns(start_date, end_date);

-- 광고 노출 로그 (일별 집계)
CREATE TABLE ad_impressions_daily (
    id BIGSERIAL PRIMARY KEY,
    campaign_id BIGINT NOT NULL REFERENCES ad_campaigns(id),
    date DATE NOT NULL,
    impressions INT DEFAULT 0,
    clicks INT DEFAULT 0,
    spent INT DEFAULT 0,
    UNIQUE(campaign_id, date)
);

CREATE INDEX idx_ad_impressions_daily_campaign ON ad_impressions_daily(campaign_id);

-- ============================================================
-- E. users 테이블 role 확장
-- ============================================================
-- 기존 role: user, hospital, admin
-- 추가: coordinator (코디네이터 역할)
-- role VARCHAR(20)은 이미 충분한 크기이므로 별도 ALTER 불필요
-- 코디네이터는 admin 그룹에서 접근하되, coordinator role로 구분
