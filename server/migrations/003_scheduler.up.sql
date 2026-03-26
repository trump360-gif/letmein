-- ============================================================
-- 003: 스케줄러 지원 컬럼 추가
-- - consultation_requests: escalated_at (매칭 SLA 에스컬레이션)
-- - users: status 'withdrawing' 지원 (withdrawn_at은 기존 컬럼 재사용)
-- ============================================================

-- 매칭 SLA 에스컬레이션 타임스탬프
ALTER TABLE consultation_requests
    ADD COLUMN escalated_at TIMESTAMPTZ;

CREATE INDEX idx_consultation_requests_escalation
    ON consultation_requests(status, coordinator_id, created_at)
    WHERE status = 'active' AND coordinator_id IS NULL;
