export const ITEMS_PER_PAGE = 20

export const USER_STATUS = {
  active: '활성',
  dormant: '휴면',
  suspended: '정지',
  withdrawn: '탈퇴',
} as const

export const USER_GRADES: Record<number, string> = {
  0: '비회원',
  1: '일반',
  2: 'Bronze',
  3: 'Silver',
  4: 'Gold',
  5: 'VVIP',
  9: '어드민',
} as const

export const POINT_RULE_TYPES: Record<string, string> = {
  post_create: '게시글 작성',
  comment_create: '댓글 작성',
  like_received: '좋아요 받기',
  login_daily: '일일 로그인',
  signup_bonus: '회원가입 보너스',
} as const

export const POST_STATUS = {
  published: '발행',
  draft: '임시저장',
  blind: '블라인드',
  deleted: '삭제',
  scheduled: '예약',
} as const

export const BOARD_TYPES = {
  general: '일반',
  gallery: '갤러리',
  archive: '자료실',
  qa: 'Q&A',
  video: '동영상',
  calendar: '일정/캘린더',
  vote: '투표',
} as const

export const BOARD_GRADE_LABELS: Record<number, string> = {
  0: '비회원',
  1: '새싹',
  2: '일반',
  3: '실버',
  4: '골드',
  5: '플래티넘',
  6: '다이아',
  7: '마스터',
  8: '운영자',
  9: '어드민',
} as const

// ==================== 신고/제재 ====================

export const REPORT_TARGET_TYPES = {
  post: '게시물',
  comment: '댓글',
  user: '유저',
} as const

export const REPORT_REASONS = {
  spam: '스팸/광고',
  abuse: '욕설/비하',
  harassment: '괴롭힘',
  sexual: '음란물',
  illegal: '불법 정보',
  copyright: '저작권 침해',
  other: '기타',
} as const

export const REPORT_STATUS = {
  pending: '대기',
  processed: '처리됨',
  dismissed: '기각',
} as const

export const REPORT_STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  processed: 'bg-green-100 text-green-800',
  dismissed: 'bg-gray-100 text-gray-800',
} as const

export const REPORT_ACTIONS = {
  blind: '블라인드',
  delete: '삭제',
  dismiss: '기각',
} as const

export const SANCTION_TYPES = {
  warning: '경고',
  suspend_1d: '1일 정지',
  suspend_3d: '3일 정지',
  suspend_7d: '7일 정지',
  suspend_30d: '30일 정지',
  permanent_ban: '영구 정지',
  force_logout: '강제 로그아웃',
  ip_ban: 'IP 차단',
} as const

export const SANCTION_TYPE_COLORS = {
  warning: 'bg-yellow-100 text-yellow-800',
  suspend_1d: 'bg-orange-100 text-orange-800',
  suspend_3d: 'bg-orange-100 text-orange-800',
  suspend_7d: 'bg-orange-200 text-orange-900',
  suspend_30d: 'bg-red-100 text-red-800',
  permanent_ban: 'bg-red-200 text-red-900',
  force_logout: 'bg-blue-100 text-blue-800',
  ip_ban: 'bg-purple-100 text-purple-800',
} as const

export const BANNED_WORD_PATTERN_TYPES = {
  direct: '직접 매칭',
  regex: '정규식(변형)',
  chosung: '초성',
} as const

export const BANNED_WORD_ACTIONS = {
  replace: '치환(***)',
  block: '등록 차단',
  blind: '자동 블라인드',
} as const

export const FILTER_LEVELS = {
  lenient: '허용',
  normal: '보통',
  strict: '엄격',
} as const

export const FILTER_LEVEL_COLORS = {
  lenient: 'bg-green-100 text-green-800',
  normal: 'bg-yellow-100 text-yellow-800',
  strict: 'bg-red-100 text-red-800',
} as const
