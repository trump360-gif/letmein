# SCHEMA.md -- letmein DB Schema & System Logic

Tech: Next.js (API Routes) + Prisma + PostgreSQL (PostGIS) + Redis + PgBouncer + BullMQ + Centrifugo (ws.codeb.kr) + Cloudflare R2

## 1. DB Schema (Prisma)

```prisma
generator client { provider = "prisma-client-js" }
datasource db { provider = "postgresql"; url = env("DATABASE_URL") }

model User { // 사용자
  id               String    @id @default(cuid())
  email            String?   @unique // 소셜 계정 통합 키 + 이메일 로그인
  passwordHash     String?   @map("password_hash") // 이메일 로그인용 (소셜 전용 시 null)
  kakaoId          String?   @unique @map("kakao_id")
  googleId         String?   @unique @map("google_id")
  appleId          String?   @unique @map("apple_id")
  naverId          String?   @unique @map("naver_id")
  nickname         String
  role             Role      @default(USER)
  avatarUrl        String?   @map("avatar_url")
  interests        String[]  // 관심 시술 카테고리
  ageVerified      Boolean   @default(false) @map("age_verified")
  marketingConsent Boolean   @default(false) @map("marketing_consent")
  sensitiveConsent Boolean   @default(false) @map("sensitive_consent")
  fcmToken         String?   @map("fcm_token")
  createdAt        DateTime  @default(now()) @map("created_at")
  deletedAt        DateTime? @map("deleted_at")
  hospital             Hospital?
  consultationRequests ConsultationRequest[]
  chatRooms            ChatRoom[] @relation("UserChats")
  messages   Message[]
  posts      Post[]
  comments   Comment[]
  likes      Like[]
  reviews    Review[]
  reports    Report[] @relation("Reporter")
  notifications Notification[]
  bookmarks  Bookmark[]
  @@index([email]); @@index([kakaoId]); @@index([googleId]); @@index([appleId]); @@index([naverId]); @@index([role]); @@index([deletedAt])
  @@map("users")
}
enum Role { USER; HOSPITAL; ADMIN }

model Hospital { // 병원
  id              String         @id @default(cuid())
  userId          String         @unique @map("user_id")
  bizNumber       String         @unique @map("biz_number")
  licensePhotoUrl String         @map("license_photo_url")
  name            String
  address         String
  location        Unsupported("geography(Point, 4326)")  // PostGIS
  phone           String
  hours           String?
  description     String?
  status          HospitalStatus @default(PENDING)
  approvedAt      DateTime?      @map("approved_at")
  approvedBy      String?        @map("approved_by")
  user        User                @relation(fields: [userId], references: [id])
  specialties HospitalSpecialty[]
  matches     ConsultationMatch[]
  chatRooms   ChatRoom[]
  posts       Post[] @relation("HospitalPosts")
  reviews     Review[]
  @@index([status]); // PostGIS GiST index는 마이그레이션 SQL에서 수동 생성; @@index([name])
  @@map("hospitals")
}
enum HospitalStatus { PENDING; APPROVED; REJECTED; SUSPENDED }

model HospitalSpecialty { // 병원 전문 분야
  id          String @id @default(cuid())
  hospitalId  String @map("hospital_id")
  category    String // 눈, 코, 윤곽, 가슴, 피부
  subCategory String @map("sub_category") // 쌍꺼풀, 트임, 코끝
  hospital Hospital @relation(fields: [hospitalId], references: [id])
  @@unique([hospitalId, category, subCategory]); @@index([category])
  @@map("hospital_specialties")
}

model ConsultationRequest { // 상담 요청
  id       String             @id @default(cuid())
  userId   String             @map("user_id")
  category String
  subParts Json               @map("sub_parts")
  timeline String             // ASAP, 1_MONTH, 3_MONTHS, UNDECIDED
  note     String?
  status   ConsultationStatus @default(PENDING)
  createdAt DateTime          @default(now()) @map("created_at")
  user    User                @relation(fields: [userId], references: [id])
  photos  ConsultationPhoto[]
  matches ConsultationMatch[]
  @@index([userId, status]); @@index([status, createdAt])
  @@map("consultation_requests")
}
enum ConsultationStatus { PENDING; MATCHING; MATCHED; CLOSED; CANCELLED }

model ConsultationPhoto { // 상담 사진
  id        String @id @default(cuid())
  requestId String @map("request_id")
  url       String
  order     Int
  request ConsultationRequest @relation(fields: [requestId], references: [id], onDelete: Cascade)
  @@index([requestId]); @@map("consultation_photos")
}

model ConsultationMatch { // 상담 매칭
  id         String      @id @default(cuid())
  requestId  String      @map("request_id")
  hospitalId String      @map("hospital_id")
  score      Float
  status     MatchStatus @default(MATCHED)
  matchedAt  DateTime    @default(now()) @map("matched_at")
  request  ConsultationRequest @relation(fields: [requestId], references: [id])
  hospital Hospital            @relation(fields: [hospitalId], references: [id])
  chatRoom ChatRoom?
  reviews  Review[]
  @@unique([requestId, hospitalId]); @@index([hospitalId, status])
  @@map("consultation_matches")
}
enum MatchStatus { MATCHED; CHATTING; COMPLETED; EXPIRED }

model ChatRoom { // 채팅방
  id            String         @id @default(cuid())
  matchId       String         @unique @map("match_id")
  userId        String         @map("user_id")
  hospitalId    String         @map("hospital_id")
  status        ChatRoomStatus @default(ACTIVE)
  lastMessageAt DateTime?      @map("last_message_at")
  createdAt     DateTime       @default(now()) @map("created_at")
  match    ConsultationMatch @relation(fields: [matchId], references: [id])
  user     User              @relation("UserChats", fields: [userId], references: [id])
  hospital Hospital          @relation(fields: [hospitalId], references: [id])
  messages Message[]
  @@index([userId, status]); @@index([hospitalId, status]); @@index([lastMessageAt])
  @@map("chat_rooms")
}
enum ChatRoomStatus { ACTIVE; CLOSED }

model Message { // 메시지
  id        String      @id @default(cuid())
  roomId    String      @map("room_id")
  senderId  String      @map("sender_id")
  type      MessageType @default(TEXT)
  content   String
  readAt    DateTime?   @map("read_at")
  createdAt DateTime    @default(now()) @map("created_at")
  room   ChatRoom @relation(fields: [roomId], references: [id])
  sender User     @relation(fields: [senderId], references: [id])
  @@index([roomId, createdAt]); @@map("messages")
}
enum MessageType { TEXT; IMAGE; SYSTEM }

model Post { // 커뮤니티 게시글
  id          String    @id @default(cuid())
  userId      String    @map("user_id")
  boardType   BoardType @map("board_type")
  title       String?
  categoryTag String?   @map("category_tag")
  hospitalId  String?   @map("hospital_id")
  content     String
  isAnonymous Boolean   @default(false) @map("is_anonymous")
  viewCount    Int       @default(0) @map("view_count")
  likeCount    Int       @default(0) @map("like_count")
  commentCount Int       @default(0) @map("comment_count")
  createdAt   DateTime  @default(now()) @map("created_at")
  user     User      @relation(fields: [userId], references: [id])
  hospital Hospital? @relation("HospitalPosts", fields: [hospitalId], references: [id])
  images   PostImage[]; comments Comment[]; likes Like[]
  @@index([boardType, createdAt]); @@index([userId]); @@index([categoryTag])
  @@map("posts")
}
enum BoardType { BEFORE_AFTER; FREE; QNA }

model PostImage {
  id String @id @default(cuid()); postId String @map("post_id"); url String; order Int
  post Post @relation(fields: [postId], references: [id], onDelete: Cascade)
  @@index([postId]); @@map("post_images")
}

model Comment { // 댓글
  id       String   @id @default(cuid())
  postId   String   @map("post_id")
  userId   String   @map("user_id")
  parentId String?  @map("parent_id")
  content  String
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime? @map("updated_at")
  deletedAt DateTime? @map("deleted_at") // 소프트 삭제 (null=활성, 값있으면=삭제됨)
  post Post       @relation(fields: [postId], references: [id], onDelete: Cascade)
  user User       @relation(fields: [userId], references: [id])
  parent   Comment?  @relation("Replies", fields: [parentId], references: [id])
  children Comment[] @relation("Replies")
  @@index([postId, createdAt]); @@map("comments")
}

model Like { // 좋아요
  id String @id @default(cuid()); postId String @map("post_id"); userId String @map("user_id")
  post Post @relation(fields: [postId], references: [id], onDelete: Cascade)
  user User @relation(fields: [userId], references: [id])
  @@unique([postId, userId]); @@map("likes")
}

model Bookmark { // 찜 (게시글 + 병원 통합)
  id         String   @id @default(cuid())
  userId     String   @map("user_id")
  targetType BookmarkTargetType @map("target_type") // POST, HOSPITAL
  targetId   String   @map("target_id")
  createdAt  DateTime @default(now()) @map("created_at")
  user User @relation(fields: [userId], references: [id])
  @@unique([userId, targetType, targetId]); @@index([userId, targetType]); @@map("bookmarks")
}
enum BookmarkTargetType { POST; HOSPITAL }

model Review { // 리뷰
  id         String   @id @default(cuid())
  userId     String   @map("user_id")
  hospitalId String   @map("hospital_id")
  matchId    String   @map("match_id")
  rating     Int      // 1~5
  content    String
  createdAt  DateTime @default(now()) @map("created_at")
  user     User              @relation(fields: [userId], references: [id])
  hospital Hospital          @relation(fields: [hospitalId], references: [id])
  match    ConsultationMatch @relation(fields: [matchId], references: [id])
  images   ReviewImage[]
  @@unique([matchId]); @@index([hospitalId, createdAt]); @@map("reviews")
}

model ReviewImage {
  id String @id @default(cuid()); reviewId String @map("review_id"); url String; order Int
  review Review @relation(fields: [reviewId], references: [id], onDelete: Cascade)
  @@index([reviewId]); @@map("review_images")
}

model Report { // 신고
  id         String       @id @default(cuid())
  reporterId String       @map("reporter_id")
  targetType TargetType   @map("target_type")
  targetId   String       @map("target_id")
  reason     String
  status     ReportStatus @default(PENDING)
  createdAt  DateTime     @default(now()) @map("created_at")
  reporter User @relation("Reporter", fields: [reporterId], references: [id])
  @@index([status]); @@index([targetType, targetId]); @@map("reports")
}
enum TargetType { POST; COMMENT; MESSAGE; REVIEW }
enum ReportStatus { PENDING; RESOLVED; DISMISSED }

model Notification { // 알림
  id       String    @id @default(cuid())
  userId   String    @map("user_id")
  type     String    // MATCH_FOUND, NEW_MESSAGE, REVIEW_REQUEST
  title    String
  body     String
  data     Json?
  readAt   DateTime? @map("read_at")
  createdAt DateTime @default(now()) @map("created_at")
  user User @relation(fields: [userId], references: [id])
  @@index([userId, readAt]); @@index([userId, createdAt]); @@map("notifications")
}

model FilterKeyword { // 금칙어 사전
  id        String   @id @default(cuid())
  keyword   String
  category  FilterCategory
  isRegex   Boolean  @default(false) @map("is_regex")
  createdAt DateTime @default(now()) @map("created_at")
  @@index([category]); @@map("filter_keywords")
}
enum FilterCategory { PRICE; CONTACT; EFFECT_GUARANTEE; COMPETITOR }

model ImageJob { // 이미지 처리 작업 추적
  id        String       @id @default(cuid())
  sourceUrl String       @map("source_url")
  thumbUrl  String?      @map("thumb_url")
  mediumUrl String?      @map("medium_url")
  status    ImageJobStatus @default(PENDING)
  attempts  Int          @default(0)
  error     String?
  createdAt DateTime     @default(now()) @map("created_at")
  @@index([status]); @@map("image_jobs")
}
enum ImageJobStatus { PENDING; PROCESSING; COMPLETED; FAILED }
```

