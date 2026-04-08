# BACKEND.md -- letmein API Spec

Tech: Next.js (API Routes) + Prisma + PostgreSQL (PostGIS) + Redis + PgBouncer + BullMQ + Centrifugo (ws.codeb.kr) + Cloudflare R2

## 1. DB Schema (Prisma)

```prisma
generator client { provider = "prisma-client-js" }
datasource db { provider = "postgresql"; url = env("DATABASE_URL") }

model User { // 사용자
  id               String    @id @default(cuid())
  kakaoId          String    @unique @map("kakao_id")
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
  bookmarks Bookmark[]
  @@index([kakaoId]); @@index([role]); @@index([deletedAt])
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
  bookmarks   Bookmark[]
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

model Bookmark { // 병원 찜
  id         String   @id @default(cuid())
  userId     String   @map("user_id")
  hospitalId String   @map("hospital_id")
  createdAt  DateTime @default(now()) @map("created_at")
  user     User     @relation(fields: [userId], references: [id])
  hospital Hospital @relation(fields: [hospitalId], references: [id])
  @@unique([userId, hospitalId]); @@index([userId]); @@map("bookmarks")
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

## 3. REST API

Base: `/api/v1` | Auth: `Authorization: Bearer <JWT>` | Pagination: `?page=1&limit=20`
JWT: accessToken 30min, refreshToken 14d. Redis 캐시 + DB 저장 (Redis 장애 시 DB fallback).
Centrifugo: ws.codeb.kr (namespace: letmein), 채널 형식: `letmein:chat_<roomId>`
PgBouncer: Transaction mode, 연결 문자열 `?pgbouncer=true`
Rate limit: 100 req/min per IP (auth), 20 req/min per IP (unauth). 429 Too Many Requests.
Error: `{ "error": "msg", "code": "CODE" }`

### POST /api/v1/auth/kakao
Auth: none
```json
// Req:  { "accessToken": "kakao_token" }
// Res:  { "accessToken": "jwt", "refreshToken": "rt", "user": { "id": "clx1", "nickname": "u1", "role": "USER", "isNew": true } }
```
Error: 401 invalid token

### POST /api/v1/auth/apple
Auth: none | iOS만
```json
// Req:  { "identityToken": "apple_token", "authorizationCode": "code" }
// Res:  { "accessToken": "jwt", "refreshToken": "rt", "user": { "id": "clx1", "nickname": "u1", "role": "USER", "isNew": true } }
```
Error: 401 invalid token

### POST /api/v1/auth/refresh
Auth: none
```json
// Req:  { "refreshToken": "rt" }
// Res:  { "accessToken": "jwt_new", "refreshToken": "rt_new" }
```
Error: 401 expired token

### POST /api/v1/auth/centrifugo-token
Auth: required
```json
// Req:  (empty body)
// Res:  { "token": "centrifugo_jwt" }
```

### DELETE /api/v1/auth/withdraw
Auth: required
```json
// Req:  { "reason": "optional" }
// Res:  { "withdrawAt": "2026-04-05T00:00:00Z" }
```
Error: 409 already withdrawn

### POST /api/v1/consultations
Auth: USER
```json
// Req:  { "category": "눈", "subParts": ["쌍꺼풀","앞트임"], "timeline": "1_MONTH", "note": "자연스럽게", "photoUrls": ["https://r2/a.webp"] }
// Res:  { "id": "clx1", "status": "PENDING", "category": "눈", "subParts": ["쌍꺼풀","앞트임"], "createdAt": "2026-03-29T10:00:00Z" }
```
Error: 400 missing fields, 422 keyword blocked

### GET /api/v1/consultations
Auth: USER
```json
// Res:  { "items": [{ "id": "clx1", "category": "눈", "status": "MATCHED", "matchCount": 3, "createdAt": "..." }], "nextCursor": "clx0" }
```

### GET /api/v1/consultations/:id
Auth: owner
```json
// Res:  { "id": "clx1", "category": "눈", "subParts": ["쌍꺼풀"], "timeline": "1_MONTH", "note": "...", "photos": [{"url":"...","order":0}], "status": "MATCHED", "matches": [{"id":"m1","hospitalName":"A성형외과","score":92.5,"status":"CHATTING"}], "createdAt": "..." }
```
Error: 404

### GET /api/v1/consultations/:id/matches
Auth: owner
```json
// Res:  { "items": [{ "id": "m1", "hospital": {"id":"h1","name":"A성형외과","avatarUrl":"..."}, "score": 92.5, "status": "CHATTING", "chatRoomId": "cr1", "matchedAt": "..." }] }
```

### DELETE /api/v1/consultations/:id
Auth: owner
```json
// Res:  { "id": "clx1", "status": "CANCELLED" }
```
Error: 400 already matched, 404

### POST /api/v1/hospitals/register
Auth: USER (role upgrades to HOSPITAL on approval)
```json
// Req:  { "bizNumber": "123-45-67890", "licensePhotoUrl": "https://r2/lic.webp", "name": "A성형외과", "address": "서울 강남구...", "lat": 37.501, "lng": 127.039, "phone": "02-1234-5678", "hours": "09:00-18:00", "description": "눈코전문", "specialties": [{"category":"눈","subCategory":"쌍꺼풀"}] }
// Res:  { "id": "h1", "status": "PENDING" }
```
Error: 400 validation, 409 duplicate bizNumber

### GET /api/v1/hospitals
Auth: optional | Query: `?category=눈&lat=37.50&lng=127.03&radius=5&cursor=x&limit=20`
```json
// Res:  { "items": [{ "id": "h1", "name": "A성형외과", "address": "...", "distance": 1.2, "rating": 4.5, "reviewCount": 128, "specialties": ["쌍꺼풀","앞트임"] }], "nextCursor": "h2" }
```

### GET /api/v1/hospitals/:id
Auth: optional
```json
// Res:  { "id": "h1", "name": "A성형외과", "address": "...", "lat": 37.501, "lng": 127.039, "phone": "02-1234-5678", "hours": "09:00-18:00", "description": "...", "specialties": [{"category":"눈","subCategory":"쌍꺼풀"}], "rating": 4.5, "reviewCount": 128, "recentReviews": [{"id":"r1","rating":5,"content":"...","createdAt":"..."}] }
```
Error: 404

### PUT /api/v1/hospitals/:id
Auth: hospital owner
```json
// Req:  { "description": "updated", "hours": "10:00-19:00" }
// Res:  { "id": "h1", "description": "updated", "hours": "10:00-19:00" }
```
Error: 403, 404

### GET /api/v1/hospitals/me/dashboard
Auth: HOSPITAL
```json
// Res:  { "totalMatches": 245, "activeChats": 12, "avgRating": 4.5, "reviewCount": 128, "responseRate": 0.94, "thisMonthMatches": 18 }
```

### GET /api/v1/hospitals/me/consultations
Auth: HOSPITAL | Query: `?status=CHATTING&cursor=x&limit=20`
```json
// Res:  { "items": [{ "matchId": "m1", "requestId": "clx1", "category": "눈", "subParts": ["쌍꺼풀"], "userNickname": "u1", "status": "CHATTING", "chatRoomId": "cr1", "matchedAt": "..." }], "nextCursor": "m2" }
```

### GET /api/v1/chats
Auth: required
```json
// Res:  { "items": [{ "id": "cr1", "otherParty": {"id":"h1","name":"A성형외과","avatarUrl":"..."}, "lastMessage": {"content":"안녕하세요","createdAt":"...","type":"TEXT"}, "unreadCount": 2, "status": "ACTIVE" }], "nextCursor": "cr2" }
```

### GET /api/v1/chats/:id/messages
Auth: participant | Query: `?cursor=msg_id&limit=50`
```json
// Res:  { "items": [{ "id": "msg1", "senderId": "u1", "type": "TEXT", "content": "안녕하세요", "readAt": null, "createdAt": "..." }], "nextCursor": "msg0" }
```
Error: 403, 404

### POST /api/v1/chats/:id/messages
Auth: participant | Centrifugo: publish to `chat:<roomId>`
```json
// Req:  { "type": "TEXT", "content": "상담 가능한가요?" }
// Res:  { "id": "msg2", "senderId": "u1", "type": "TEXT", "content": "상담 가능한가요?", "createdAt": "..." }
```
Error: 400 room closed, 422 keyword blocked

### POST /api/v1/chats/:id/close
Auth: participant
```json
// Res:  { "id": "cr1", "status": "CLOSED" }
```

### GET /api/v1/posts
Auth: optional | Query: `?boardType=BEFORE_AFTER&categoryTag=눈&cursor=x&limit=20`
```json
// Res:  { "items": [{ "id": "p1", "boardType": "BEFORE_AFTER", "categoryTag": "눈", "content": "후기...", "authorNickname": "익명", "images": [{"url":"...","order":0}], "likeCount": 42, "commentCount": 7, "createdAt": "..." }], "nextCursor": "p0" }
```

### POST /api/v1/posts
Auth: required
```json
// Req:  { "boardType": "BEFORE_AFTER", "categoryTag": "눈", "content": "쌍꺼풀 후기", "imageUrls": ["https://r2/img1.webp"], "isAnonymous": true, "hospitalId": "h1" }
// Res:  { "id": "p1", "boardType": "BEFORE_AFTER", "createdAt": "..." }
```
Error: 422 keyword blocked

### GET /api/v1/posts/:id
Auth: optional
```json
// Res:  { "id": "p1", "boardType": "BEFORE_AFTER", "categoryTag": "눈", "content": "...", "authorNickname": "익명", "hospitalName": "A성형외과", "images": [{"url":"...","order":0}], "likeCount": 42, "isLiked": false, "comments": [{"id":"c1","nickname":"u2","content":"자연스럽네요!","parentId":null,"createdAt":"..."}], "createdAt": "..." }
```

### POST /api/v1/posts/:id/like
Auth: required
```json
// Res:  { "liked": true, "likeCount": 43 }
```

### POST /api/v1/posts/:id/comments
Auth: required
```json
// Req:  { "content": "자연스럽네요!", "parentId": null }
// Res:  { "id": "c2", "content": "자연스럽네요!", "createdAt": "..." }
```
Error: 422 keyword blocked

### POST /api/v1/reviews
Auth: USER (must have CHATTING match)
```json
// Req:  { "matchId": "m1", "rating": 5, "content": "친절했어요", "imageUrls": ["https://r2/rv1.webp"] }
// Res:  { "id": "r1", "rating": 5, "createdAt": "..." }
```
Error: 400 no match, 409 already reviewed

### GET /api/v1/hospitals/:id/reviews
Auth: optional | Query: `?cursor=x&limit=20`
```json
// Res:  { "avgRating": 4.5, "totalCount": 128, "items": [{ "id": "r1", "rating": 5, "content": "...", "images": [{"url":"...","order":0}], "authorNickname": "u1", "createdAt": "..." }], "nextCursor": "r0" }
```

### POST /api/v1/images/presign
Auth: required
```json
// Req:  { "filename": "photo.webp", "contentType": "image/webp", "bucket": "private" }
// Res:  { "uploadUrl": "https://r2/presigned...", "fileUrl": "https://r2/uploads/clx/photo.webp", "expiresIn": 600 }
```
Error: 400 unsupported type, 413 max 10MB

### POST /api/v1/images/upload-complete
Auth: required
```json
// Req:  { "fileUrl": "https://r2/uploads/clx/photo.webp", "context": "post" }
// Res:  { "jobId": "ij1", "status": "PENDING" }
```
BullMQ 잡 큐잉 → 워커가 썸네일(300px) + 중간(800px) 비동기 생성

### GET /api/v1/users/me
Auth: required
```json
// Res:  { "id": "u1", "nickname": "user1", "role": "USER", "avatarUrl": "...", "interests": ["눈","코"], "ageVerified": true, "marketingConsent": true, "createdAt": "..." }
```

### PUT /api/v1/users/me
Auth: required
```json
// Req:  { "nickname": "newname", "interests": ["눈","피부"], "fcmToken": "tok" }
// Res:  { "id": "u1", "nickname": "newname", "interests": ["눈","피부"] }
```

### POST /api/v1/reports
Auth: required
```json
// Req:  { "targetType": "POST", "targetId": "p1", "reason": "광고성 게시글" }
// Res:  { "id": "rpt1", "status": "PENDING" }
```

### POST /api/v1/bookmarks
Auth: required
```json
// Req:  { "hospitalId": "h1" }
// Res:  { "id": "bk1", "hospitalId": "h1", "createdAt": "..." }
```
Error: 409 already bookmarked

### DELETE /api/v1/bookmarks/:hospitalId
Auth: required
```json
// Res:  { "deleted": true }
```

### GET /api/v1/bookmarks
Auth: required | Query: `?page=1&limit=20`
```json
// Res:  { "items": [{ "hospitalId": "h1", "name": "A성형외과", "rating": 4.5, "reviewCount": 128, "specialties": ["쌍꺼풀"], "distance": 2.3 }], "total": 5, "page": 1 }
```

### GET /api/v1/bookmarks/compare
Auth: required | Query: `?hospitalIds=h1,h2,h3`
```json
// Res:  { "hospitals": [{ "id": "h1", "name": "A성형외과", "specialties": ["쌍꺼풀","앞트임"], "rating": 4.5, "reviewCount": 128, "distance": 2.3, "responseTime": "30분" }] }
```

### PUT /api/v1/admin/hospitals/:id/approve
Auth: ADMIN
```json
// Req:  { "action": "APPROVED" }
// Res:  { "id": "h1", "status": "APPROVED", "approvedAt": "2026-03-29T12:00:00Z" }
```

### GET /api/v1/admin/reports
Auth: ADMIN | Query: `?status=PENDING&cursor=x&limit=20`
```json
// Res:  { "items": [{ "id": "rpt1", "reporterNickname": "u1", "targetType": "POST", "targetId": "p1", "reason": "광고성", "status": "PENDING", "createdAt": "..." }], "nextCursor": "rpt0" }
```

### PUT /api/v1/admin/reports/:id
Auth: ADMIN
```json
// Req:  { "status": "RESOLVED", "action": "DELETE_TARGET" }
// Res:  { "id": "rpt1", "status": "RESOLVED" }
```

### GET /api/v1/notifications
Auth: required | Query: `?cursor=x&limit=20`
```json
// Res:  { "items": [{ "id": "n1", "type": "MATCH_FOUND", "title": "맞춤 병원 매칭", "body": "A성형외과에서 상담 안내를 보냈어요", "data": {"consultationId":"clx1"}, "readAt": null, "createdAt": "..." }], "nextCursor": "n0", "unreadCount": 3 }
```

### PUT /api/v1/notifications/:id/read
Auth: required
```json
// Res:  { "id": "n1", "readAt": "2026-03-29T12:00:00Z" }
```

### GET /api/v1/admin/filter-keywords
Auth: ADMIN | Query: `?category=PRICE&page=1&limit=50`
```json
// Res:  { "items": [{ "id": "fk1", "keyword": "공일공", "category": "CONTACT", "isRegex": false }], "total": 120, "page": 1 }
```

### POST /api/v1/admin/filter-keywords
Auth: ADMIN
```json
// Req:  { "keyword": "오만원", "category": "PRICE", "isRegex": false }
// Res:  { "id": "fk2", "keyword": "오만원", "category": "PRICE" }
```
Redis 캐시 즉시 갱신

### DELETE /api/v1/admin/filter-keywords/:id
Auth: ADMIN
```json
// Res:  { "deleted": true }
```
Redis 캐시 즉시 갱신

## 4. Auto-Matching Algorithm

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

## 5. Image Pipeline

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

## 6. Keyword Filtering

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
