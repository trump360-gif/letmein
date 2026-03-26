-- ============================================================
-- LetMeIn 목업 데이터 시드
-- 제거: seed_mock_cleanup.sql 실행
-- ============================================================

-- 유저 (ID 5~15)
INSERT INTO users (id, kakao_id, nickname, role, status) VALUES
(5,  3001, '뷰티러버', 'user', 'active'),
(6,  3002, '성형고민중', 'user', 'active'),
(7,  3003, '코성형후기', 'user', 'active'),
(8,  3004, '눈성형완료', 'user', 'active'),
(9,  3005, '자연라인', 'user', 'active'),
(10, 3006, '회복기간궁금', 'user', 'active'),
(11, 3007, '첫상담', 'user', 'active'),
(12, 4001, '압구정미인외과', 'hospital', 'active'),
(13, 4002, '청담라인성형', 'hospital', 'active'),
(14, 4003, '신사동뷰티', 'hospital', 'active'),
(15, 4004, '논현성형외과', 'hospital', 'active');
SELECT setval('users_id_seq', 15);

-- 알림 설정
INSERT INTO user_notification_settings (user_id) VALUES (5),(6),(7),(8),(9),(10),(11),(12),(13),(14),(15);

-- 병원 (ID 3~7)
INSERT INTO hospitals (id, user_id, name, business_number, description, address, phone, operating_hours, status, approved_at) VALUES
(3, 12, '압구정미인성형외과', '345-67-89012', '압구정 로데오 10년 전통. 눈·코 전문. 자연스러운 결과를 추구합니다.', '서울 강남구 압구정로 211', '02-3456-7890', '평일 10:00-19:00, 토 10:00-15:00', 'approved', NOW()),
(4, 13, '청담라인성형외과', '456-78-90123', '윤곽·리프팅 전문. 3D CT 기반 정밀 시뮬레이션.', '서울 강남구 청담동 123-4', '02-4567-8901', '평일 09:30-18:30, 토 09:30-13:00', 'approved', NOW()),
(5, 14, '신사동뷰티클리닉', '567-89-01234', '피부·레이저 전문. 최신 장비 보유.', '서울 강남구 신사동 645-2', '02-5678-9012', '평일 10:00-20:00, 토일 10:00-17:00', 'approved', NOW()),
(6, 15, '논현성형외과의원', '678-90-12345', '가슴성형 전문. 1만건 수술 경험.', '서울 강남구 논현로 852', '02-6789-0123', '평일 09:00-18:00', 'pending', NULL),
(7, 3,  '강남뷰티성형외과', '123-45-67890', '강남 대표 성형외과, 15년 전통', '서울 강남구 테헤란로 123', '02-1234-5678', '평일 10:00-19:00, 토 10:00-14:00', 'approved', NOW())
ON CONFLICT (id) DO UPDATE SET description=EXCLUDED.description, address=EXCLUDED.address;
SELECT setval('hospitals_id_seq', 7);

-- 병원 전문분야
INSERT INTO hospital_specialties (hospital_id, category_id) VALUES
(3, 1), (3, 2),       -- 압구정: 눈, 코
(4, 3), (4, 6),       -- 청담: 윤곽, 피부
(5, 6), (5, 7),       -- 신사: 피부, 기타
(6, 4),               -- 논현: 가슴
(7, 1), (7, 2), (7, 3) -- 강남: 눈, 코, 윤곽
ON CONFLICT DO NOTHING;

-- 상담 요청 (ID 2~6)
INSERT INTO consultation_requests (id, user_id, category_id, description, preferred_period, photo_public, status, expires_at, created_at) VALUES
(2, 5, 1, '쌍꺼풀 절개법을 고려하고 있습니다. 현재 속쌍인데 자연스러운 아웃라인을 원합니다. 붓기 회복 기간도 궁금합니다.', '1month', true, 'active', NOW() + interval '72 hours', NOW() - interval '2 hours'),
(3, 6, 2, '매부리코가 콤플렉스입니다. 콧대는 높이고 매부리 부분만 깎고 싶은데 가능한지 상담 받고 싶습니다.', '3months', true, 'active', NOW() + interval '60 hours', NOW() - interval '12 hours'),
(4, 7, 3, '사각턱이 고민입니다. V라인 윤곽 수술 경험 많은 병원 상담 원합니다. 회복 기간이 가장 걱정됩니다.', '6months', false, 'active', NOW() + interval '48 hours', NOW() - interval '24 hours'),
(5, 8, 1, '앞트임 + 뒤트임 동시 수술 가능한지 궁금합니다. 눈이 작아서 크게 만들고 싶어요.', '1month', true, 'completed', NOW() - interval '1 day', NOW() - interval '4 days'),
(6, 9, 6, '피부 리프팅에 관심있습니다. 울쎄라나 써마지 중 어떤 게 더 효과적인지 상담 원합니다.', '3months', true, 'expired', NOW() - interval '12 hours', NOW() - interval '4 days');
SELECT setval('consultation_requests_id_seq', 6);

