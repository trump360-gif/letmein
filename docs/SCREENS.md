# SCREENS.md -- letmein Flutter App Screen Specs

Tech: Flutter 3.x + Riverpod + GoRouter + Freezed | Next.js API Server | Centrifugo WS

---

## 1. User Flow & Route Map

### 유저 여정 플로우

```
[미인증] ─── /onboarding ─── /login ───┐
                                        ▼
                                     /home
                    ┌─────────────────┬──┴──┬──────────────┐
                    ▼                 ▼     ▼              ▼
          /consultation/create    /hospital  /community   /mypage
           (step 1~5)            /hospital/:id            /mypage/settings
                │                     │      /community/   /mypage/reviews
                ▼                     │       create
     /consultation/:id/progress       │      /community/:id
                │                     │
                ▼                     │
     /consultation/:id/matches ───────┘
                                      │
               /hospital/:id ──→ /hospital/:id/compare (찜 비교)
                              ──→ /bookmarks (찜 목록)
                │
                ▼
            /chat ─── /chat/:id
```

### GoRouter Route Table

| Route | Auth | Role | Widget |
|-------|------|------|--------|
| `/onboarding` | none | all | OnboardingScreen |
| `/login` | none | all | LoginScreen |
| `/home` | required | all | HomeScreen |
| `/consultation/create` | required | user | ConsultationCreateScreen |
| `/consultation/:id/progress` | required | user | ConsultationProgressScreen |
| `/consultation/:id/matches` | required | user | ConsultationMatchesScreen |
| `/chat` | required | user,hospital | ChatListScreen |
| `/chat/:id` | required | user,hospital | ChatRoomScreen |
| `/hospital` | required | all | HospitalListScreen |
| `/hospital/:id` | required | all | HospitalDetailScreen |
| `/hospital/:id/compare` | required | all | HospitalCompareScreen |
| `/bookmarks` | required | user | BookmarkListScreen |
| `/hospital/register` | required | hospital | HospitalRegisterScreen |
| `/community` | required | all | CommunityFeedScreen |
| `/community/create` | required | user | CommunityCreateScreen |
| `/community/:id` | required | all | CommunityDetailScreen |
| `/notifications` | required | all | NotificationScreen |
| `/mypage` | required | all | MyPageScreen |
| `/mypage/settings` | required | all | SettingsScreen |
| `/mypage/reviews` | required | user | ReviewWriteScreen |
| `/hospital-dashboard` | required | hospital | HospitalDashboardScreen |
| `/hospital-dashboard/edit` | required | hospital | HospitalProfileEditScreen |

### Auth Guard
- `GoRouter.redirect`: 미인증 + 비공개 → `/login`, 인증 + 공개 → `/home`
- 공개 라우트: `/onboarding`, `/login`
- role 체크: hospital 전용 라우트는 `role == hospital` guard 추가

---

## 3. Screen Specs

### 3-a. OnboardingScreen (/onboarding)

Provider: `onboardingIndexProvider` (StateProvider<int>)
Layout: PageView 3페이지 + 하단 indicator + 다음/시작 버튼

Components:
- `PageView` 3장: "검증된 성형 정보" / "맞춤 병원 매칭" / "실시간 상담"
- `SmoothPageIndicator` dot 3개, 하단 "다음"/"시작하기", 우상단 "건너뛰기"

Interactions:
- 스와이프 또는 버튼으로 페이지 전환
- "시작하기" / "건너뛰기" → `/login` 이동
- SharedPreferences `onboarding_done=true` 저장

AC:
- [ ] 3페이지 스와이프 정상 동작
- [ ] 최초 1회만 노출, 이후 `/login` 직행
- [ ] indicator 현재 페이지 반영

### 3-b. LoginScreen (/login)

Provider: `authProvider` (AsyncNotifier<AuthState>)
Layout: 중앙 로고 + 소셜 로그인 버튼 스택

Components:
- 앱 로고 + "블랙라벨" 텍스트
- `KakaoLoginButton`: 카카오 SDK 연동
- `NaverLoginButton`: 네이버 SDK 연동
- `GoogleSignInButton`: Google Sign-In 연동
- `AppleSignInButton`: iOS만 표시 (POST /auth/apple)
- `EmailLoginButton`: 이메일 로그인 → 이메일/비밀번호 폼 화면
- 하단 약관 동의 링크: 이용약관 / 개인정보처리방침

