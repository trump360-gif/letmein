-- ============================================================
-- 007: 방문 예약 카드
-- - visit_cards: 병원이 채팅방 안에서 제안하는 방문 예약 카드
-- ============================================================

CREATE TABLE IF NOT EXISTS visit_cards (
    id           BIGSERIAL    PRIMARY KEY,
    room_id      BIGINT       NOT NULL REFERENCES chat_rooms(id),
    hospital_id  BIGINT       NOT NULL,
    proposed_date DATE        NOT NULL,
    proposed_time VARCHAR(10) NOT NULL,
    note         TEXT,
    status       VARCHAR(20)  NOT NULL DEFAULT 'proposed',
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    responded_at TIMESTAMPTZ
);

-- 채팅방별 최신순 조회 (주 용도)
CREATE INDEX idx_visit_cards_room ON visit_cards(room_id, created_at DESC);