-- 상담 요청 세부시술
INSERT INTO consultation_request_details (request_id, detail_id) VALUES
(2, 2), (2, 3),    -- 쌍꺼풀 절개법, 앞트임
(3, 10), (3, 11),  -- 매부리코, 비중격
(4, 12), (4, 15),  -- 사각턱, V라인
(5, 3), (5, 4),    -- 앞트임, 뒤트임
(6, 22), (6, 23)   -- 리프팅, 보톡스
ON CONFLICT DO NOTHING;

-- 상담 응답
INSERT INTO consultation_responses (id, request_id, hospital_id, intro, experience, message, consult_methods, consult_hours, status, created_at) VALUES
(2, 2, 7, '강남뷰티성형외과입니다', '쌍꺼풀 전문 15년, 연 2000건', '안녕하세요! 속쌍에서 아웃라인으로 자연스럽게 변환하는 수술을 많이 하고 있습니다. 절개법의 경우 약 1주 후 발사, 2~3주면 자연스러워집니다. 편하게 방문 상담 주세요.', 'visit,chat', '평일 10:00-19:00', 'sent', NOW() - interval '1 hour'),
(3, 2, 3, '압구정미인성형외과', '눈성형 전문의 3인', '쌍꺼풀 절개법은 저희 가장 많이 하는 수술입니다. 3D 시뮬레이션으로 수술 전 예상 결과를 보여드립니다. 상담 시 실제 사례 사진도 보실 수 있습니다.', 'visit,video', '평일 10:00-19:00, 토 10:00-15:00', 'sent', NOW() - interval '30 minutes'),
(4, 3, 7, '강남뷰티성형외과', '코성형 전문 10년', '매부리코 교정은 콧등 뼈를 절골하여 깎아내는 방식으로 진행됩니다. 동시에 콧대를 높이는 복합 수술도 가능합니다. 정확한 상담을 위해 내원 부탁드립니다.', 'visit', '평일 10:00-19:00', 'sent', NOW() - interval '10 hours'),
(5, 3, 3, '압구정미인성형외과', '코성형 5000건 이상', '매부리코 교정과 콧대 증대를 동시에 하시는 분들이 많습니다. 저희는 자가 비중격 연골을 사용하여 자연스러운 결과를 만듭니다.', 'visit,chat', '평일 10:00-19:00', 'sent', NOW() - interval '8 hours'),
(6, 5, 7, '강남뷰티성형외과', '눈성형 전문', '앞트임과 뒤트임 동시 수술 가능합니다. 자연스러운 눈매 라인을 위해 정밀 디자인을 합니다.', 'visit', '평일 10:00-19:00', 'selected', NOW() - interval '3 days'),
(7, 5, 3, '압구정미인성형외과', '눈 전문', '동시 수술 가능합니다. 상담 시 시뮬레이션으로 결과를 보여드립니다.', 'visit,chat', '평일 10:00-19:00', 'rejected', NOW() - interval '3 days');
SELECT setval('consultation_responses_id_seq', 7);

-- 채팅방 + 메시지
INSERT INTO chat_rooms (id, request_id, user_id, hospital_id, status, last_message_at, created_at) VALUES
(2, 5, 8, 7, 'active', NOW() - interval '1 hour', NOW() - interval '2 days');
SELECT setval('chat_rooms_id_seq', 2);

