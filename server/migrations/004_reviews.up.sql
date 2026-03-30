-- ============================================================
-- 004: 병원 리뷰 시스템
-- - reviews: 실제 상담 경험 기반 병원 리뷰
-- - review_images: 리뷰 첨부 이미지
-- - hospitals: avg_rating / review_count 집계 컬럼 추가
-- ============================================================

-- 리뷰
CREATE TABLE IF NOT EXISTS reviews (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    hospital_id BIGINT NOT NULL REFERENCES hospitals(id),
    request_id BIGINT NOT NULL REFERENCES consultation_requests(id),
    rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    content TEXT NOT NULL CHECK (char_length(content) BETWEEN 30 AND 1000),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 동일 상담 건당 1건의 리뷰만 허용
CREATE UNIQUE INDEX idx_reviews_user_hospital_request ON reviews(user_id, hospital_id, request_id);

-- 병원별 리뷰 목록 조회 (최신순)
CREATE INDEX idx_reviews_hospital ON reviews(hospital_id, created_at DESC);

-- 리뷰 이미지
CREATE TABLE IF NOT EXISTS review_images (
    id BIGSERIAL PRIMARY KEY,
    review_id BIGINT NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    sort_order INT DEFAULT 0
);

CREATE INDEX idx_review_images_review ON review_images(review_id);

-- 병원 평점 집계 컬럼 추가
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS avg_rating NUMERIC(2,1) DEFAULT 0;
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS review_count INT DEFAULT 0;
