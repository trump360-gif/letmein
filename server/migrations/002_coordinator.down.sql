-- Rollback 002: 코디네이터 매칭 + 출연자 + 프리미엄 + 광고

-- 광고
DROP TABLE IF EXISTS ad_impressions_daily CASCADE;
DROP TABLE IF EXISTS ad_campaigns CASCADE;
DROP TABLE IF EXISTS ad_creatives CASCADE;
DROP TABLE IF EXISTS ad_credit_transactions CASCADE;
DROP TABLE IF EXISTS ad_credits CASCADE;

-- 프리미엄
DROP TABLE IF EXISTS hospital_procedure_details CASCADE;
DROP TABLE IF EXISTS hospital_doctors CASCADE;
DROP TABLE IF EXISTS hospital_subscriptions CASCADE;
ALTER TABLE hospitals
    DROP COLUMN IF EXISTS is_premium,
    DROP COLUMN IF EXISTS premium_tier,
    DROP COLUMN IF EXISTS intro_video_url,
    DROP COLUMN IF EXISTS detailed_description,
    DROP COLUMN IF EXISTS case_count;

-- 출연자
DROP TABLE IF EXISTS cast_follows CASCADE;
DROP TABLE IF EXISTS cast_story_images CASCADE;
DROP TABLE IF EXISTS cast_stories CASCADE;
DROP TABLE IF EXISTS episode_cast_members CASCADE;
DROP TABLE IF EXISTS youtube_episodes CASCADE;
DROP TABLE IF EXISTS cast_members CASCADE;
ALTER TABLE comments
    DROP COLUMN IF EXISTS is_cast_answer,
    DROP COLUMN IF EXISTS is_pinned;

-- 코디네이터
DROP TABLE IF EXISTS coordinator_matches CASCADE;
ALTER TABLE consultation_requests
    DROP COLUMN IF EXISTS coordinator_id,
    DROP COLUMN IF EXISTS coordinator_note,
    DROP COLUMN IF EXISTS matched_at;
