# DB Schema — CMS Admin
> PostgreSQL 기준 | 이미지는 BYTEA 저장 (추후 R2 마이그레이션)

---

## 설계 원칙
- **Soft delete**: 주요 테이블에 `deleted_at TIMESTAMP` 포함
- **Audit trail**: `created_at`, `updated_at` 모든 테이블 포함
- **다국어 대비**: 텍스트 필드는 translations 테이블로 분리
- **이미지 저장**: 현재 PostgreSQL BYTEA → 추후 Cloudflare R2 마이그레이션

---

## 1. 사이트 설정

```sql
CREATE TABLE site_settings (
  id          BIGSERIAL PRIMARY KEY,
  key         VARCHAR(100) UNIQUE NOT NULL,
  value       TEXT,
  value_type  VARCHAR(20) DEFAULT 'string', -- string | json | boolean | number
  description TEXT,
  updated_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE translations (
  id         BIGSERIAL PRIMARY KEY,
  key        VARCHAR(255) UNIQUE NOT NULL,
  ko         TEXT NOT NULL,
  ja         TEXT,
  en         TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_translations_key ON translations(key);

CREATE TABLE terms (
  id          BIGSERIAL PRIMARY KEY,
  type        VARCHAR(50) NOT NULL, -- service | privacy | marketing
  version     VARCHAR(20) NOT NULL,
  title       VARCHAR(255) NOT NULL,
  content     TEXT NOT NULL,
  is_required BOOLEAN DEFAULT TRUE,
  enforced_at TIMESTAMP NOT NULL,
  created_at  TIMESTAMP DEFAULT NOW()
);
```

---

## 2. 회원

```sql
CREATE TABLE users (
  id                   BIGSERIAL PRIMARY KEY,
  email                VARCHAR(255) UNIQUE,
  password_hash        VARCHAR(255),
  nickname             VARCHAR(50) NOT NULL,
  name                 VARCHAR(50),
  phone                VARCHAR(20),
  avatar_data          BYTEA,
  grade                SMALLINT DEFAULT 1,
  points               INTEGER DEFAULT 0,
  status               VARCHAR(20) DEFAULT 'active',
  -- active | dormant | suspended | withdrawn
  social_provider      VARCHAR(20),
  social_id            VARCHAR(255),
  email_verified_at    TIMESTAMP,
  phone_verified_at    TIMESTAMP,
  identity_verified_at TIMESTAMP,
  last_login_at        TIMESTAMP,
  dormant_notified_at  TIMESTAMP,
  suspended_until      TIMESTAMP,
  suspension_reason    TEXT,
  created_at           TIMESTAMP DEFAULT NOW(),
  updated_at           TIMESTAMP DEFAULT NOW(),
  deleted_at           TIMESTAMP
);
CREATE UNIQUE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_grade ON users(grade);
CREATE INDEX idx_users_status ON users(status);

CREATE TABLE user_terms_agreements (
  id         BIGSERIAL PRIMARY KEY,
  user_id    BIGINT NOT NULL REFERENCES users(id),
  terms_id   BIGINT NOT NULL REFERENCES terms(id),
  agreed_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_grades (
  id               BIGSERIAL PRIMARY KEY,
  grade            SMALLINT UNIQUE NOT NULL,
  name             VARCHAR(50) NOT NULL,
  conditions       JSONB,
  -- {"post_count":10,"comment_count":20,"days":7,"mode":"AND"}
  auto_upgrade     BOOLEAN DEFAULT TRUE,
  notify_upgrade   BOOLEAN DEFAULT TRUE,
  storage_limit_mb INTEGER DEFAULT 100,
  created_at       TIMESTAMP DEFAULT NOW(),
  updated_at       TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_grade_history (
  id         BIGSERIAL PRIMARY KEY,
  user_id    BIGINT NOT NULL REFERENCES users(id),
  from_grade SMALLINT NOT NULL,
  to_grade   SMALLINT NOT NULL,
  reason     VARCHAR(50), -- auto | manual | sanction
  changed_by BIGINT REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_grade_history_user ON user_grade_history(user_id);

CREATE TABLE points (
  id         BIGSERIAL PRIMARY KEY,
  user_id    BIGINT NOT NULL REFERENCES users(id),
  amount     INTEGER NOT NULL,
  balance    INTEGER NOT NULL,
  type       VARCHAR(50) NOT NULL,
  -- post | comment | attendance | like | sanction | manual
  ref_type   VARCHAR(50),
  ref_id     BIGINT,
  note       TEXT,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_points_user ON points(user_id);

CREATE TABLE point_rules (
  id          BIGSERIAL PRIMARY KEY,
  type        VARCHAR(50) UNIQUE NOT NULL,
  amount      INTEGER NOT NULL,
  daily_limit INTEGER,
  min_length  INTEGER,
  is_active   BOOLEAN DEFAULT TRUE,
  updated_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE device_fingerprints (
  id          BIGSERIAL PRIMARY KEY,
  user_id     BIGINT NOT NULL REFERENCES users(id),
  fingerprint VARCHAR(255) NOT NULL,
  user_agent  TEXT,
  created_at  TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_fingerprint_hash ON device_fingerprints(fingerprint);
```