Interactions:
- 소셜 로그인 → OAuth token → 서버 POST /auth/{provider} → JWT 발급
- JWT → SecureStorage 저장 → `/home` redirect
- 실패 시 `SnackBar` 에러 메시지
- 신규 가입 시 → 약관 동의 바텀시트 (서비스 이용약관, 개인정보 수집, 만 18세 확인 필수 + 마케팅 선택)
- 이미 다른 소셜로 가입된 이메일 → "카카오로 가입된 계정이 있습니다. 해당 계정으로 로그인 후 연결하세요" 안내
- 이메일 로그인 → 이메일/비밀번호 입력 → POST /auth/email/login
- 이메일 회원가입 → 이메일/비밀번호/닉네임 입력 → POST /auth/email/signup

Constraints:
- Apple 로그인: iOS 앱스토어 필수 요건, Android에서 미노출
- 계정 통합: 동일 이메일 기준 1인 1계정, 소셜 계정 연결은 마이페이지에서

AC:
- [ ] 카카오 로그인 → 홈 이동 1.5초 이내
- [ ] 네이버 로그인 정상 동작
- [ ] Google 로그인 정상 동작
- [ ] 이메일 로그인/회원가입 정상 동작
- [ ] 토큰 SecureStorage 저장 확인
- [ ] 로그인 실패 시 에러 메시지 표시
- [ ] iOS에서 Apple 로그인 버튼 노출
- [ ] 신규 가입 시 약관 동의 바텀시트 노출 (필수 항목 미동의 시 진행 불가)
- [ ] 이미 가입된 이메일로 다른 소셜 로그인 시 "기존 계정 존재" 안내 표시

### 3-b2. HospitalRegisterScreen (/hospital/register)

Provider: `hospitalRegisterProvider` (StateNotifier<HospitalRegisterForm>)
Layout: Stepper 5단계 — 사업자 인증 → 서류 → 기본정보 → 전문분야 → 제출

Components:
- **Step 1**: 사업자등록번호 입력 (형식 검증: 000-00-00000)
- **Step 2**: 의료기관 개설 신고증 사진 업로드 (필수 1장)
- **Step 3**: 병원 기본정보 — 이름, 주소, 전화, 영업시간
- **Step 4**: 전문 분야 선택 (칩 다중선택)
- **Step 5**: 확인 및 제출 → POST /hospitals/register

Interactions:
- 제출 성공 → "승인 대기" 안내 화면 (관리자 승인 후 대시보드 접근 가능)
- 뒤로가기: 이전 스텝 (데이터 유지)

AC:
- [ ] 사업자번호 형식 검증 (000-00-00000)
- [ ] 신고증 사진 미첨부 시 다음 단계 비활성
- [ ] 제출 후 "승인 대기" 안내 화면 노출
- [ ] 승인 전까지 /hospital-dashboard 접근 차단

### 3-c. HomeScreen (/home)

Provider: `homeProvider` (AsyncNotifier<HomeState>)
Layout: CustomScrollView — SliverAppBar + SliverList 섹션별

Components:
- `StoryBar`: 출연자 프로필 원형 가로 스크롤
- `HeroBanner`: 3~5개 배너 자동 슬라이드 (CMS 관리)
- `ActiveConsultationCard`: 진행 중 상담 미니 indicator + "확인하기" (없으면 미노출)
- `PopularPostsSection`: 인기글 3개 가로 카드
- `QuickActionGrid`: 상담 요청 / 병원 찾기 / 커뮤니티 / 내 상담
- `BottomNav`: 홈 / 상담 / 병원 / 커뮤니티 / 마이

Interactions:
- Pull-to-refresh → 전체 reload
- 배너 탭 → 딥링크 URL 처리
- StoryBar 아이템 탭 → 출연자 프로필 시트

AC:
- [ ] 홈 로딩 2초 이내 (skeleton 즉시 표시)
- [ ] 진행 중 상담 없으면 해당 섹션 미노출
- [ ] 배너 3초 간격 자동 슬라이드

### 3-d. ConsultationCreateScreen (/consultation/create)

Provider: `consultationFormProvider` (StateNotifier<ConsultationForm>)
Layout: Stepper 5단계, 상단 StepIndicator bar

