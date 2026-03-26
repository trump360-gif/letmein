-- ============================================================
-- LetMeIn 목업 데이터 제거
-- seed_mock.sql로 추가된 데이터만 삭제
-- ============================================================

-- 순서: FK 의존성 역순으로 삭제
DELETE FROM poll_votes WHERE poll_id IN (1, 2);
DELETE FROM poll_options WHERE poll_id IN (1, 2);
DELETE FROM polls WHERE id IN (1, 2);

DELETE FROM reports WHERE id IN (1, 2);

DELETE FROM likes WHERE post_id IN (2, 3, 4, 5, 6, 7, 8);
DELETE FROM comments WHERE post_id IN (2, 3, 4, 5, 6, 7, 8);
DELETE FROM posts WHERE id IN (2, 3, 4, 5, 6, 7, 8);

DELETE FROM messages WHERE room_id = 2;
DELETE FROM chat_rooms WHERE id = 2;

DELETE FROM consultation_responses WHERE id IN (2, 3, 4, 5, 6, 7);
DELETE FROM consultation_request_details WHERE request_id IN (2, 3, 4, 5, 6);
DELETE FROM consultation_requests WHERE id IN (2, 3, 4, 5, 6);

DELETE FROM hospital_specialties WHERE hospital_id IN (3, 4, 5, 6, 7);
DELETE FROM hospitals WHERE id IN (3, 4, 5, 6, 7);

DELETE FROM user_notification_settings WHERE user_id BETWEEN 5 AND 15;
DELETE FROM user_interests WHERE user_id BETWEEN 5 AND 15;
DELETE FROM user_agreements WHERE user_id BETWEEN 5 AND 15;
DELETE FROM device_tokens WHERE user_id BETWEEN 5 AND 15;
DELETE FROM users WHERE id BETWEEN 5 AND 15;

SELECT '===== 목업 데이터 제거 완료 =====' AS result;
