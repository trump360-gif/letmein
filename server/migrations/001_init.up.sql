-- 시술 카테고리 마스터
CREATE TABLE procedure_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    icon VARCHAR(100),
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 세부 시술 마스터
CREATE TABLE procedure_details (
    id SERIAL PRIMARY KEY,
    category_id INT NOT NULL REFERENCES procedure_categories(id),
    name VARCHAR(100) NOT NULL,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 유저
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    kakao_id BIGINT UNIQUE NOT NULL,
    nickname VARCHAR(20) UNIQUE,
    profile_image VARCHAR(500),
    role VARCHAR(20) DEFAULT 'user', -- user, hospital, admin
    status VARCHAR(20) DEFAULT 'active', -- active, withdrawn, suspended
    withdrawn_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 이용약관 동의
CREATE TABLE user_agreements (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    agreement_type VARCHAR(50) NOT NULL, -- terms, privacy, age, marketing, sensitive_data
    agreed BOOLEAN NOT NULL DEFAULT FALSE,
    agreed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 관심 시술
CREATE TABLE user_interests (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    category_id INT NOT NULL REFERENCES procedure_categories(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, category_id)
);

-- 알림 설정
CREATE TABLE user_notification_settings (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT UNIQUE NOT NULL REFERENCES users(id),
    consultation_arrived BOOLEAN DEFAULT TRUE,
    chat_message BOOLEAN DEFAULT TRUE,
    chat_expiry BOOLEAN DEFAULT TRUE,
    community_activity BOOLEAN DEFAULT TRUE,
    event_notice BOOLEAN DEFAULT TRUE,
    marketing BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- FCM 디바이스 토큰
CREATE TABLE device_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    token VARCHAR(500) NOT NULL,
    platform VARCHAR(10) NOT NULL, -- ios, android
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, token)
);

-- 병원
CREATE TABLE hospitals (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT UNIQUE NOT NULL REFERENCES users(id),
    name VARCHAR(100) NOT NULL,
    business_number VARCHAR(20),
    license_image VARCHAR(500),
    description TEXT,
    address VARCHAR(300),
    phone VARCHAR(20),
    operating_hours VARCHAR(200),
    profile_image VARCHAR(500),
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected, suspended
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 병원 전문 분야
CREATE TABLE hospital_specialties (
    id BIGSERIAL PRIMARY KEY,
    hospital_id BIGINT NOT NULL REFERENCES hospitals(id),
    category_id INT NOT NULL REFERENCES procedure_categories(id),
    UNIQUE(hospital_id, category_id)
);

-- 이미지
CREATE TABLE images (
    id BIGSERIAL PRIMARY KEY,
    uploader_id BIGINT NOT NULL REFERENCES users(id),
    bucket VARCHAR(20) NOT NULL, -- public, private
    original_path VARCHAR(500) NOT NULL,
    thumb_path VARCHAR(500),
    medium_path VARCHAR(500),
    full_path VARCHAR(500),
    content_type VARCHAR(50),
    size_bytes BIGINT,
    entity_type VARCHAR(50), -- consultation, chat, community, hospital
    entity_id BIGINT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 상담 요청
CREATE TABLE consultation_requests (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    category_id INT NOT NULL REFERENCES procedure_categories(id),
    description TEXT NOT NULL,
    preferred_period VARCHAR(30), -- 1month, 3months, 6months, undecided
    photo_public BOOLEAN DEFAULT TRUE,
    status VARCHAR(20) DEFAULT 'active', -- active, expired, completed, cancelled
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 상담 요청 세부 시술
CREATE TABLE consultation_request_details (
    request_id BIGINT NOT NULL REFERENCES consultation_requests(id),
    detail_id INT NOT NULL REFERENCES procedure_details(id),
    PRIMARY KEY (request_id, detail_id)
);

-- 병원 상담 응답
CREATE TABLE consultation_responses (
    id BIGSERIAL PRIMARY KEY,
    request_id BIGINT NOT NULL REFERENCES consultation_requests(id),
    hospital_id BIGINT NOT NULL REFERENCES hospitals(id),
    intro VARCHAR(60),
    experience VARCHAR(60),
    message TEXT NOT NULL,
    consult_methods VARCHAR(100), -- visit,video,chat
    consult_hours VARCHAR(100),
    status VARCHAR(20) DEFAULT 'sent', -- sent, selected, rejected, expired
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(request_id, hospital_id)
);

-- 채팅방
CREATE TABLE chat_rooms (
    id BIGSERIAL PRIMARY KEY,
    request_id BIGINT REFERENCES consultation_requests(id),
    user_id BIGINT NOT NULL REFERENCES users(id),
    hospital_id BIGINT NOT NULL REFERENCES hospitals(id),
    status VARCHAR(20) DEFAULT 'active', -- active, closed, auto_closed
    closed_at TIMESTAMPTZ,
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 메시지
CREATE TABLE messages (
    id BIGSERIAL PRIMARY KEY,
    room_id BIGINT NOT NULL REFERENCES chat_rooms(id),
    sender_id BIGINT NOT NULL REFERENCES users(id),
    message_type VARCHAR(20) DEFAULT 'text', -- text, image, system
    content TEXT,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 커뮤니티 게시물
CREATE TABLE posts (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    board_type VARCHAR(20) NOT NULL, -- before_after, free, qna
    category_id INT REFERENCES procedure_categories(id),
    title VARCHAR(200),
    content TEXT NOT NULL,
    hospital_id BIGINT REFERENCES hospitals(id), -- 병원 태깅
    procedure_date DATE,
    is_anonymous BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'active', -- active, blinded, deleted
    like_count INT DEFAULT 0,
    comment_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 댓글
CREATE TABLE comments (
    id BIGSERIAL PRIMARY KEY,
    post_id BIGINT NOT NULL REFERENCES posts(id),
    user_id BIGINT NOT NULL REFERENCES users(id),
    parent_id BIGINT REFERENCES comments(id),
    content TEXT NOT NULL,
    is_anonymous BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 좋아요
CREATE TABLE likes (
    user_id BIGINT NOT NULL REFERENCES users(id),
    post_id BIGINT NOT NULL REFERENCES posts(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, post_id)
);

-- 신고
CREATE TABLE reports (
    id BIGSERIAL PRIMARY KEY,
    reporter_id BIGINT NOT NULL REFERENCES users(id),
    target_type VARCHAR(20) NOT NULL, -- post, comment, message, hospital
    target_id BIGINT NOT NULL,
    reason VARCHAR(50) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending', -- pending, resolved, dismissed
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_users_kakao_id ON users(kakao_id);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_hospitals_status ON hospitals(status);
CREATE INDEX idx_consultation_requests_user ON consultation_requests(user_id);
CREATE INDEX idx_consultation_requests_status ON consultation_requests(status);
CREATE INDEX idx_consultation_requests_expires ON consultation_requests(expires_at);
CREATE INDEX idx_consultation_responses_request ON consultation_responses(request_id);
CREATE INDEX idx_chat_rooms_user ON chat_rooms(user_id);
CREATE INDEX idx_chat_rooms_hospital ON chat_rooms(hospital_id);
CREATE INDEX idx_messages_room ON messages(room_id);
CREATE INDEX idx_posts_board_type ON posts(board_type);
CREATE INDEX idx_posts_hospital ON posts(hospital_id);
CREATE INDEX idx_comments_post ON comments(post_id);