**Step 1 — 시술 카테고리**
- 1차: `ChoiceChip` 단일선택 — 성형외과 / 피부과
- 2차: 선택에 따른 세부 칩 그리드
  - 성형외과: 눈 / 코 / 윤곽 / 가슴 / 지방흡입 / 안면거상 / 기타
  - 피부과: 보톡스 / 필러 / 레이저 / 리프팅 / 여드름흉터 / 제모 / 기타
- 단일선택, "다음" 활성화 조건: 세부 카테고리 1개 이상

**Step 2 — 세부 부위**
- `FilterChip` 다중선택 칩
- 항목: Step1 카테고리에 따라 서버에서 동적 로드
- "기타" 선택 시 TextField 오픈 (100자 제한)
- 최소 1개 선택 필수

**Step 3 — 희망 시기**
- `ChoiceChip` 단일선택: 1개월 이내 / 1~3개월 / 3~6개월 / 미정

**Step 4 — 사진 첨부**
- `ImagePickerGrid`: 1~5장 필수
- 민감정보 동의 체크박스 (필수)
  - 미동의 시 사진 업로드 비활성, 텍스트 전용 상담 안내
- 촬영 가이드 텍스트: "정면/측면 사진을 포함하면 더 정확한 상담이 가능해요"
- `CameraGuideOverlay`: 카메라 촬영 시 반투명 얼굴 윤곽 오버레이
  - 정면 가이드 / 좌측면 가이드 / 우측면 가이드 (3종 탭 전환)
  - CustomPaint로 반투명 윤곽선 + 마이크로카피 ("정면을 바라보고 얼굴을 가이드에 맞춰주세요")
  - camera 패키지 사용 (image_picker 대신)
- `PrivacyAssuranceText`: 안심 문구 상시 표시
  - "회원님의 사진은 매칭된 병원 담당자만 볼 수 있으며, 상담 종료 후 90일 뒤 자동 삭제됩니다"

**Step 4~5 — 스텝퍼 응원 메시지**
- Step 4 프로그레스 바 하단: "거의 다 됐어요"
- Step 5 프로그레스 바 하단: "마지막 단계예요"
- Step 1~3에는 응원 메시지 없음 (피로감 방지)

**Step 5 — 확인 및 제출**
- 요약 카드: 카테고리, 부위, 시기, 사진 썸네일 그리드
- 추가 메모 `TextField` (선택, 500자)
- "상담 요청하기" 버튼 → POST /consultations
- 제출 성공 → `/consultation/:id/progress` 이동

Interactions:
- 뒤로가기: 이전 스텝 (데이터 유지)
- Step 간 데이터 로컬 유지 (provider state)
- 앱 종료 후 복귀: 로컬 저장소 임시 저장 → "작성 중인 상담이 있어요. 이어서 할까요?" 안내 → "이어서 작성" 탭 시 중단 단계부터 재개

Constraints:
- 사진은 EXIF 제거 후 업로드
- 민감정보 동의 미체크 시 사진 첨부 불가

AC:
- [ ] 5단계 순차 진행, 뒤로가기 시 데이터 유지
- [ ] Step1 세부 카테고리 미선택 시 "다음" 비활성
- [ ] Step4 사진 0장 + 동의 미체크 시 진행 불가
- [ ] Step4 카메라 촬영 시 가이드 오버레이 정상 표시 (정면/좌측면/우측면)
- [ ] Step4 안심 문구 상시 표시
- [ ] Step4~5 응원 메시지 표시 (4단계: "거의 다 됐어요", 5단계: "마지막 단계예요")
- [ ] Step4~5 응원 메시지가 1~3단계에는 표시되지 않음
- [ ] 제출 API 호출 성공 → progress 화면 이동
- [ ] 제출 버튼 탭 시 햅틱 피드백 (mediumImpact)
- [ ] 임시저장 → 앱 재진입 시 이어하기 다이얼로그

### 3-e. ConsultationProgressScreen (/consultation/:id/progress)

Provider: `consultationProgressProvider(id)` (AsyncNotifier)
Layout: 상단 4단계 프로그레스 바 + 상세 카드

