import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ==================== SVG Placeholder 헬퍼 ====================

function svgDataUri(svg: string): string {
  return `data:image/svg+xml,${encodeURIComponent(svg.trim())}`
}

function heroSvg(text: string, from: string, to: string): string {
  return svgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="360" viewBox="0 0 1200 360">
      <defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${from}"/><stop offset="100%" style="stop-color:${to}"/>
      </linearGradient></defs>
      <rect width="1200" height="360" fill="url(#g)"/>
      <text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle"
        font-family="system-ui,sans-serif" font-size="72" font-weight="200"
        fill="white" opacity="0.4" letter-spacing="24">${text}</text>
      <text x="50%" y="62%" dominant-baseline="middle" text-anchor="middle"
        font-family="system-ui,sans-serif" font-size="16" font-weight="300"
        fill="white" opacity="0.5">Sample Image</text>
    </svg>`)
}

function avatarSvg(initial: string, bg: string): string {
  return svgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
      <rect width="200" height="200" rx="100" fill="${bg}"/>
      <text x="50%" y="52%" dominant-baseline="middle" text-anchor="middle"
        font-family="system-ui,sans-serif" font-size="80" font-weight="600" fill="white">${initial}</text>
    </svg>`)
}

// ==================== Main Seed ====================

async function main() {
  console.log('🌱 Seeding database...\n')

  // ============================
  // 1. 사이트 설정
  // ============================
  console.log('  📋 사이트 설정...')
  const siteSettings = [
    { key: 'site_name', value: '뷰티톡', valueType: 'string', description: '사이트명' },
    { key: 'site_url', value: 'https://beautytalk.kr', valueType: 'string', description: '사이트 URL' },
    { key: 'site_description', value: '대한민국 No.1 뷰티 성형 정보 커뮤니티', valueType: 'string', description: '사이트 설명' },
    { key: 'copyright', value: '© 2026 뷰티톡. All rights reserved.', valueType: 'string', description: '저작권 문구' },
    { key: 'representative_email', value: 'contact@beautytalk.kr', valueType: 'string', description: '대표 이메일' },
    { key: 'business_name', value: '(주)뷰티톡', valueType: 'string', description: '사업자명' },
    { key: 'business_number', value: '123-45-67890', valueType: 'string', description: '사업자번호' },
    { key: 'business_ceo', value: '홍길동', valueType: 'string', description: '대표자명' },
    { key: 'business_address', value: '서울특별시 강남구 테헤란로 123, 4층', valueType: 'string', description: '사업장 주소' },
    { key: 'default_language', value: 'ko', valueType: 'string', description: '기본 언어' },
    { key: 'timezone', value: 'Asia/Seoul', valueType: 'string', description: '타임존' },
    { key: 'date_format', value: 'YYYY.MM.DD', valueType: 'string', description: '날짜 포맷' },
    { key: 'meta_title_format', value: '{페이지명} | 뷰티톡', valueType: 'string', description: 'SEO 타이틀 포맷' },
    { key: 'meta_description', value: '성형, 피부, 시술 정보를 한곳에서! 실제 후기와 전문의 상담을 뷰티톡에서 만나보세요.', valueType: 'string', description: '기본 meta description' },
    { key: 'ga4_measurement_id', value: '', valueType: 'string', description: 'GA4 측정 ID' },
    { key: 'login_attempt_limit', value: '5', valueType: 'number', description: '로그인 시도 제한 횟수' },
    { key: 'login_lockout_minutes', value: '30', valueType: 'number', description: '로그인 잠금 시간(분)' },
    { key: 'admin_2fa_required', value: 'false', valueType: 'boolean', description: '어드민 2FA 필수 여부' },
    { key: 'signup_enabled', value: 'true', valueType: 'boolean', description: '회원가입 허용' },
    { key: 'email_verification_required', value: 'true', valueType: 'boolean', description: '이메일 인증 필수' },
    { key: 'maintenance_mode', value: 'false', valueType: 'boolean', description: '점검 모드' },
    { key: 'dormant_days', value: '90', valueType: 'number', description: '휴면 전환 기준일' },
    { key: 'session_timeout_minutes', value: '30', valueType: 'number', description: '어드민 세션 타임아웃(분)' },
    { key: 'cache_version', value: '1', valueType: 'number', description: '캐시 버전' },
  ]

  for (const s of siteSettings) {
    await prisma.siteSetting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: s,
    })
  }

  // ============================
  // 2. 등급
  // ============================
  console.log('  👥 등급 설정...')
  const grades = [
    { grade: 0, name: '비회원', autoUpgrade: false, notifyUpgrade: false, storageLimitMb: 0, conditions: null },
    { grade: 1, name: '새싹', autoUpgrade: true, notifyUpgrade: true, storageLimitMb: 50, conditions: null },
    { grade: 2, name: '일반', autoUpgrade: true, notifyUpgrade: true, storageLimitMb: 100, conditions: { posts: 10, comments: 20, days: 7 } },
    { grade: 3, name: '실버', autoUpgrade: true, notifyUpgrade: true, storageLimitMb: 200, conditions: { posts: 50, comments: 100, days: 30 } },
    { grade: 4, name: '골드', autoUpgrade: true, notifyUpgrade: true, storageLimitMb: 500, conditions: { posts: 100, comments: 200, days: 90 } },
    { grade: 5, name: '플래티넘', autoUpgrade: true, notifyUpgrade: true, storageLimitMb: 1000, conditions: { posts: 300, comments: 500, days: 180 } },
    { grade: 9, name: '어드민', autoUpgrade: false, notifyUpgrade: false, storageLimitMb: 10000, conditions: null },
  ]

  for (const g of grades) {
    await prisma.userGrade.upsert({
      where: { grade: g.grade },
      update: { name: g.name },
      create: g,
    })
  }

  // ============================
  // 3. 포인트 규칙
  // ============================
  console.log('  💰 포인트 규칙...')
  const pointRules = [
    { type: 'signup', amount: 100, dailyLimit: null, minLength: null, isActive: true },
    { type: 'post', amount: 10, dailyLimit: 5, minLength: 100, isActive: true },
    { type: 'comment', amount: 5, dailyLimit: 10, minLength: 20, isActive: true },
    { type: 'attendance', amount: 3, dailyLimit: 1, minLength: null, isActive: true },
    { type: 'like_received', amount: 2, dailyLimit: null, minLength: null, isActive: true },
    { type: 'report_blind', amount: -10, dailyLimit: null, minLength: null, isActive: true },
  ]

  for (const r of pointRules) {
    await prisma.pointRule.upsert({
      where: { type: r.type },
      update: { amount: r.amount },
      create: r,
    })
  }

  // ============================
  // 4. 어드민 역할
  // ============================
  console.log('  🔐 어드민 역할...')
  const superRole = await prisma.adminRole.upsert({
    where: { name: '슈퍼 어드민' },
    update: {},
    create: { name: '슈퍼 어드민', description: '모든 권한 보유. 시스템 설정 변경, 역할 관리 가능.', isSystem: true },
  })
  const operatorRole = await prisma.adminRole.upsert({
    where: { name: '운영자' },
    update: {},
    create: { name: '운영자', description: '회원 관리, 게시물 관리, 신고/제재 처리.', isSystem: true },
  })
  const editorRole = await prisma.adminRole.upsert({
    where: { name: '에디터' },
    update: {},
    create: { name: '에디터', description: '콘텐츠 작성 및 편집만 가능.', isSystem: true },
  })

  async function upsertPermission(roleId: bigint, module: string, canRead: boolean, canWrite: boolean, canDelete: boolean) {
    const existing = await prisma.adminRolePermission.findFirst({
      where: { roleId, module, boardId: null },
    })
    if (existing) {
      await prisma.adminRolePermission.update({
        where: { id: existing.id },
        data: { canRead, canWrite, canDelete },
      })
    } else {
      await prisma.adminRolePermission.create({
        data: { roleId, module, canRead, canWrite, canDelete },
      })
    }
  }

  // 슈퍼 어드민 권한 (전체)
  const modules = ['dashboard', 'users', 'boards', 'posts', 'comments', 'reports', 'sanctions', 'menus', 'banners', 'popups', 'notifications', 'stats', 'settings', 'system', 'homepage']
  for (const mod of modules) {
    await upsertPermission(superRole.id, mod, true, true, true)
  }

  // 운영자 권한
  const opModules = ['dashboard', 'users', 'boards', 'posts', 'comments', 'reports', 'sanctions', 'notifications']
  for (const mod of opModules) {
    await upsertPermission(operatorRole.id, mod, true, true, mod !== 'dashboard')
  }

  // 에디터 권한
  const edModules = ['dashboard', 'posts', 'comments']
  for (const mod of edModules) {
    await upsertPermission(editorRole.id, mod, true, mod !== 'dashboard', false)
  }

  // ============================
  // 5. 어드민 유저
  // ============================
  console.log('  👤 어드민 유저...')
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@beautytalk.kr' },
    update: {},
    create: {
      email: 'admin@beautytalk.kr',
      passwordHash: '$2a$10$dummyHashForSeedDataOnly00000000000000000000000', // 실제 운영 시 변경 필수
      nickname: '관리자',
      name: '관리자',
      grade: 9,
      points: 0,
      status: 'active',
      emailVerifiedAt: new Date(),
    },
  })

  await prisma.adminUser.upsert({
    where: { userId: adminUser.id },
    update: {},
    create: { userId: adminUser.id, roleId: superRole.id },
  })

  // ============================
  // 6. 샘플 유저 5명
  // ============================
  console.log('  👥 샘플 유저...')
  const sampleUsers = [
    { email: 'user1@test.com', nickname: '뷰티러버', name: '김민지', grade: 3, points: 450 },
    { email: 'user2@test.com', nickname: '성형후기왕', name: '이수진', grade: 4, points: 1200 },
    { email: 'user3@test.com', nickname: '피부고민녀', name: '박하나', grade: 2, points: 180 },
    { email: 'user4@test.com', nickname: '눈성형리얼', name: '최서연', grade: 3, points: 520 },
    { email: 'user5@test.com', nickname: '코디자인', name: '정유나', grade: 1, points: 100 },
  ]

  const users: Array<{ id: bigint }> = []
  for (const u of sampleUsers) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        ...u,
        passwordHash: '$2a$10$dummyHashForSeedDataOnly00000000000000000000000',
        status: 'active',
        emailVerifiedAt: new Date(),
        lastLoginAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      },
    })
    users.push(user)
  }

  // ============================
  // 7. 게시판 그룹 + 게시판
  // ============================
  console.log('  📂 게시판...')
  const communityGroup = await prisma.boardGroup.create({
    data: { nameKey: '커뮤니티', sortOrder: 1, isVisible: true },
  })
  const infoGroup = await prisma.boardGroup.create({
    data: { nameKey: '정보', sortOrder: 2, isVisible: true },
  })

  const boardDefs = [
    { group: communityGroup.id, nameKey: '자유게시판', slug: 'free', fullPath: '/community/free', type: 'general', skin: 'list', description: '자유롭게 이야기를 나눠보세요.', sortOrder: 1 },
    { group: communityGroup.id, nameKey: '시술후기', slug: 'reviews', fullPath: '/community/reviews', type: 'gallery', skin: 'card', description: '실제 시술 후기를 공유하세요.', sortOrder: 2 },
    { group: communityGroup.id, nameKey: 'Q&A', slug: 'qna', fullPath: '/community/qna', type: 'qa', skin: 'list', description: '궁금한 점을 질문하세요.', sortOrder: 3 },
    { group: infoGroup.id, nameKey: '공지사항', slug: 'notice', fullPath: '/info/notice', type: 'general', skin: 'list', description: '공식 공지사항입니다.', sortOrder: 1 },
    { group: infoGroup.id, nameKey: '전후사진', slug: 'before-after', fullPath: '/info/before-after', type: 'gallery', skin: 'album', description: '시술 전후 비교 사진 갤러리', sortOrder: 2 },
  ]

  const boards: Array<{ id: bigint; slug: string }> = []
  for (const b of boardDefs) {
    const board = await prisma.board.create({
      data: {
        groupId: b.group,
        nameKey: b.nameKey,
        slug: b.slug,
        fullPath: b.fullPath,
        depth: 1,
        type: b.type,
        skin: b.skin,
        description: b.description,
        sortOrder: b.sortOrder,
        isVisible: true,
      },
    })
    boards.push({ id: board.id, slug: board.slug })
  }

  const freeBoard = boards[0]!
  const reviewBoard = boards[1]!
  const qnaBoard = boards[2]!
  const noticeBoard = boards[3]!

  // ============================
  // 8. 샘플 게시물 + 댓글
  // ============================
  console.log('  📝 샘플 게시물...')

  const freePosts = [
    { title: '쌍꺼풀 절개 3주차 후기입니다', content: '<p>안녕하세요! 쌍꺼풀 절개 수술 3주차 후기 남깁니다.</p><p>붓기가 많이 빠져서 이제 자연스러워지고 있어요. 수술 직후에는 많이 걱정했는데, 시간이 지나니까 라인이 예쁘게 잡히네요.</p><p>혹시 쌍꺼풀 절개 고민하시는 분들은 참고하세요!</p>' },
    { title: '보톡스 처음 맞아봤는데 질문있어요', content: '<p>오늘 처음으로 사각턱 보톡스 맞았습니다.</p><p>근데 한쪽이 더 아픈 느낌인데 정상인가요? 그리고 효과가 보통 언제부터 나타나는지 궁금합니다.</p>' },
    { title: '피부과 레이저 추천해주세요', content: '<p>여드름 자국이 심한 편인데 레이저 시술 받아보려고 합니다.</p><p>프락셀, 피코레이저, 클래리티 중에 어떤게 좋을까요? 가격대도 궁금합니다.</p>' },
    { title: '코필러 1년 경과 후기', content: '<p>작년 3월에 코필러 맞은 후기입니다. 아직까지 유지되고 있고 만족스럽습니다.</p><p>처음에 1cc 맞았는데 6개월 후에 0.5cc 추가로 맞았어요. 자연스러운 코 라인이 나왔습니다.</p>' },
    { title: '입술필러 고민 중인데 부작용 없나요?', content: '<p>입술이 얇아서 필러 생각 중인데, 뭉침이나 부작용 걱정이 됩니다.</p><p>맞아본 분들 솔직한 후기 부탁드려요!</p>' },
  ]

  const reviewPosts = [
    { title: '눈밑지방재배치 한 달 후기 (사진포함)', content: '<p>눈밑지방재배치 수술 한 달이 지났어요.</p><p>다크서클이 확실히 개선됐고, 눈밑이 매끈해졌습니다. 회복기간은 2주 정도 걸렸어요.</p><p>아직 약간 부어있지만 만족스럽습니다!</p>' },
    { title: '울쎄라 리프팅 3개월 경과 후기', content: '<p>40대 초반, 울쎄라 전체 리프팅 받았습니다.</p><p>확실히 턱선이 올라갔고, 팔자주름도 얕아졌어요. 시술 당일은 좀 아팠지만 결과에 만족합니다.</p>' },
    { title: '물광주사 5회 완료 솔직 후기', content: '<p>피부과에서 물광주사 5회 패키지로 받았습니다.</p><p>확실히 피부 톤이 밝아지고 촉촉해졌어요. 다만 효과 유지기간이 2-3개월 정도라 꾸준히 받아야 할 것 같습니다.</p>' },
  ]

  const qnaPosts = [
    { title: '쌍꺼풀 매몰 vs 절개 어떤게 나을까요?', content: '<p>눈이 좀 부은 편이고 지방이 많은데, 매몰이 가능할까요? 아니면 절개가 나을까요?</p><p>병원 상담은 받았는데 의견이 다 달라서 혼란스럽습니다.</p>' },
    { title: '코성형 후 안경 착용 언제부터 가능한가요?', content: '<p>코 보형물 넣는 수술 예정인데, 안경을 매일 써야 해서 걱정입니다.</p><p>보통 언제부터 안경 착용이 가능한지 아시는 분?</p>' },
  ]

  const noticePosts = [
    { title: '뷰티톡 커뮤니티 이용규칙 안내', content: '<p>안녕하세요, 뷰티톡 운영팀입니다.</p><p>원활한 커뮤니티 운영을 위해 다음 규칙을 안내드립니다.</p><ul><li>광고성 게시물 금지</li><li>타인 비방/욕설 금지</li><li>허위 후기 작성 금지</li><li>개인정보 노출 금지</li></ul><p>규칙 위반 시 경고 또는 계정 정지 조치될 수 있습니다.</p>', isNotice: true },
    { title: '2026년 3월 서비스 업데이트 안내', content: '<p>뷰티톡 서비스 업데이트를 안내드립니다.</p><ul><li>새로운 시술 카테고리 추가</li><li>후기 작성 시 사진 업로드 개선</li><li>모바일 UI 최적화</li></ul><p>더 좋은 서비스를 위해 노력하겠습니다. 감사합니다.</p>', isNotice: true },
  ]

  // 게시물 생성 헬퍼
  async function createPosts(
    boardId: bigint,
    posts: Array<{ title: string; content: string; isNotice?: boolean }>,
  ) {
    const created = []
    for (let i = 0; i < posts.length; i++) {
      const p = posts[i]!
      const userId = p.isNotice ? adminUser.id : users[i % users.length]!.id
      const daysAgo = Math.floor(Math.random() * 30)
      const post = await prisma.post.create({
        data: {
          boardId,
          userId,
          title: p.title,
          content: p.content,
          contentPlain: p.content.replace(/<[^>]*>/g, ''),
          isNotice: p.isNotice ?? false,
          status: 'published',
          viewCount: Math.floor(Math.random() * 500) + 20,
          likeCount: Math.floor(Math.random() * 50),
          commentCount: 0,
          publishedAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
        },
      })
      created.push(post)
    }
    return created
  }

  const freePostResults = await createPosts(freeBoard.id, freePosts)
  await createPosts(reviewBoard.id, reviewPosts)
  await createPosts(qnaBoard.id, qnaPosts)
  await createPosts(noticeBoard.id, noticePosts)

  // 댓글
  console.log('  💬 샘플 댓글...')
  const commentContents = [
    '좋은 정보 감사합니다! 도움이 많이 됐어요.',
    '저도 같은 고민인데 참고할게요~',
    '후기 잘 봤습니다. 자연스러워 보이네요!',
    '가격은 어느정도 드셨나요?',
    '병원 어디서 하셨어요? DM 가능할까요?',
    '회복기간이 궁금합니다.',
    '대박... 결과가 너무 좋네요 ㅠㅠ',
    '저도 예약했는데 긴장되네요...',
  ]

  for (const post of freePostResults) {
    const numComments = Math.floor(Math.random() * 4) + 1
    for (let c = 0; c < numComments; c++) {
      await prisma.comment.create({
        data: {
          postId: post.id,
          userId: users[Math.floor(Math.random() * users.length)]!.id,
          content: commentContents[Math.floor(Math.random() * commentContents.length)]!,
          status: 'active',
        },
      })
    }
    await prisma.post.update({
      where: { id: post.id },
      data: { commentCount: numComments },
    })
  }

  // ============================
  // 9. 메뉴
  // ============================
  console.log('  📑 메뉴...')
  const gnbMenus = [
    { nameKey: '홈', linkType: 'internal', linkUrl: '/', sortOrder: 1 },
    { nameKey: '커뮤니티', linkType: 'internal', linkUrl: '/community/free', sortOrder: 2, boardId: freeBoard.id },
    { nameKey: '시술후기', linkType: 'internal', linkUrl: '/community/reviews', sortOrder: 3, boardId: reviewBoard.id },
    { nameKey: 'Q&A', linkType: 'internal', linkUrl: '/community/qna', sortOrder: 4, boardId: qnaBoard.id },
    { nameKey: '전후사진', linkType: 'internal', linkUrl: '/info/before-after', sortOrder: 5 },
  ]

  for (const m of gnbMenus) {
    await prisma.menu.create({
      data: {
        location: 'gnb',
        nameKey: m.nameKey,
        linkType: m.linkType,
        linkUrl: m.linkUrl,
        boardId: m.boardId ?? null,
        sortOrder: m.sortOrder,
        isVisible: true,
      },
    })
  }

  const footerMenus = [
    { nameKey: '이용약관', linkUrl: '/terms', sortOrder: 1 },
    { nameKey: '개인정보처리방침', linkUrl: '/privacy', sortOrder: 2 },
    { nameKey: '공지사항', linkUrl: '/info/notice', sortOrder: 3 },
    { nameKey: '문의하기', linkUrl: '/contact', sortOrder: 4 },
  ]

  for (const m of footerMenus) {
    await prisma.menu.create({
      data: { location: 'footer', nameKey: m.nameKey, linkType: 'internal', linkUrl: m.linkUrl, sortOrder: m.sortOrder, isVisible: true },
    })
  }

  // ============================
  // 10. 홈페이지 섹션
  // ============================
  console.log('  🏠 홈페이지 섹션...')

  const heroImage = 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=1200&h=360&q=80'

  const homepageSections = [
    {
      type: 'hero_banner',
      title: '히어로 배너',
      sortOrder: 1,
      config: {
        badge: 'NEW OPEN',
        title: '나에게 맞는\n성형 정보를 찾아보세요',
        description: '검증된 전문의 상담부터 실제 후기까지\n뷰티톡에서 한번에 확인하세요.',
        buttonText: '후기 보러가기',
        buttonHref: '/community/reviews',
        imageUrl: heroImage,
      },
    },
    {
      type: 'trust_stats',
      title: '신뢰 통계',
      sortOrder: 2,
      config: {
        items: [
          { id: 'ts-1', icon: '⭐', iconBgColor: '#FEF3C7', label: '만족도', value: '4.9/5.0', sortOrder: 1 },
          { id: 'ts-2', icon: '📝', iconBgColor: '#EFF6FF', label: '리뷰 수', value: '12,847건', sortOrder: 2 },
          { id: 'ts-3', icon: '🏥', iconBgColor: '#ECFDF5', label: '제휴 병원', value: '320곳', sortOrder: 3 },
          { id: 'ts-4', icon: '👤', iconBgColor: '#F5F3FF', label: '누적 회원', value: '58,000+', sortOrder: 4 },
        ],
      },
    },
    {
      type: 'category',
      title: '시술 카테고리',
      sortOrder: 3,
      config: {
        title: '시술 카테고리',
        moreHref: '/categories',
        items: [
          { id: 'cat-1', icon: '👁️', iconBgColor: '#EFF6FF', label: '쌍꺼풀', href: '/categories/eye', sortOrder: 1 },
          { id: 'cat-2', icon: '👃', iconBgColor: '#FFF1F2', label: '코성형', href: '/categories/nose', sortOrder: 2 },
          { id: 'cat-3', icon: '💉', iconBgColor: '#F5F3FF', label: '필러/보톡스', href: '/categories/filler', sortOrder: 3 },
          { id: 'cat-4', icon: '✨', iconBgColor: '#ECFDF5', label: '피부관리', href: '/categories/skin', sortOrder: 4 },
          { id: 'cat-5', icon: '💆', iconBgColor: '#FEF3C7', label: '리프팅', href: '/categories/lifting', sortOrder: 5 },
          { id: 'cat-6', icon: '🦷', iconBgColor: '#FFF7ED', label: '치아교정', href: '/categories/dental', sortOrder: 6 },
          { id: 'cat-7', icon: '💪', iconBgColor: '#F0FDF4', label: '바디', href: '/categories/body', sortOrder: 7 },
          { id: 'cat-8', icon: '💄', iconBgColor: '#FDF4FF', label: '반영구', href: '/categories/permanent', sortOrder: 8 },
        ],
      },
    },
    {
      type: 'doctor',
      title: '전문 의료진',
      sortOrder: 4,
      config: {
        title: '전문 의료진',
        moreHref: '/doctors',
        items: [
          { id: 'doc-1', name: '김성훈', specialty: '성형외과 전문의', description: '눈·코 성형 15년 경력\n자연스러운 라인 전문', imageUrl: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=200&h=200&q=80', sortOrder: 1 },
          { id: 'doc-2', name: '이지연', specialty: '피부과 전문의', description: '레이저·리프팅 전문\nSCI 논문 12편', imageUrl: 'https://images.unsplash.com/photo-1594824432256-1a525ae7b122?auto=format&fit=crop&w=200&h=200&q=80', sortOrder: 2 },
          { id: 'doc-3', name: '박준호', specialty: '성형외과 전문의', description: '안면윤곽·양악 전문\n수술 3,000건+', imageUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=200&h=200&q=80', sortOrder: 3 },
          { id: 'doc-4', name: '최수아', specialty: '피부과 전문의', description: '여드름·흉터 치료\n맞춤형 스킨케어', imageUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=200&h=200&q=80', sortOrder: 4 },
        ],
      },
    },
    {
      type: 'latest_posts',
      title: '최신 게시글',
      sortOrder: 5,
      config: {
        title: '최신 게시글',
        moreHref: '/community/free',
        boardId: String(freeBoard.id),
        limit: 5,
        skin: 'list',
      },
    },
    {
      type: 'popular_posts',
      title: '인기 게시글',
      sortOrder: 6,
      config: {
        title: '인기 게시글',
        moreHref: '/community/reviews',
        limit: 4,
        period: 'week',
        skin: 'card',
      },
    },
    {
      type: 'board_preview',
      title: '게시판 미리보기',
      sortOrder: 7,
      config: {
        title: '게시판 미리보기',
        boards: [
          { boardId: String(freeBoard.id), limit: 5 },
          { boardId: String(reviewBoard.id), limit: 5 },
        ],
        columns: 2,
      },
    },
    {
      type: 'cta_banner',
      title: 'CTA 배너',
      sortOrder: 8,
      config: {
        title: '지금 가입하고 무료 상담 받아보세요',
        description: '회원가입 시 100포인트 즉시 지급! 첫 상담 무료 쿠폰까지.',
        buttonText: '무료 가입하기',
        buttonHref: '/signup',
        bgColor: '#2563EB',
        textColor: '#ffffff',
        icon: '🎁',
      },
    },
  ]

  for (const section of homepageSections) {
    await prisma.homepageSection.create({
      data: {
        type: section.type,
        title: section.title,
        sortOrder: section.sortOrder,
        isActive: true,
        config: section.config,
      },
    })
  }

  // ============================
  // 11. 헤더/푸터 설정 (site_settings에 JSON으로)
  // ============================
  console.log('  🎨 헤더/푸터 설정...')

  const headerConfig = {
    id: 'header',
    logoIcon: '💎',
    logoText: '뷰티톡',
    navItems: [
      { id: 'nav-1', label: '홈', href: '/', isActive: true, sortOrder: 1 },
      { id: 'nav-2', label: '커뮤니티', href: '/community/free', isActive: true, sortOrder: 2 },
      { id: 'nav-3', label: '시술후기', href: '/community/reviews', isActive: true, sortOrder: 3 },
      { id: 'nav-4', label: 'Q&A', href: '/community/qna', isActive: true, sortOrder: 4 },
      { id: 'nav-5', label: '전후사진', href: '/info/before-after', isActive: true, sortOrder: 5 },
    ],
    actionIcons: ['search', 'bell', 'user'],
    updatedAt: new Date().toISOString(),
  }

  const footerConfig = {
    id: 'footer',
    description: '뷰티톡은 성형·피부 시술 정보를 투명하게 공유하는 커뮤니티입니다.\n검증된 후기와 전문의 상담을 통해 올바른 선택을 도와드립니다.',
    columns: [
      {
        id: 'col-1', title: '서비스', sortOrder: 1,
        items: [
          { id: 'fi-1', label: '시술 카테고리', href: '/categories' },
          { id: 'fi-2', label: '전문의 찾기', href: '/doctors' },
          { id: 'fi-3', label: '시술 후기', href: '/community/reviews' },
        ],
      },
      {
        id: 'col-2', title: '커뮤니티', sortOrder: 2,
        items: [
          { id: 'fi-4', label: '자유게시판', href: '/community/free' },
          { id: 'fi-5', label: 'Q&A', href: '/community/qna' },
          { id: 'fi-6', label: '공지사항', href: '/info/notice' },
        ],
      },
      {
        id: 'col-3', title: '고객지원', sortOrder: 3,
        items: [
          { id: 'fi-7', label: '문의하기', href: '/contact' },
          { id: 'fi-8', label: 'FAQ', href: '/faq' },
          { id: 'fi-9', label: '광고 문의', href: '/ad' },
        ],
      },
    ],
    copyright: '© 2026 뷰티톡. All rights reserved.',
    bottomLinks: [
      { id: 'bl-1', label: '이용약관', href: '/terms' },
      { id: 'bl-2', label: '개인정보처리방침', href: '/privacy' },
      { id: 'bl-3', label: '광고 문의', href: '/ad' },
    ],
    updatedAt: new Date().toISOString(),
  }

  await prisma.siteSetting.upsert({
    where: { key: 'homepage_header' },
    update: { value: JSON.stringify(headerConfig) },
    create: { key: 'homepage_header', value: JSON.stringify(headerConfig), valueType: 'json', description: '홈페이지 헤더 설정' },
  })

  await prisma.siteSetting.upsert({
    where: { key: 'homepage_footer' },
    update: { value: JSON.stringify(footerConfig) },
    create: { key: 'homepage_footer', value: JSON.stringify(footerConfig), valueType: 'json', description: '홈페이지 푸터 설정' },
  })

  // ============================
  // 12. 이메일 템플릿
  // ============================
  console.log('  📧 이메일 템플릿...')

  const emailTemplates = [
    {
      type: 'welcome',
      name: '회원가입 환영',
      subject: '뷰티톡에 오신 것을 환영합니다! 🎉',
      htmlBody: '<h1>환영합니다, {{이름}}님!</h1><p>뷰티톡에 가입해주셔서 감사합니다.</p><p>가입 축하 포인트 100P가 지급되었습니다.</p>',
      variables: { '이름': 'string', '등급': 'string', '포인트': 'number' },
      isSystem: true,
    },
    {
      type: 'password_reset',
      name: '비밀번호 재설정',
      subject: '비밀번호 재설정 안내',
      htmlBody: '<h1>비밀번호 재설정</h1><p>{{이름}}님, 아래 링크를 클릭하여 비밀번호를 재설정해주세요.</p><p><a href="{{링크}}">비밀번호 재설정</a></p><p>본 링크는 30분간 유효합니다.</p>',
      variables: { '이름': 'string', '링크': 'string' },
      isSystem: true,
    },
    {
      type: 'email_verification',
      name: '이메일 인증',
      subject: '이메일 인증을 완료해주세요',
      htmlBody: '<h1>이메일 인증</h1><p>{{이름}}님, 아래 링크를 클릭하여 이메일 인증을 완료해주세요.</p><p><a href="{{링크}}">인증하기</a></p>',
      variables: { '이름': 'string', '링크': 'string' },
      isSystem: true,
    },
    {
      type: 'grade_upgrade',
      name: '등급 승급 축하',
      subject: '축하합니다! {{등급}}으로 승급되었습니다 🎊',
      htmlBody: '<h1>등급 승급 축하드립니다!</h1><p>{{이름}}님이 {{등급}}으로 승급되었습니다.</p><p>새로운 등급의 혜택을 확인해보세요!</p>',
      variables: { '이름': 'string', '등급': 'string' },
      isSystem: true,
    },
    {
      type: 'account_warning',
      name: '계정 경고',
      subject: '커뮤니티 이용 규칙 위반 안내',
      htmlBody: '<h1>이용 규칙 위반 안내</h1><p>{{이름}}님, 커뮤니티 이용 규칙 위반으로 경고 처리되었습니다.</p><p>사유: {{사유}}</p><p>경고 누적 시 계정 이용이 제한될 수 있습니다.</p>',
      variables: { '이름': 'string', '사유': 'string' },
      isSystem: true,
    },
    {
      type: 'account_suspended',
      name: '계정 정지',
      subject: '계정 이용 정지 안내',
      htmlBody: '<h1>계정 정지 안내</h1><p>{{이름}}님, 커뮤니티 규칙 위반으로 계정이 정지되었습니다.</p><p>정지 기간: {{기간}}</p><p>사유: {{사유}}</p>',
      variables: { '이름': 'string', '기간': 'string', '사유': 'string' },
      isSystem: true,
    },
    {
      type: 'dormant_notice',
      name: '휴면 예정 안내',
      subject: '뷰티톡 계정 휴면 전환 예정 안내',
      htmlBody: '<h1>휴면 전환 예정 안내</h1><p>{{이름}}님, 90일간 로그인 기록이 없어 7일 후 휴면 계정으로 전환됩니다.</p><p>로그인하시면 휴면이 취소됩니다.</p>',
      variables: { '이름': 'string' },
      isSystem: true,
    },
  ]

  for (const t of emailTemplates) {
    await prisma.emailTemplate.upsert({
      where: { type: t.type },
      update: { htmlBody: t.htmlBody },
      create: t,
    })
  }

  // ============================
  // 13. 번역 키
  // ============================
  console.log('  🌐 번역 키...')
  const translations = [
    { key: 'menu.home', ko: '홈' },
    { key: 'menu.community', ko: '커뮤니티' },
    { key: 'menu.reviews', ko: '시술후기' },
    { key: 'menu.qna', ko: 'Q&A' },
    { key: 'menu.notice', ko: '공지사항' },
    { key: 'menu.before_after', ko: '전후사진' },
    { key: 'board.free', ko: '자유게시판' },
    { key: 'board.reviews', ko: '시술후기' },
    { key: 'board.qna', ko: 'Q&A' },
    { key: 'board.notice', ko: '공지사항' },
    { key: 'board.before_after', ko: '전후사진' },
    { key: 'grade.0', ko: '비회원' },
    { key: 'grade.1', ko: '새싹' },
    { key: 'grade.2', ko: '일반' },
    { key: 'grade.3', ko: '실버' },
    { key: 'grade.4', ko: '골드' },
    { key: 'grade.5', ko: '플래티넘' },
    { key: 'grade.9', ko: '어드민' },
    { key: 'common.login', ko: '로그인' },
    { key: 'common.signup', ko: '회원가입' },
    { key: 'common.logout', ko: '로그아웃' },
    { key: 'common.search', ko: '검색' },
    { key: 'common.save', ko: '저장' },
    { key: 'common.cancel', ko: '취소' },
    { key: 'common.delete', ko: '삭제' },
    { key: 'common.edit', ko: '수정' },
  ]

  for (const t of translations) {
    await prisma.translation.upsert({
      where: { key: t.key },
      update: { ko: t.ko },
      create: t,
    })
  }

  // ============================
  // 14. 약관
  // ============================
  console.log('  📜 약관...')
  await prisma.terms.create({
    data: {
      type: 'service',
      version: 'v1.0',
      title: '서비스 이용약관',
      content: '제1조 (목적) 이 약관은 뷰티톡(이하 "서비스")의 이용조건 및 절차에 관한 사항을 규정함을 목적으로 합니다.\n\n제2조 (정의) "회원"이란 서비스에 가입하여 이용계약을 체결한 자를 말합니다.\n\n제3조 (약관의 효력) 이 약관은 서비스 화면에 게시하거나 기타 방법으로 공지함으로써 효력이 발생합니다.',
      isRequired: true,
      enforcedAt: new Date(),
    },
  })
  await prisma.terms.create({
    data: {
      type: 'privacy',
      version: 'v1.0',
      title: '개인정보처리방침',
      content: '1. 개인정보의 수집·이용 목적\n- 회원가입 및 관리: 이메일, 닉네임, 비밀번호\n- 서비스 제공: 게시물 작성, 댓글, 알림\n\n2. 수집하는 개인정보 항목\n- 필수: 이메일, 닉네임, 비밀번호\n- 선택: 이름, 전화번호, 프로필 사진\n\n3. 개인정보 보유·이용 기간\n- 회원 탈퇴 시까지 (법령에 따른 보존 의무 제외)',
      isRequired: true,
      enforcedAt: new Date(),
    },
  })
  await prisma.terms.create({
    data: {
      type: 'marketing',
      version: 'v1.0',
      title: '마케팅 수신 동의',
      content: '뷰티톡의 이벤트, 프로모션, 신규 서비스 등 마케팅 정보를 이메일, SMS, 카카오 알림톡 등으로 수신하는 것에 동의합니다.\n\n수신 거부는 설정에서 언제든 변경 가능합니다.',
      isRequired: false,
      enforcedAt: new Date(),
    },
  })

  // ============================
  // 15. 샘플 통계 (최근 7일)
  // ============================
  console.log('  📊 샘플 통계...')
  for (let d = 6; d >= 0; d--) {
    const date = new Date()
    date.setDate(date.getDate() - d)
    date.setHours(0, 0, 0, 0)
    await prisma.statsDaily.create({
      data: {
        date,
        newUsers: Math.floor(Math.random() * 30) + 5,
        activeUsers: Math.floor(Math.random() * 200) + 50,
        newPosts: Math.floor(Math.random() * 20) + 3,
        newComments: Math.floor(Math.random() * 50) + 10,
        newReports: Math.floor(Math.random() * 5),
        totalPoints: Math.floor(Math.random() * 1000) + 200,
      },
    })
  }

  // ============================
  // Done
  // ============================
  console.log('\n✅ Seed 완료!')
  console.log('  - 사이트 설정: 24개')
  console.log('  - 등급: 7개')
  console.log('  - 포인트 규칙: 6개')
  console.log('  - 어드민 역할: 3개')
  console.log('  - 어드민 유저: 1명 (admin@beautytalk.kr)')
  console.log('  - 샘플 유저: 5명')
  console.log('  - 게시판 그룹: 2개')
  console.log('  - 게시판: 5개')
  console.log('  - 샘플 게시물: 15개+')
  console.log('  - 샘플 댓글: 다수')
  console.log('  - 메뉴: GNB 5개 + 푸터 4개')
  console.log('  - 홈페이지 섹션: 8개 (히어로/통계/카테고리/의료진/최신글/인기글/게시판미리보기/CTA)')
  console.log('  - 헤더/푸터 설정: 전체')
  console.log('  - 이메일 템플릿: 7개')
  console.log('  - 번역: 26개')
  console.log('  - 약관: 3개')
  console.log('  - 일별 통계: 7일')

  // ============================
  // AI 자동 포스팅 시드
  // ============================
  console.log('\n  🤖 AI 자동 포스팅 시드...')

  // 블로그 페르소나 50개
  const blogPersonaData = [
    { name: '뷰티인사이더', writingStyle: '전문적이고 정보 중심, 데이터와 통계 인용 선호' },
    { name: '성형공감러', writingStyle: '친근하고 솔직한 후기 스타일, 구어체' },
    { name: '피부케어마스터', writingStyle: '과학적 근거 중심, 성분 분석 특화' },
    { name: '뷰티트렌드워처', writingStyle: '트렌디하고 감각적, 해외 트렌드 반영' },
    { name: '헬시뷰티타운', writingStyle: '건강과 미용의 균형, 자연주의 지향' },
    { name: '스킨랩코리아', writingStyle: '연구원 같은 분석적 문체, 전문용어 활용' },
    { name: '글로우업다이어리', writingStyle: '일상 공유 스타일, 독자와 대화하듯' },
    { name: '뷰티인플루언서A', writingStyle: 'SNS 감성, 짧고 임팩트 있는 문장' },
    { name: '성형브리핑', writingStyle: '뉴스 기사체, 사실 중심, 간결' },
    { name: '미용전문가K', writingStyle: '현직 미용사 관점, 실용적 팁 중심' },
  ]
  for (let i = 0; i < 50; i++) {
    const base = blogPersonaData[i % blogPersonaData.length]
    await prisma.persona.upsert({
      where: { id: BigInt(i + 1) },
      update: {},
      create: {
        name: i < blogPersonaData.length ? base.name : `블로그 작가 ${i + 1}`,
        type: 'BLOG',
        description: `뷰티/성형 전문 블로그 작가`,
        writingStyle: base.writingStyle,
        isActive: true,
      },
    }).catch(() => prisma.persona.create({
      data: {
        name: i < blogPersonaData.length ? base.name : `블로그 작가 ${i + 1}`,
        type: 'BLOG',
        description: `뷰티/성형 전문 블로그 작가`,
        writingStyle: base.writingStyle,
        isActive: true,
      },
    }))
  }

  // 커뮤니티 페르소나 50개
  const communityPersonaData = [
    { name: '후기녀_서울', writingStyle: '솔직한 실사용 후기, 이모지 많이 사용' },
    { name: '성형고민중', writingStyle: '고민 상담 스타일, 질문 많이 사용' },
    { name: '성형완료인증', writingStyle: '비포애프터 중심, 결과 공유' },
    { name: '뷰티팁공유', writingStyle: '팁 리스트 형식, 번호 매기기 선호' },
    { name: '의원비교분석', writingStyle: '객관적 비교, 가격 정보 포함' },
  ]
  for (let i = 0; i < 50; i++) {
    const base = communityPersonaData[i % communityPersonaData.length]
    await prisma.persona.create({
      data: {
        name: i < communityPersonaData.length ? base.name : `커뮤니티 유저 ${i + 1}`,
        type: 'COMMUNITY',
        description: `뷰티 커뮤니티 활성 유저`,
        writingStyle: base.writingStyle,
        isActive: true,
      },
    }).catch(() => {})
  }
  console.log('  - 블로그 페르소나: 50개')
  console.log('  - 커뮤니티 페르소나: 50개')

  // ContentSource 목업 100개 (sungyesa 기준)
  const categories = ['/free', '/photo', '/nosenew', '/d03', '/b01']
  const mockTitles = [
    '쌍꺼풀 수술 후기 솔직하게 공유합니다',
    '코 성형 1년 후 변화 비포애프터',
    '리프팅 시술 받고 나서 달라진 점',
    '필러 부작용 경험담과 해결 방법',
    '눈밑 지방이식 후기 상세 리뷰',
    '보톡스 처음 맞아본 솔직 후기',
    '성형 후 관리 방법 공유',
    '미용시술 가격 비교 정리',
    '성형외과 선택 기준 체크리스트',
    '시술 후 일상 복귀 타임라인',
  ]
  for (let i = 0; i < 100; i++) {
    await prisma.contentSource.create({
      data: {
        sourceDb: 'sungyesa',
        externalId: `mock_${i + 1}`,
        title: mockTitles[i % mockTitles.length] + ` (${i + 1})`,
        content: `이 글은 목업 데이터입니다. 실제 한세님 DB 동기화 후 교체됩니다. 카테고리: ${categories[i % categories.length]}. 번호: ${i + 1}`,
        sourceUrl: `https://sungyesa.com/free/${i + 1}`,
        category: categories[i % categories.length],
        author: `유저_${i % 20 + 1}`,
        viewCount: Math.floor(Math.random() * 1000),
        sourceDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        isProcessed: false,
      },
    }).catch(() => {})
  }
  console.log('  - ContentSource 목업: 100개')

  console.log('\n✅ AI 자동 포스팅 시드 완료!')
}

main()
  .catch((e) => {
    console.error('❌ Seed 실패:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
