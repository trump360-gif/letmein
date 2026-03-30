-- ============================================================
-- 005: 푸시 알림 시스템
-- - notifications: 사용자 알림 기록
-- - notification_settings: 사용자별 알림 수신 설정
-- ============================================================

-- 알림 기록
CREATE TABLE IF NOT EXISTS notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    body TEXT NOT NULL,
    data JSONB,
    deep_link VARCHAR(200),
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 미읽음 알림 목록 조회 (user_id + 읽음 여부 + 최신순)
CREATE INDEX idx_notifications_user_read ON notifications(user_id, read_at, created_at DESC);

-- 전체 알림 목록 조회 (커서 페이지네이션용)
CREATE INDEX idx_notifications_user_created ON notifications(user_id, created_at DESC);

-- 알림 수신 설정
CREATE TABLE IF NOT EXISTS notification_settings (
    user_id BIGINT PRIMARY KEY REFERENCES users(id),
    consultation_arrived BOOLEAN DEFAULT true,
    chat_message BOOLEAN DEFAULT true,
    chat_expiry BOOLEAN DEFAULT true,
    community_activity BOOLEAN DEFAULT true,
    event_notice BOOLEAN DEFAULT true,
    marketing BOOLEAN DEFAULT false,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