Components:
- `StepProgressBar`: 접수완료→검토→선정→매칭완료 (활성 단계 펄스 애니메이션)
- `ConsultationSummaryCard`: 카테고리, 부위, 시기, 사진 축소
- `StatusMessage`: 시간 경과에 따른 단계별 정직한 메시지
  - 접수 직후: "상담 요청이 접수되었습니다"
  - 5분~1시간: "코디네이터가 요청을 확인하고 있습니다"
  - 1시간 이상: "조건에 맞는 병원을 찾고 있습니다. 평균 2~3시간 내 매칭됩니다"
  - 매칭 1건+: "{N}곳이 매칭되었습니다! 추가 병원을 찾고 있습니다"
  - 매칭 완료: "총 {N}곳의 병원이 매칭되었습니다"
- `SkeletonMatchCard`: 매칭 대기 중 shimmer 애니메이션 카드 (실제 매칭 카드와 동일 레이아웃)
  - 매칭 결과가 오면 스켈레톤 → 실제 카드로 전환
  - 기존 CachedImage shimmer 패턴 재활용
- `MatchCompleteButton`: 매칭 완료 시 → `/consultation/:id/matches`
- `MatchFailedCard`: "조건에 맞는 병원을 찾지 못했어요" + "검색 범위 확대 중" 또는 "재요청" 버튼

Interactions:
- Centrifugo WS 구독 → 실시간 단계 업데이트
- 매칭 완료 push 수신 → 자동 UI 갱신
- Pull-to-refresh → 상태 재조회

AC:
- [ ] WS 연결로 상태 변경 2초 이내 UI 반영
- [ ] 매칭 완료 시 "병원 확인" 버튼 활성화
- [ ] 오프라인 복귀 시 최신 상태 자동 fetch
- [ ] 매칭 실패 시 MatchFailedCard 노출 + 재요청 버튼
- [ ] 시간 경과에 따른 StatusMessage 단계별 전환 정상 동작
- [ ] 매칭 대기 중 SkeletonMatchCard shimmer 표시
- [ ] 매칭 결과 수신 시 스켈레톤 → 실제 카드 전환

### 3-f. ConsultationMatchesScreen (/consultation/:id/matches)

Provider: `matchedHospitalsProvider(id)` (AsyncNotifier<List<MatchedHospital>>)
Layout: 상단 안내 + 병원 카드 리스트 (2~3개)

Components:
- `MatchInfoBanner`: "코디네이터가 엄선한 병원입니다"
- `HospitalMatchCard` x 2~3:
  - 병원 프로필 이미지, 이름, 전문 분야 태그
  - 평점 (리뷰 있을 경우), 지역
  - "채팅하기" 버튼
  - **가격 미표시** (의료법 준수)
- `CompareToggle`: 카드 나란히 비교 뷰 전환

Interactions:
- 채팅방은 매칭 시 자동 생성됨. "채팅하기" 탭 → `/chat/:id` 이동
- 병원 카드 탭 → `/hospital/:id` 상세
- 비교 뷰: 전문분야, 평점, 지역 나란히

Constraints:
- 가격/비용 정보 절대 미표시 (의료법 제56조)
- 매칭 유효기간: 7일 (만료 후 재요청 안내)

AC:
- [ ] 2~3개 병원 카드 노출
- [ ] 가격 관련 텍스트 어디에도 없음
- [ ] "채팅하기" → 기존 채팅방으로 이동
- [ ] 7일 만료 시 만료 UI + 재요청 버튼

### 3-g. ChatListScreen (/chat)

Provider: `chatListProvider` (StreamNotifier<List<ChatRoom>>)
Layout: 상담별 그룹 섹션 + 채팅방 리스트

Components:
- `ConsultationGroup`: 상담 ID별 그룹 헤더
- `ChatRoomTile`: 병원 프로필 + 마지막 메시지 + 시간 + 안 읽은 수 배지
- `EmptyChat`: "아직 채팅이 없어요" + "상담 요청하기" CTA

Interactions:
- 타일 탭 → `/chat/:id`, Centrifugo 구독 → 실시간 재정렬, 스와이프 좌 → 알림끄기/나가기

AC:
- [ ] 새 메시지 수신 시 리스트 최상단 이동
- [ ] 안 읽은 메시지 배지 정확한 카운트
- [ ] 상담별 그룹핑 정상 동작

### 3-h. ChatRoomScreen (/chat/:id)