---

## 3. 게시판

```sql
CREATE TABLE board_groups (
  id         BIGSERIAL PRIMARY KEY,
  name_key   VARCHAR(255) NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE boards (
  id               BIGSERIAL PRIMARY KEY,
  group_id         BIGINT REFERENCES board_groups(id),
  parent_id        BIGINT REFERENCES boards(id),
  name_key         VARCHAR(255) NOT NULL,
  slug             VARCHAR(100) NOT NULL UNIQUE,
  full_path        VARCHAR(500) NOT NULL UNIQUE,
  depth            SMALLINT DEFAULT 0,
  type             VARCHAR(30) DEFAULT 'general',
  -- general | gallery | archive | qa | video | calendar | vote
  description      TEXT,
  thumbnail_data   BYTEA,
  sort_order       INTEGER DEFAULT 0,
  is_visible       BOOLEAN DEFAULT TRUE,

  -- 권한 (최소 등급)
  read_grade       SMALLINT DEFAULT 0,
  write_grade      SMALLINT DEFAULT 1,
  comment_grade    SMALLINT DEFAULT 1,
  upload_grade     SMALLINT DEFAULT 1,
  like_grade       SMALLINT DEFAULT 1,

  -- 게시물 설정
  allow_anonymous  BOOLEAN DEFAULT FALSE,
  allow_secret     BOOLEAN DEFAULT FALSE,
  allow_attachment BOOLEAN DEFAULT TRUE,
  min_length       INTEGER DEFAULT 0,
  max_length       INTEGER,
  allow_schedule   BOOLEAN DEFAULT FALSE,
  report_threshold INTEGER DEFAULT 5,
  auto_blind       BOOLEAN DEFAULT TRUE,
  filter_level     VARCHAR(10) DEFAULT 'normal',

  -- 인터랙션
  use_like         BOOLEAN DEFAULT TRUE,
  use_dislike      BOOLEAN DEFAULT FALSE,
  use_comment      BOOLEAN DEFAULT TRUE,
  use_reply        BOOLEAN DEFAULT TRUE,
  use_share        BOOLEAN DEFAULT TRUE,
  use_view_count   BOOLEAN DEFAULT TRUE,

  -- 복사 방지
  prevent_copy     BOOLEAN DEFAULT FALSE,
  watermark        BOOLEAN DEFAULT FALSE,

  -- 스킨
  skin             VARCHAR(20) DEFAULT 'list',
  per_page         INTEGER DEFAULT 20,

  created_at       TIMESTAMP DEFAULT NOW(),
  updated_at       TIMESTAMP DEFAULT NOW(),
  deleted_at       TIMESTAMP
);
CREATE INDEX idx_boards_slug ON boards(slug);
CREATE INDEX idx_boards_full_path ON boards(full_path);
```

---

## 4. 콘텐츠

