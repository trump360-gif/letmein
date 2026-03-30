-- 병원 갤러리 이미지 컬럼 추가
-- gallery_images: JSON 배열 문자열 (최대 10장 URL)
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS gallery_images TEXT DEFAULT '[]';
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS detailed_description TEXT;
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false;
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS premium_tier VARCHAR(20);
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS intro_video_url VARCHAR(500);
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS case_count INT DEFAULT 0;
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS avg_rating NUMERIC(2,1) DEFAULT 0;
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS review_count INT DEFAULT 0;