Provider: `chatRoomProvider(id)` (StreamNotifier<List<Message>>)
Layout: 상단 AppBar + 메시지 리스트 + 하단 입력바

Components:
- `AppBar`: 병원명 + 온라인 indicator
- `DisclaimerBanner`: 상단 고정 "상담 내용은 의료 행위가 아닙니다"
- `MessageList`: 버블 UI (좌/우), 텍스트/이미지, 시간, 읽음 체크
- `InputBar`: TextField + 사진 + 전송
- `VisitBookingCard`: 병원 발송 방문 일시 카드 → 유저 "수락"/"다른 날짜"

Interactions:
- 텍스트 전송 → Centrifugo publish
- 사진 전송 → 업로드 후 이미지 메시지
- 스크롤 최상단 → 이전 메시지 로드 (pagination)
- 방문 카드 수락 → 확정 상태 변경
- 푸시 중복 방지: Centrifugo Presence 기반 Online 감지 → Online 시 푸시 미발송

Constraints:
- 채팅 유효기간: 마지막 메시지 후 30일
- 만료 3일 전 경고 배너
- 가격 키워드 필터링 안내 (서버 사이드)

AC:
- [ ] 메시지 전송 → 상대 1초 이내 수신 (WS)
- [ ] 이미지 전송 성공 + 썸네일 표시
- [ ] 이전 메시지 20개씩 페이지네이션
- [ ] 면책 배너 항상 상단 고정
- [ ] 방문 예약 카드 수락/거절 동작

### 3-i. HospitalListScreen (/hospital)

Provider: `hospitalListProvider` (AsyncNotifier<PaginatedList<Hospital>>)
Layout: 검색바 + 필터 칩 + 무한스크롤 리스트

Components:
- `SearchBar`: 병원명/지역 텍스트 검색 (debounce 300ms)
- `FilterChipRow`: 전문분야(성형외과/피부과) + 지역(강남/서초/압구정...) + 평점순
- `HospitalCard`: 프로필 이미지, 병원명, 전문 태그, 지역, 평점
- 무한스크롤: 20개씩 로드

Interactions:
- 검색어 입력 → debounce 후 API 호출
- 필터 칩 토글 → 즉시 재조회
- 카드 탭 → `/hospital/:id`

AC:
- [ ] 검색 결과 300ms debounce 후 반영
- [ ] 필터 조합 정상 동작 (전문분야 + 지역)
- [ ] 무한스크롤 20개 단위 로드
- [ ] 결과 없을 시 Empty State 표시

### 3-j. HospitalDetailScreen (/hospital/:id)

Provider: `hospitalDetailProvider(id)` (AsyncNotifier<HospitalDetail>)
Layout: SliverAppBar (이미지) + 정보 섹션

Components:
- `ImageCarousel`: 대표 이미지 슬라이드
- `HospitalInfo`: 병원명, 주소, 전문분야 태그, 영업시간
- `SpecialtySection`: 전문 시술 칩 / `DoctorSection`: 의료진 소개
- `ReviewSection`: 최근 리뷰 3개 + "전체보기" (별점/텍스트/작성일)
- `CTAButton`: "상담 요청하기" 하단 고정
- `BookmarkButton`: 찜 토글 (POST/DELETE /bookmarks), 하트 아이콘

Interactions:
- CTA → `/consultation/create` (병원 프리셋), 리뷰 전체보기 → 시트, 이미지 탭 → 갤러리
- 찜 → optimistic update, 찜 목록에서 복수 선택 → `/hospital/:id/compare`

Constraints: 가격 정보 미표시, 의료광고 심의 필 마크 표시 의무

AC:
- [ ] 병원 정보 전체 로드
- [ ] 리뷰 섹션 노출 (없으면 "아직 리뷰가 없어요")
- [ ] CTA → 상담 생성 화면 이동 (병원 프리셋)
- [ ] 가격 정보 어디에도 미표시
- [ ] 찜 토글 정상 동작 (서버 동기화)
- [ ] 찜 목록에서 비교 화면 진입 가능

### 3-j2. HospitalCompareScreen (/hospital/:id/compare)

Provider: `hospitalCompareProvider` (AsyncNotifier<List<HospitalCompare>>)
Layout: 찜한 병원 나란히 비교 (최대 3곳)