```sql
CREATE TABLE posts (
  id            BIGSERIAL PRIMARY KEY,
  board_id      BIGINT NOT NULL REFERENCES boards(id),
  user_id       BIGINT REFERENCES users(id),
  category_id   BIGINT REFERENCES boards(id),
  title         VARCHAR(500) NOT NULL,
  content       TEXT NOT NULL,
  content_plain TEXT,
  thumbnail_id  BIGINT,
  is_notice     BOOLEAN DEFAULT FALSE,
  is_anonymous  BOOLEAN DEFAULT FALSE,
  is_secret     BOOLEAN DEFAULT FALSE,
  status        VARCHAR(20) DEFAULT 'published',
  -- published | draft | blind | deleted | scheduled
  view_count    INTEGER DEFAULT 0,
  like_count    INTEGER DEFAULT 0,
  dislike_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  report_count  INTEGER DEFAULT 0,

  -- SEO
  meta_title    VARCHAR(255),
  meta_desc     TEXT,
  og_image_id   BIGINT,
  no_index      BOOLEAN DEFAULT FALSE,

  -- AO/GEO
  summary       TEXT,
  faq_data      JSONB,
  schema_type   VARCHAR(50),

  scheduled_at  TIMESTAMP,
  published_at  TIMESTAMP DEFAULT NOW(),
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW(),
  deleted_at    TIMESTAMP
);
CREATE INDEX idx_posts_board ON posts(board_id, status, published_at DESC)
  WHERE deleted_at IS NULL;
CREATE INDEX idx_posts_user ON posts(user_id);

CREATE TABLE post_revisions (
  id         BIGSERIAL PRIMARY KEY,
  post_id    BIGINT NOT NULL REFERENCES posts(id),
  user_id    BIGINT REFERENCES users(id),
  title      VARCHAR(500) NOT NULL,
  content    TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_revisions_post ON post_revisions(post_id);

CREATE TABLE comments (
  id           BIGSERIAL PRIMARY KEY,
  post_id      BIGINT NOT NULL REFERENCES posts(id),
  parent_id    BIGINT REFERENCES comments(id),
  user_id      BIGINT REFERENCES users(id),
  content      TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT FALSE,
  is_secret    BOOLEAN DEFAULT FALSE,
  like_count   INTEGER DEFAULT 0,
  report_count INTEGER DEFAULT 0,
  status       VARCHAR(20) DEFAULT 'active',
  created_at   TIMESTAMP DEFAULT NOW(),
  updated_at   TIMESTAMP DEFAULT NOW(),
  deleted_at   TIMESTAMP
);
CREATE INDEX idx_comments_post ON comments(post_id) WHERE deleted_at IS NULL;

CREATE TABLE post_likes (
  id         BIGSERIAL PRIMARY KEY,
  post_id    BIGINT REFERENCES posts(id),
  comment_id BIGINT REFERENCES comments(id),
  user_id    BIGINT NOT NULL REFERENCES users(id),
  type       VARCHAR(10) DEFAULT 'like',
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(post_id, user_id, type),
  UNIQUE(comment_id, user_id, type)
);

CREATE TABLE post_views (
  id          BIGSERIAL PRIMARY KEY,
  post_id     BIGINT NOT NULL REFERENCES posts(id),
  user_id     BIGINT REFERENCES users(id),
  ip_hash     VARCHAR(64),
  fingerprint VARCHAR(255),
  created_at  TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_views_post ON post_views(post_id);

CREATE TABLE tags (
  id         BIGSERIAL PRIMARY KEY,
  name       VARCHAR(100) UNIQUE NOT NULL,
  use_count  INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE post_tags (
  post_id BIGINT NOT NULL REFERENCES posts(id),
  tag_id  BIGINT NOT NULL REFERENCES tags(id),
  PRIMARY KEY (post_id, tag_id)
);

CREATE TABLE media_folders (
  id         BIGSERIAL PRIMARY KEY,
  user_id    BIGINT REFERENCES users(id),
  parent_id  BIGINT REFERENCES media_folders(id),
  name       VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE media (
  id            BIGSERIAL PRIMARY KEY,
  user_id       BIGINT REFERENCES users(id),
  folder_id     BIGINT REFERENCES media_folders(id),
  original_name VARCHAR(255) NOT NULL,
  file_type     VARCHAR(20) NOT NULL,       -- image | video | file
  mime_type     VARCHAR(50) NOT NULL,
  size_bytes    INTEGER NOT NULL,
  width         INTEGER,
  height        INTEGER,
  alt_text      VARCHAR(255),
  data          BYTEA NOT NULL,             -- WebP 바이너리 (추후 R2 url로 교체)
  thumb_data    BYTEA,                      -- 썸네일 400x400
  -- 마이그레이션 후 추가:
  -- url       VARCHAR(500),
  -- thumb_url VARCHAR(500),
  created_at    TIMESTAMP DEFAULT NOW(),
  deleted_at    TIMESTAMP
);
CREATE INDEX idx_media_user ON media(user_id) WHERE deleted_at IS NULL;

CREATE TABLE templates (
  id         BIGSERIAL PRIMARY KEY,
  user_id    BIGINT NOT NULL REFERENCES users(id),
  board_id   BIGINT REFERENCES boards(id),
  name       VARCHAR(100) NOT NULL,
  content    TEXT NOT NULL,
  is_public  BOOLEAN DEFAULT FALSE,
  is_system  BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE drafts (
  id         BIGSERIAL PRIMARY KEY,
  user_id    BIGINT NOT NULL REFERENCES users(id),
  board_id   BIGINT REFERENCES boards(id),
  post_id    BIGINT REFERENCES posts(id),
  title      VARCHAR(500),
  content    TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_drafts_user ON drafts(user_id);
```