INSERT INTO messages (room_id, sender_id, message_type, content, read_at, created_at) VALUES
(2, 0, 'system', '상담이 시작되었습니다', NOW() - interval '2 days', NOW() - interval '2 days'),
(2, 0, 'system', '이 채팅은 의료 진단·처방이 아닌 상담 안내 목적입니다.', NOW() - interval '2 days', NOW() - interval '2 days'),
(2, 8, 'text', '안녕하세요! 앞트임+뒤트임 수술 문의드립니다. 수술 후 회복 기간은 어떻게 되나요?', NOW() - interval '1 day', NOW() - interval '2 days'),
(2, 3, 'text', '안녕하세요! 앞트임+뒤트임 동시 수술 시 약 5~7일 정도면 일상생활 가능합니다. 완전한 회복은 1~2개월 정도 소요됩니다.', NOW() - interval '1 day', NOW() - interval '1 day' - interval '12 hours'),
(2, 8, 'text', '혹시 수술 전에 시뮬레이션으로 결과를 볼 수 있나요?', NOW() - interval '6 hours', NOW() - interval '1 day'),
(2, 3, 'text', '네, 3D 시뮬레이션으로 수술 전 예상 결과를 보여드립니다. 방문 상담 예약하시면 바로 확인 가능합니다!', NULL, NOW() - interval '1 hour');

-- 커뮤니티 게시물 (ID 2~8)
INSERT INTO posts (id, user_id, board_type, category_id, title, content, hospital_id, is_anonymous, status, like_count, comment_count, created_at) VALUES
(2, 7, 'before_after', 2, NULL, '코 성형 3개월 차 후기입니다! 매부리코를 교정하고 코끝을 올렸어요. 처음엔 많이 부어서 걱정했는데 지금은 정말 자연스러워졌습니다. 주변에서 성형한 줄 모를 정도예요!', 3, false, 'active', 23, 5, NOW() - interval '3 days'),
(3, 8, 'before_after', 1, NULL, '쌍꺼풀 매몰법 한 지 1개월 됐어요. 라인이 정말 자연스럽게 나왔고, 아침에 붓는 것도 거의 없어졌어요. 수술 자체는 30분도 안 걸렸고 통증도 거의 없었습니다.', 7, false, 'active', 45, 8, NOW() - interval '5 days'),
(4, 9, 'before_after', 3, NULL, '사각턱 수술 6개월 후기! V라인이 확실히 잡혔어요. 초반에 부기가 심해서 힘들었지만 3개월 지나니까 확 빠졌습니다. 지금은 완전 만족합니다.', 4, false, 'active', 67, 12, NOW() - interval '7 days'),
(5, 5, 'before_after', 6, NULL, '울쎄라 시술 2주차입니다. 턱 라인이 확실히 올라간 느낌이에요. 시술 당일에는 좀 아팠지만 다음 날부터 바로 일상 가능했어요. 비수술이라 부담 없이 받을 수 있었습니다.', 5, false, 'active', 15, 3, NOW() - interval '2 days'),
(6, 10, 'free', NULL, '성형 처음 고민하시는 분들 팁', '성형 처음 알아보시는 분들! 꼭 3곳 이상 상담 받아보세요. 같은 수술인데 병원마다 설명이 다를 수 있어요. 그리고 상담 갈 때 화장 안 하고 가는 게 좋습니다!', NULL, false, 'active', 34, 7, NOW() - interval '1 day'),
(7, 6, 'free', NULL, '코 성형 회복 기간 질문', '코 성형 하신 분들, 회복 기간 어느 정도 걸리셨나요? 직장인이라 휴가를 며칠 내야 할지 고민입니다. 보통 부기는 언제 빠지나요?', NULL, false, 'active', 8, 11, NOW() - interval '6 hours'),
(8, 11, 'free', NULL, NULL, '첫 성형 상담 다녀왔는데 생각보다 부담 없었어요! 궁금한 거 다 물어봤고, 강요도 없었습니다. 역시 직접 가봐야 알 수 있는 것 같아요.', NULL, true, 'active', 12, 2, NOW() - interval '4 hours');
SELECT setval('posts_id_seq', 8);