## 2. Entity State Machines

```
ConsultationRequest:
  PENDING --[job starts]--> MATCHING --[matched]--> MATCHED --[done]--> CLOSED
  PENDING|MATCHING --[user cancels]--> CANCELLED
  MATCHING --[2h timeout]--> PENDING (expanded radius retry)

Hospital:
  PENDING --[approve]--> APPROVED | PENDING --[reject]--> REJECTED
  APPROVED --[suspend]--> SUSPENDED | SUSPENDED --[reinstate]--> APPROVED

ConsultationMatch:
  MATCHED --[first msg]--> CHATTING --[close/review/30d]--> COMPLETED
  MATCHED --[48h silence]--> EXPIRED | CHATTING --[30d idle]--> EXPIRED

ChatRoom:  ACTIVE --[close/30d cron]--> CLOSED
Report:    PENDING --[resolve]--> RESOLVED | PENDING --[dismiss]--> DISMISSED
```

## 3. Auto-Matching Algorithm

Trigger: ConsultationRequest created --> BullMQ job enqueued.

```
Score = specialty_match(0.4) + area_distance(0.3) + response_rate(0.2) + load_balance(0.1)

specialty_match: 100=exact(category+subPart), 50=category only, 0=none
area_distance:   100 if <=3km, linear decay to 0 at 30km (PostGIS ST_Distance)
response_rate:   (replied within 1h / total matches) * 100, cached in Redis hourly
load_balance:    100 - (active_chats / max_capacity * 100)
```