---

## 5. 신고 / 제재

```sql
CREATE TABLE reports (
  id           BIGSERIAL PRIMARY KEY,
  reporter_id  BIGINT NOT NULL REFERENCES users(id),
  target_type  VARCHAR(20) NOT NULL,  -- post | comment | user
  target_id    BIGINT NOT NULL,
  reason       VARCHAR(50) NOT NULL,
  reason_text  TEXT,
  weight       DECIMAL(3,2) DEFAULT 1.00,
  status       VARCHAR(20) DEFAULT 'pending',
  processed_by BIGINT REFERENCES users(id),
  processed_at TIMESTAMP,
  created_at   TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_reports_target ON reports(target_type, target_id);
CREATE INDEX idx_reports_status ON reports(status);

CREATE TABLE sanctions (
  id            BIGSERIAL PRIMARY KEY,
  user_id       BIGINT NOT NULL REFERENCES users(id),
  type          VARCHAR(30) NOT NULL,
  -- warning | suspend_temp | suspend_permanent | force_logout | ip_ban
  reason        TEXT,
  duration_days INTEGER,
  expires_at    TIMESTAMP,
  applied_by    BIGINT NOT NULL REFERENCES users(id),
  lifted_at     TIMESTAMP,
  lifted_by     BIGINT REFERENCES users(id),
  created_at    TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_sanctions_user ON sanctions(user_id);

CREATE TABLE banned_words (
  id           BIGSERIAL PRIMARY KEY,
  word         VARCHAR(100) NOT NULL,
  pattern_type VARCHAR(20) DEFAULT 'direct', -- direct | regex | chosung
  board_id     BIGINT REFERENCES boards(id),
  action       VARCHAR(20) DEFAULT 'replace',
  is_active    BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMP DEFAULT NOW()
);

CREATE TABLE report_weights (
  id          BIGSERIAL PRIMARY KEY,
  reporter_id BIGINT UNIQUE NOT NULL REFERENCES users(id),
  weight      DECIMAL(3,2) DEFAULT 1.00,
  reason      VARCHAR(50),
  updated_at  TIMESTAMP DEFAULT NOW()
);
```

---

## 6. 메뉴

