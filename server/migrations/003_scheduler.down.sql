-- ============================================================
-- 003 rollback: 스케줄러 지원 컬럼 제거
-- ============================================================

DROP INDEX IF EXISTS idx_consultation_requests_escalation;

ALTER TABLE consultation_requests
    DROP COLUMN IF EXISTS escalated_at;
