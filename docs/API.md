# API.md -- letmein REST API Endpoints

Base: `/api/v1` | Auth: `Authorization: Bearer <JWT>` | Pagination: `?page=1&limit=20`
JWT: accessToken 30min, refreshToken 14d. Redis 캐시 + DB 저장 (Redis 장애 시 DB fallback).
Centrifugo: ws.codeb.kr (namespace: letmein), 채널 형식: `letmein:chat_<roomId>`
PgBouncer: Transaction mode, 연결 문자열 `?pgbouncer=true`
Rate limit: 100 req/min per IP (auth), 20 req/min per IP (unauth). 429 Too Many Requests.
Error: `{ "error": "msg", "code": "CODE" }`

### 소셜 로그인 계정 통합 로직

모든 소셜 로그인 API(kakao, apple, google, naver)는 동일한 로직을 따른다:

```
1. 소셜 provider로부터 email + provider ID 획득
2. provider ID로 User 조회
   → 있으면: 바로 로그인 (JWT 발급)
3. provider ID 없으면 → email로 User 조회
   → User 없음: 신규 가입 (User 생성 + provider ID 연결)
   → User 있음 + 해당 provider ID 없음: 409 ACCOUNT_EXISTS
     { "error": "이미 가입된 계정이 있습니다", "code": "ACCOUNT_EXISTS", "existingProvider": "kakao" }
     → 클라이언트에서 "카카오로 가입된 계정이 있습니다. 카카오로 로그인 후 계정을 연결하세요" 안내
```

### POST /api/v1/auth/link
Auth: required (기존 계정으로 로그인한 상태)
```json
// Req:  { "provider": "google", "token": "google_id_token" }
// Res:  { "linked": true, "provider": "google" }
```
Error: 409 already linked to another account

> 마이페이지에서 추가 소셜 계정 연결 시 사용

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

### POST /api/v1/auth/google
Auth: none
```json
// Req:  { "idToken": "google_id_token" }
// Res:  { "accessToken": "jwt", "refreshToken": "rt", "user": { "id": "clx1", "nickname": "u1", "role": "USER", "isNew": true } }
```
Error: 401 invalid token

### POST /api/v1/auth/naver
Auth: none
```json
// Req:  { "accessToken": "naver_token" }
// Res:  { "accessToken": "jwt", "refreshToken": "rt", "user": { "id": "clx1", "nickname": "u1", "role": "USER", "isNew": true } }
```
Error: 401 invalid token

### POST /api/v1/auth/email/signup
Auth: none
```json
// Req:  { "email": "user@email.com", "password": "pw123!", "nickname": "u1" }
// Res:  { "accessToken": "jwt", "refreshToken": "rt", "user": { "id": "clx1", "nickname": "u1", "role": "USER", "isNew": true } }
```
Error: 400 validation, 409 duplicate email

### POST /api/v1/auth/email/login
Auth: none
```json
// Req:  { "email": "user@email.com", "password": "pw123!" }
// Res:  { "accessToken": "jwt", "refreshToken": "rt", "user": { "id": "clx1", "nickname": "u1", "role": "USER", "isNew": true } }
```
Error: 401 invalid credentials

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

### PUT /api/v1/comments/:id
Auth: required (본인만)
```json
// Req:  { "content": "수정된 댓글 내용" }
// Res:  { "id": "c2", "content": "수정된 댓글 내용", "updatedAt": "2026-04-09T12:00:00Z" }
```
Error: 403 not owner, 404, 422 keyword blocked

### DELETE /api/v1/comments/:id
Auth: required (본인 또는 ADMIN)
```json
// Res:  { "id": "c2", "deletedAt": "2026-04-09T12:00:00Z" }
```
소프트 삭제: DB에 원문 보존, API 응답에서 content → "삭제된 댓글입니다"로 치환. 대댓글은 유지.
Error: 403 not owner, 404

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
// Req:  { "targetType": "HOSPITAL", "targetId": "h1" }
// Res:  { "id": "bk1", "targetType": "HOSPITAL", "targetId": "h1", "createdAt": "..." }
```
Error: 409 already bookmarked
targetType: `HOSPITAL` | `POST`

### DELETE /api/v1/bookmarks/:id
Auth: required
```json
// Res:  { "deleted": true }
```

### GET /api/v1/bookmarks
Auth: required | Query: `?targetType=HOSPITAL&cursor=x&limit=20`
```json
// Res (HOSPITAL):  { "items": [{ "id": "bk1", "targetType": "HOSPITAL", "targetId": "h1", "hospital": {"name": "A성형외과", "rating": 4.5, "reviewCount": 128, "specialties": ["쌍꺼풀"], "distance": 2.3} }], "nextCursor": "bk0" }
// Res (POST):      { "items": [{ "id": "bk2", "targetType": "POST", "targetId": "p1", "post": {"title": "쌍꺼풀 후기", "boardType": "BEFORE_AFTER", "likeCount": 42, "commentCount": 7} }], "nextCursor": "bk0" }
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