1. Query APPROVED hospitals with matching specialty, order by distance
2. Compute score, filter >= 60, select top 3-5
3. Create ConsultationMatch + ChatRoom per match, set request status MATCHED
4. FCM push to user + hospitals
5. No match in 2h: expand radius 2x, retry once, then alert admin

## 4. Image Pipeline

```
Client: EXIF strip -> resize max 2048px -> POST /images/presign -> PUT to R2
Server (BullMQ on upload webhook): generate thumb(300px) + medium(800px) + full(2048px), convert WebP q80
Buckets:
  private -- consultation/chat photos (signed URL, 1h expiry)
  public  -- community/hospital/review (CDN: cdn.letmein.kr)
Deletion:
  withdraw    -> soft delete, hard delete after 7-day grace
  consent rev -> immediate hard delete all user images
  chat close  -> retain 90 days then purge

Thumbnail Rotation (피드 노출):
  - 게시글 사진 전체에 대해 썸네일 300px 생성
  - thumbnailIndex = hash(postId + date) % thumbnails.length
  - 일자 기반 로테이션 → 같은 글이 매일 다른 사진으로 노출

BullMQ 설정:
  attempts: 3, backoff: exponential 5s
  DLQ: 3회 실패 시 Failed 상태 보존 + 관리자 알림 (Slack/Discord)
  CMS에서 실패 목록 조회 + 수동 재시도 가능
```