Components:
- `CompareHeader`: 비교 대상 병원 선택 (찜 목록에서)
- `CompareTable`: 항목별 나란히 비교
  - 전문분야, 평점, 리뷰 수, 거리, 평균 응답시간
- `CompareActionBar`: 하단 "상담 요청하기" CTA

Interactions:
- 병원 추가/제거 → 비교 테이블 실시간 갱신
- 병원명 탭 → `/hospital/:id` 상세
- CTA → 선택 병원으로 상담 요청

AC:
- [ ] 최대 3곳 비교 가능
- [ ] 항목별 나란히 정상 표시
- [ ] 비교에서 바로 상담 요청 진입

### 3-j3. BookmarkListScreen (/bookmarks)

Provider: `bookmarkListProvider` (AsyncNotifier<PaginatedList<Bookmark>>)
Layout: 탭바 (병원/게시글) + 무한스크롤 리스트

Components:
- `BookmarkTabBar`: 병원 / 게시글 탭 전환
- `HospitalBookmarkCard`: 병원 프로필 + 전문분야 + 평점 + 찜 해제 버튼
- `PostBookmarkCard`: 게시글 썸네일 + 제목 + 좋아요/댓글 수 + 찜 해제 버튼
- `CompareButton`: 병원 탭에서 2개 이상 선택 시 "비교하기" 하단 버튼 활성화
- `EmptyBookmark`: "찜한 항목이 없어요" + CTA

Interactions:
- 탭 전환 → GET /bookmarks?targetType=HOSPITAL 또는 POST
- 찜 해제 → DELETE /bookmarks/:id → optimistic update + 햅틱 lightImpact
- 병원 카드 탭 → `/hospital/:id`
- 게시글 카드 탭 → `/community/:id`
- 비교하기 → `/hospital/:id/compare`

AC:
- [ ] 병원/게시글 탭 전환 정상 동작
- [ ] 찜 해제 → 리스트에서 즉시 제거 (optimistic)
- [ ] 병원 2개 이상 선택 시 비교 버튼 활성화
- [ ] 빈 상태 시 Empty State + CTA 표시
- [ ] 무한스크롤 20개 단위 로드

### 3-k. CommunityFeedScreen (/community)

Provider: `communityFeedProvider` (AsyncNotifier<PaginatedList<Post>>)
Layout: 탭바 (전체/비포앤애프터/자유) + 무한스크롤 카드

Components:
- `CategoryTabBar`: 전체 / 비포앤애프터 / 자유게시판
- `PostCard`: 썸네일(일자 기반 로테이션, 블러 옵션) + 제목 + 태그 + 좋아요/댓글 수 + 찜 아이콘
  - `ImagePageIndicator`: 이미지 2장 이상 시 우측 상단 dot 인디케이터 표시 ("사진이 더 있다" 힌트)
  - 기존 youtube_hero.dart `_PageDots` 패턴 재활용
  - `BookmarkIcon`: 우측 찜 토글 (POST/DELETE /bookmarks, targetType: POST) + 햅틱 lightImpact
- `FloatingWriteButton` → `/community/create`
- `TagFilter`: 인기 태그 가로 스크롤

Interactions:
- 탭 전환 → 카테고리 필터
- 태그 탭 → 태그 필터 추가
- 카드 탭 → `/community/:id`
- 좋아요 → 즉시 반영 (optimistic update)

AC:
- [ ] 탭 전환 시 리스트 정상 교체
- [ ] 무한스크롤 20개 단위
- [ ] 좋아요 optimistic update + 서버 동기화
- [ ] 비포앤애프터 이미지 블러 처리 (미로그인/설정에 따라)
- [ ] 같은 게시글이 매일 다른 썸네일로 노출 (로테이션)
- [ ] 이미지 2장 이상 게시글에 dot 인디케이터 표시
- [ ] 게시글 찜 토글 정상 동작 (서버 동기화 + 햅틱)

### 3-l. CommunityCreateScreen (/community/create)

Provider: `communityFormProvider` (StateNotifier<CommunityForm>)
Layout: 스크롤 폼 — 카테고리 선택 + 이미지 + 텍스트