```sql
CREATE TABLE menus (
  id               BIGSERIAL PRIMARY KEY,
  parent_id        BIGINT REFERENCES menus(id),
  location         VARCHAR(20) DEFAULT 'gnb',  -- gnb | sidebar | footer
  name_key         VARCHAR(255) NOT NULL,
  link_type        VARCHAR(20) DEFAULT 'internal',
  link_url         VARCHAR(500),
  board_id         BIGINT REFERENCES boards(id),
  open_new_tab     BOOLEAN DEFAULT FALSE,
  icon             VARCHAR(100),
  min_grade        SMALLINT DEFAULT 0,
  max_grade        SMALLINT DEFAULT 9,
  badge_type       VARCHAR(20),                -- NEW | HOT | number | custom
  badge_text       VARCHAR(20),
  badge_color      VARCHAR(7),
  badge_expires_at TIMESTAMP,
  sort_order       INTEGER DEFAULT 0,
  is_visible       BOOLEAN DEFAULT TRUE,
  created_at       TIMESTAMP DEFAULT NOW(),
  updated_at       TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_menus_location ON menus(location);
```

---

## 7. 배너 / 팝업

```sql
CREATE TABLE banner_groups (
  id         BIGSERIAL PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  is_active  BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE banners (
  id              BIGSERIAL PRIMARY KEY,
  group_id        BIGINT REFERENCES banner_groups(id),
  name            VARCHAR(100) NOT NULL,
  position        VARCHAR(30) NOT NULL,
  -- hero | sub | sidebar | bottom | text_strip
  type            VARCHAR(20) DEFAULT 'image',
  pc_image_id     BIGINT REFERENCES media(id),
  mobile_image_id BIGINT REFERENCES media(id),
  tablet_image_id BIGINT REFERENCES media(id),
  alt_text        VARCHAR(255),
  text_content    TEXT,
  bg_color        VARCHAR(7),
  text_color      VARCHAR(7),
  link_url        VARCHAR(500),
  open_new_tab    BOOLEAN DEFAULT FALSE,
  utm_campaign    VARCHAR(100),
  target_audience VARCHAR(20) DEFAULT 'all',
  min_grade       SMALLINT DEFAULT 0,
  starts_at       TIMESTAMP,
  ends_at         TIMESTAMP,
  sort_order      INTEGER DEFAULT 0,
  is_active       BOOLEAN DEFAULT TRUE,
  dismiss_options JSONB DEFAULT '["today"]',
  ab_group        VARCHAR(1),
  ab_ratio        SMALLINT DEFAULT 50,
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW(),
  deleted_at      TIMESTAMP
);
CREATE INDEX idx_banners_position ON banners(position) WHERE deleted_at IS NULL;

CREATE TABLE banner_stats (
  id             BIGSERIAL PRIMARY KEY,
  banner_id      BIGINT NOT NULL REFERENCES banners(id),
  date           DATE NOT NULL,
  impressions    INTEGER DEFAULT 0,
  clicks         INTEGER DEFAULT 0,
  pc_clicks      INTEGER DEFAULT 0,
  mobile_clicks  INTEGER DEFAULT 0,
  UNIQUE(banner_id, date)
);

CREATE TABLE banner_dismissals (
  id           BIGSERIAL PRIMARY KEY,
  user_id      BIGINT NOT NULL REFERENCES users(id),
  banner_id    BIGINT NOT NULL REFERENCES banners(id),
  dismiss_type VARCHAR(20) NOT NULL,
  expires_at   TIMESTAMP,
  created_at   TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, banner_id)
);

CREATE TABLE popups (
  id              BIGSERIAL PRIMARY KEY,
  name            VARCHAR(100) NOT NULL,
  type            VARCHAR(20) DEFAULT 'image',
  image_id        BIGINT REFERENCES media(id),
  html_content    TEXT,
  display_scope   VARCHAR(20) DEFAULT 'all',
  board_id        BIGINT REFERENCES boards(id),
  width_px        INTEGER DEFAULT 500,
  height_px       INTEGER DEFAULT 400,
  pos_x           INTEGER DEFAULT 50,
  pos_y           INTEGER DEFAULT 50,
  dismiss_options JSONB DEFAULT '["today"]',
  target_audience VARCHAR(20) DEFAULT 'all',
  min_grade       SMALLINT DEFAULT 0,
  target_new_days INTEGER,
  target_region   VARCHAR(10),
  animation       VARCHAR(20) DEFAULT 'fade',
  ab_group        VARCHAR(1),
  ab_ratio        SMALLINT DEFAULT 50,
  priority        INTEGER DEFAULT 0,
  max_display     INTEGER DEFAULT 1,
  starts_at       TIMESTAMP,
  ends_at         TIMESTAMP,
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE popup_dismissals (
  id           BIGSERIAL PRIMARY KEY,
  user_id      BIGINT NOT NULL REFERENCES users(id),
  popup_id     BIGINT NOT NULL REFERENCES popups(id),
  dismiss_type VARCHAR(20) NOT NULL,
  expires_at   TIMESTAMP,
  created_at   TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, popup_id)
);
```

