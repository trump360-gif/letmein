-- Rollback 007: 방문 예약 카드
DROP INDEX IF EXISTS idx_visit_cards_room;
DROP TABLE IF EXISTS visit_cards;