Components:
- `CategorySelector`: 비포앤애프터 / 자유게시판 선택
- `ImagePickerGrid`: 최대 10장 (비포앤애프터: before/after 구분 슬롯)
- `TitleField`: 제목 (필수, 100자)
- `ContentField`: 본문 (필수, 3000자)
- `TagInput`: 카테고리 태그 칩 선택 + 자유 태그 입력
- `HospitalTagField`: 병원 태그 (선택, 검색 자동완성)
- 제출 버튼: "게시하기"

Interactions:
- 비포앤애프터 선택 시 before/after 슬롯 UI 변경
- 민감정보 사진 포함 시 동의 체크 필수
- 제출 → POST /posts → `/community/:id`

AC:
- [ ] 카테고리 선택에 따른 UI 분기
- [ ] 이미지 최대 10장 초과 시 안내
- [ ] 제목/본문 빈 값 시 제출 불가
- [ ] 게시 성공 → 상세 화면 이동

### 3-m. CommunityDetailScreen (/community/:id)

Provider: `communityDetailProvider(id)` (AsyncNotifier<PostDetail>)
Layout: 본문 스크롤 + 하단 댓글 입력

Components:
- `AuthorHeader`: 프로필 + 닉네임 + 작성일 + 더보기(신고/수정/삭제)
- `ImageViewer`: 가로 스와이프 (비포앤애프터: 슬라이더 비교)
- `ContentBody`: 본문 + 태그 칩 + `LikeButton` + `BookmarkButton` (찜 토글, targetType: POST)
- `CommentSection`: 댓글 리스트 (최신순) + 하단 고정 입력바

Interactions:
- 좋아요 optimistic update, 댓글 POST → 즉시 반영
- 더보기: 신고/수정(본인)/삭제(본인), 이미지 탭 → 전체화면

AC:
- [ ] 비포앤애프터 슬라이더 비교 기능 동작
- [ ] 댓글 작성 즉시 리스트 반영
- [ ] 본인 글 수정/삭제 가능
- [ ] 신고 → 확인 다이얼로그 → API 호출
- [ ] 게시글 찜 토글 정상 동작
- [ ] 본인 댓글 수정 가능 (수정 시 "수정됨" 표시)
- [ ] 본인 댓글 삭제 → "삭제된 댓글입니다" 표시 (대댓글 유지)

### 3-n. MyPageScreen (/mypage)

Provider: `myPageProvider` (AsyncNotifier<MyPageState>)
Layout: 프로필 헤더 + 메뉴 리스트

Components:
- `ProfileHeader`: 프로필 이미지 + 닉네임 + 가입일
- `MenuSection`: 내 상담 / 내 게시글 / 내 리뷰 / 좋아요한 글 / 내 찜 목록 → 각 리스트 화면
- `SettingsButton` → `/mypage/settings`

Interactions:
- 메뉴 탭 → 해당 리스트, 프로필 이미지 탭 → 변경 시트
- 닉네임/관심시술 수정 → PUT /users/me → 성공 토스트

AC:
- [ ] 프로필 정보 정상 표시
- [ ] 각 메뉴 탭 → 올바른 화면 이동
- [ ] 프로필 이미지 변경 성공
- [ ] 닉네임/관심시술 수정 → 서버 반영

### 3-o. SettingsScreen (/mypage/settings)

Provider: `settingsProvider` (StateNotifier<SettingsState>)
Layout: 설정 항목 리스트

Components:
- `NotificationToggle`: 전체 알림 on/off
  - 세부: 상담 알림 / 채팅 알림 / 커뮤니티 알림
- `ThemeToggle`: 라이트 / 다크 / 시스템 설정
- `AccountSection`:
  - 로그아웃 버튼
  - 회원 탈퇴 → 확인 다이얼로그 (비밀번호/재인증) → 7일 유예
- `AppInfo`: 버전, 이용약관, 개인정보처리방침, 오픈소스 라이선스

Interactions:
- 토글 → 즉시 서버+로컬, 테마 → 즉시 반영, 탈퇴 → 7일 유예 안내

AC:
- [ ] 알림 토글 서버 동기화
- [ ] 테마 변경 즉시 반영
- [ ] 회원 탈퇴 7일 유예 안내 표시
- [ ] 로그아웃 → SecureStorage 클리어 → /login 이동

### 3-p. ReviewWriteScreen (/mypage/reviews)

Provider: `reviewFormProvider` (StateNotifier<ReviewForm>)
Layout: 병원 선택 + 별점 + 텍스트 + 사진