---

## 8. 알림

```sql
CREATE TABLE notifications (
  id         BIGSERIAL PRIMARY KEY,
  user_id    BIGINT NOT NULL REFERENCES users(id),
  type       VARCHAR(50) NOT NULL,
  title      VARCHAR(255) NOT NULL,
  body       TEXT,
  link_url   VARCHAR(500),
  ref_type   VARCHAR(50),
  ref_id     BIGINT,
  is_read    BOOLEAN DEFAULT FALSE,
  read_at    TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);

CREATE TABLE notification_settings (
  id         BIGSERIAL PRIMARY KEY,
  user_id    BIGINT UNIQUE NOT NULL REFERENCES users(id),
  channels   JSONB DEFAULT '{"inapp":true,"email":false,"kakao":false,"sms":false}',
  types      JSONB DEFAULT '{}',
  quiet_start TIME DEFAULT '22:00',
  quiet_end   TIME DEFAULT '08:00',
  updated_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE notification_subscriptions (
  id          BIGSERIAL PRIMARY KEY,
  user_id     BIGINT NOT NULL REFERENCES users(id),
  target_type VARCHAR(20) NOT NULL,  -- board | user | keyword
  target_id   BIGINT,
  keyword     VARCHAR(100),
  created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE notification_queue (
  id           BIGSERIAL PRIMARY KEY,
  user_id      BIGINT NOT NULL REFERENCES users(id),
  channel      VARCHAR(20) NOT NULL,
  priority     SMALLINT DEFAULT 2,   -- 1:긴급 2:일반 3:저우선
  subject      VARCHAR(255),
  body         TEXT NOT NULL,
  metadata     JSONB,
  status       VARCHAR(20) DEFAULT 'pending',
  retry_count  SMALLINT DEFAULT 0,
  last_error   TEXT,
  scheduled_at TIMESTAMP DEFAULT NOW(),
  sent_at      TIMESTAMP,
  created_at   TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_queue_pending ON notification_queue(priority, scheduled_at)
  WHERE status = 'pending';

CREATE TABLE email_templates (
  id         BIGSERIAL PRIMARY KEY,
  type       VARCHAR(50) UNIQUE NOT NULL,
  name       VARCHAR(100) NOT NULL,
  subject    VARCHAR(255) NOT NULL,
  html_body  TEXT NOT NULL,
  text_body  TEXT,
  variables  JSONB,
  is_system  BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE email_unsubscribes (
  id         BIGSERIAL PRIMARY KEY,
  user_id    BIGINT REFERENCES users(id),
  email      VARCHAR(255) NOT NULL,
  type       VARCHAR(20) DEFAULT 'marketing',
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE UNIQUE INDEX idx_unsubscribe ON email_unsubscribes(email, type);

CREATE TABLE webhook_configs (
  id           BIGSERIAL PRIMARY KEY,
  name         VARCHAR(100) NOT NULL,
  url          VARCHAR(500) NOT NULL,
  events       JSONB NOT NULL,
  secret       VARCHAR(255),
  is_active    BOOLEAN DEFAULT TRUE,
  last_sent_at TIMESTAMP,
  created_at   TIMESTAMP DEFAULT NOW()
);
```

