-- 병원 갤러리 이미지 컬럼 제거
ALTER TABLE hospitals DROP COLUMN IF EXISTS gallery_images;
ALTER TABLE hospitals DROP COLUMN IF EXISTS detailed_description;
ALTER TABLE hospitals DROP COLUMN IF EXISTS is_premium;
ALTER TABLE hospitals DROP COLUMN IF EXISTS premium_tier;
ALTER TABLE hospitals DROP COLUMN IF EXISTS intro_video_url;
ALTER TABLE hospitals DROP COLUMN IF EXISTS case_count;
ALTER TABLE hospitals DROP COLUMN IF EXISTS avg_rating;
ALTER TABLE hospitals DROP COLUMN IF EXISTS review_count;