Components:
- `HospitalSelector`: 채팅 중이거나 완료된 병원 드롭다운 (CHATTING 또는 COMPLETED 매칭 상태)
- `RatingBar`: 별 5개 (0.5 단위), 필수
- `ReviewTextField`: 본문 (필수, 30~1000자)
- `ImagePickerRow`: 사진 최대 5장 (선택)
- 제출 버튼: "리뷰 등록"

Interactions:
- 별점 미선택 / 텍스트 30자 미만 → 제출 비활성
- 제출 → POST /reviews → 완료 토스트 + 뒤로가기

Constraints:
- 채팅 중(CHATTING) 또는 상담 완료(COMPLETED) 상태의 병원만 리뷰 작성 가능
- 병원당 1회만 작성 (수정 가능)

AC:
- [ ] CHATTING 또는 COMPLETED 상태 병원만 드롭다운 노출
- [ ] 별점 + 30자 이상 시 제출 활성화
- [ ] 중복 리뷰 방지 (수정 모드 전환)
- [ ] 제출 성공 → 토스트 + 뒤로가기

### 3-q. HospitalDashboardScreen (/hospital-dashboard)

Provider: `hospitalDashboardProvider` (AsyncNotifier<DashboardState>)
Layout: 요약 카드 그리드 + 상담 리스트

Components:
- `SummaryCards`: 신규 매칭 / 활성 채팅 / 평균 응답시간 / 평점
- `MatchedConsultationList`: 유저 익명ID, 카테고리, 부위, 상태(대기/채팅/방문확정/완료)
- `ResponseRateGauge`: 24h 응답률 게이지
- `RecentReviewsSection`: 최근 리뷰 3개

Interactions:
- 상담 타일 탭 → `/chat/:id` (해당 유저 채팅)
- 리뷰 섹션 → 전체 리뷰 리스트
- Pull-to-refresh → 데이터 갱신

AC:
- [ ] 요약 카드 수치 정확
- [ ] 매칭 리스트 상태별 필터 동작
- [ ] 응답률 24시간 기준 계산 정확
- [ ] 상담 탭 → 채팅방 이동

### 3-r. HospitalProfileEditScreen (/hospital-dashboard/edit)

Provider: `hospitalProfileEditProvider` (StateNotifier<HospitalProfileForm>)
Layout: 스크롤 폼 — 프로필 정보 편집

Components:
- `ProfileImageEditor`: 대표 1장 + 갤러리 최대 10장
- `BasicInfoForm`: 병원명(읽기전용), 주소, 전화, 영업시간
- `SpecialtyEditor`: 전문분야 칩 추가/제거
- `DoctorListEditor`: 의료진 CRUD (이름/전문분야/경력)
- `IntroTextField`: 소개 2000자 + "프로필 저장" 버튼

Interactions:
- 이미지 추가/삭제/순서변경 (드래그)
- 전문분야 칩 추가 → 서버 카테고리 목록에서 선택
- 저장 → PUT /hospitals/:id/profile → 성공 토스트

Constraints:
- 병원명 변경 불가 (CMS에서만 가능)
- 의료광고 심의필 표시 변경 불가

AC:
- [ ] 이미지 순서 드래그 변경 동작
- [ ] 전문분야 추가/제거 정상
- [ ] 의료진 CRUD 동작
- [ ] 저장 → 서버 반영 확인
- [ ] 병원명 필드 비활성 (읽기전용)

### 3-s. NotificationScreen (/notifications)

Provider: `notificationListProvider` (AsyncNotifier<PaginatedList<Notification>>)
Layout: 알림 리스트 (무한스크롤)

Components:
- `NotificationTile`: 아이콘 + 제목 + 본문 미리보기 + 시간, 안읽음 볼드 처리
- `EmptyNotification`: "알림이 없어요" 일러스트

Interactions:
- 타일 탭 → readAt 갱신 (PUT /notifications/:id/read) + 딥링크 이동
- Pull-to-refresh → 리스트 재조회
- 무한스크롤 20개 단위 로드

AC:
- [ ] 안읽은 알림 볼드 표시
- [ ] 탭 시 readAt 갱신 + 딥링크 정상 이동
- [ ] 무한스크롤 동작
- [ ] 빈 상태 시 Empty State 표시

> Notification Matrix → README.md 섹션 9 참조
