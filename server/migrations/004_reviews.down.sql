-- ============================================================
-- 004 rollback: 병원 리뷰 시스템 제거
-- ============================================================

ALTER TABLE hospitals DROP COLUMN IF EXISTS review_count;
ALTER TABLE hospitals DROP COLUMN IF EXISTS avg_rating;

DROP TABLE IF EXISTS review_images;
DROP TABLE IF EXISTS reviews;