-- 댓글
INSERT INTO comments (id, post_id, user_id, parent_id, content, is_anonymous, status, created_at) VALUES
(2, 2, 5, NULL, '와 정말 자연스럽다! 어디서 하셨어요?', false, 'active', NOW() - interval '2 days'),
(3, 2, 7, 2, '압구정미인성형외과에서 했어요!', false, 'active', NOW() - interval '2 days'),
(4, 2, 6, NULL, '저도 매부리코인데... 용기 얻고 갑니다', false, 'active', NOW() - interval '1 day'),
(5, 3, 9, NULL, '매몰법 부작용은 없으셨나요?', false, 'active', NOW() - interval '4 days'),
(6, 3, 8, 5, '전혀 없었어요! 선생님이 꼼꼼하게 해주셔서 만족합니다', false, 'active', NOW() - interval '4 days'),
(7, 4, 10, NULL, '사각턱 수술 무섭지 않으셨어요? 전신마취라 걱정됩니다...', false, 'active', NOW() - interval '6 days'),
(8, 4, 9, 7, '저도 걱정 많이 했는데 막상 하니까 잠들었다 깨는 거라 괜찮았어요!', false, 'active', NOW() - interval '6 days'),
(9, 6, 5, NULL, '저도 직장인인데 금요일에 수술하고 월요일에 출근했어요. 마스크 쓰면 괜찮습니다!', false, 'active', NOW() - interval '5 hours'),
(10, 6, 7, NULL, '저는 1주일 쉬었어요. 코 깁스 떼는 날까지는 쉬는 게 좋을 것 같아요.', false, 'active', NOW() - interval '4 hours'),
(11, 6, 11, NULL, '회사에 성형 한다고 말씀하셨나요? 저는 말하기 좀 그래서...', true, 'active', NOW() - interval '3 hours'),
(12, 7, 6, NULL, '저도 비슷한 경험이에요! 상담 받아보는 것만으로도 마음이 편해지더라고요', false, 'active', NOW() - interval '3 hours');
SELECT setval('comments_id_seq', 12);

-- 좋아요
INSERT INTO likes (user_id, post_id) VALUES
(5, 2), (6, 2), (8, 2), (9, 2), (10, 2), (11, 2),
(5, 3), (6, 3), (7, 3), (9, 3), (10, 3), (11, 3),
(5, 4), (6, 4), (7, 4), (8, 4), (10, 4), (11, 4),
(6, 5), (7, 5), (8, 5),
(5, 6), (7, 6), (8, 6), (9, 6),
(5, 7), (10, 7),
(5, 8), (6, 8), (7, 8)
ON CONFLICT DO NOTHING;

-- 투표
INSERT INTO polls (id, user_id, title, description, poll_type, status, vote_count, created_at) VALUES
(1, 5, '성형 시 가장 중요하게 생각하는 것은?', '성형을 결심할 때 가장 중요하게 고려하는 요소를 선택해주세요!', 'single', 'active', 47, NOW() - interval '2 days'),
(2, 6, '눈 성형 vs 코 성형, 먼저 한다면?', '둘 다 하고 싶은데 하나만 먼저 해야 한다면 뭘 먼저 하시겠어요?', 'single', 'active', 32, NOW() - interval '1 day');
SELECT setval('polls_id_seq', 2);

INSERT INTO poll_options (id, poll_id, text, vote_count, sort_order) VALUES
(1, 1, '의사 경력과 실력', 22, 1),
(2, 1, '병원 후기와 평판', 12, 2),
(3, 1, '가격', 8, 3),
(4, 1, '접근성 (위치)', 3, 4),
(5, 1, '시설과 장비', 2, 5),
(6, 2, '눈 성형 먼저!', 18, 1),
(7, 2, '코 성형 먼저!', 14, 2);
SELECT setval('poll_options_id_seq', 7);

INSERT INTO poll_votes (poll_id, option_id, user_id) VALUES
(1, 1, 5), (1, 1, 7), (1, 1, 8), (1, 2, 6), (1, 2, 9), (1, 3, 10), (1, 3, 11),
(2, 6, 5), (2, 6, 7), (2, 6, 8), (2, 7, 6), (2, 7, 9)
ON CONFLICT DO NOTHING;

-- 신고
INSERT INTO reports (id, reporter_id, target_type, target_id, reason, description, status, created_at) VALUES
(1, 10, 'post', 8, '허위 정보', '근거 없는 내용으로 보입니다', 'pending', NOW() - interval '3 hours'),
(2, 11, 'comment', 3, '광고성 내용', '특정 병원 홍보성 댓글 같습니다', 'pending', NOW() - interval '1 hour');
SELECT setval('reports_id_seq', 2);

SELECT '===== 목업 데이터 시드 완료 =====' AS result;