---

## 9. 통계

```sql
CREATE TABLE stats_daily (
  id            BIGSERIAL PRIMARY KEY,
  date          DATE UNIQUE NOT NULL,
  new_users     INTEGER DEFAULT 0,
  active_users  INTEGER DEFAULT 0,
  new_posts     INTEGER DEFAULT 0,
  new_comments  INTEGER DEFAULT 0,
  new_reports   INTEGER DEFAULT 0,
  total_points  INTEGER DEFAULT 0,
  total_revenue INTEGER DEFAULT 0,
  created_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE funnel_events (
  id         BIGSERIAL PRIMARY KEY,
  user_id    BIGINT REFERENCES users(id),
  session_id VARCHAR(100),
  event      VARCHAR(50) NOT NULL,
  -- visit | signup_start | signup_complete | first_post | first_comment | grade_up
  metadata   JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_funnel_event ON funnel_events(event, created_at);
```

---

## 10. 시스템 / 어드민

```sql
CREATE TABLE admin_roles (
  id          BIGSERIAL PRIMARY KEY,
  name        VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  is_system   BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE admin_role_permissions (
  id         BIGSERIAL PRIMARY KEY,
  role_id    BIGINT NOT NULL REFERENCES admin_roles(id),
  module     VARCHAR(50) NOT NULL,
  can_read   BOOLEAN DEFAULT FALSE,
  can_write  BOOLEAN DEFAULT FALSE,
  can_delete BOOLEAN DEFAULT FALSE,
  board_id   BIGINT REFERENCES boards(id),
  UNIQUE(role_id, module, board_id)
);

CREATE TABLE admin_users (
  id           BIGSERIAL PRIMARY KEY,
  user_id      BIGINT UNIQUE NOT NULL REFERENCES users(id),
  role_id      BIGINT NOT NULL REFERENCES admin_roles(id),
  ip_whitelist JSONB,
  totp_secret  VARCHAR(255),
  totp_enabled BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMP DEFAULT NOW(),
  updated_at   TIMESTAMP DEFAULT NOW()
);

CREATE TABLE admin_activity_logs (
  id          BIGSERIAL PRIMARY KEY,
  admin_id    BIGINT NOT NULL REFERENCES users(id),
  action      VARCHAR(100) NOT NULL,
  module      VARCHAR(50) NOT NULL,
  target_type VARCHAR(50),
  target_id   BIGINT,
  before_data JSONB,
  after_data  JSONB,
  ip_address  INET,
  user_agent  TEXT,
  created_at  TIMESTAMP DEFAULT NOW()
  -- 애플리케이션 레벨에서 UPDATE/DELETE 차단
);
CREATE INDEX idx_admin_logs_target ON admin_activity_logs(target_type, target_id);
CREATE INDEX idx_admin_logs_created ON admin_activity_logs(created_at);

CREATE TABLE admin_login_history (
  id         BIGSERIAL PRIMARY KEY,
  admin_id   BIGINT NOT NULL REFERENCES users(id),
  ip_address INET NOT NULL,
  user_agent TEXT,
  status     VARCHAR(20) DEFAULT 'success',
  is_new_ip  BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_login_history_admin ON admin_login_history(admin_id);
```

---

## R2 마이그레이션 플랜

```sql
-- Step 1: 컬럼 추가
ALTER TABLE media ADD COLUMN url VARCHAR(500);
ALTER TABLE media ADD COLUMN thumb_url VARCHAR(500);

-- Step 2: 배치 스크립트로 BYTEA → R2 업로드 후 url 채우기

-- Step 3: 앱에서 url 컬럼 사용하도록 전환

-- Step 4: BYTEA 컬럼 제거
ALTER TABLE media DROP COLUMN data;
ALTER TABLE media DROP COLUMN thumb_data;
```