## 5. Keyword Filtering

```
Patterns:
  PRICE:      /\d{1,4}\s*(만\s*원|원|만)/
  PHONE:      /01[016789]-?\d{3,4}-?\d{4}/
  KAKAO_ID:   /(카[카톡]|kakao|open\.kakao)\s*:?\s*\S+/i
  COMPETITOR: Redis key filter:competitors (configurable blocklist)
Applied to: ConsultationRequest.note, Message.content, Post.content, Comment.content
Action: block write (422), return { "error": "금지된 표현이 포함되어 있습니다", "code": "KEYWORD_BLOCKED" }, auto-log to reports

Filter Dictionary (금칙어 사전):
  DB: FilterKeyword 테이블 (keyword, category, isRegex)
  Cache: Redis Set `letmein:filter_keywords` (5분 TTL)
  CMS: 관리자가 즉시 추가/삭제 → Redis 캐시 즉시 갱신
  한국어 변형 대응: "공일공", "ㅋr톡", "오만원", "가.격" 등

Push Dedup (Centrifugo Presence 기반):
  메시지 전송 시 Centrifugo Presence로 수신자 Online/Offline 확인
  Online → 푸시 미발송 (WS로 이미 수신)
  Offline → FCM 푸시 발송
  클라이언트: 메시지 ID 기반 중복 제거
```
