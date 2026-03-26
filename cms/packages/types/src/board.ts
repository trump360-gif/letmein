// ==================== 게시판 타입 ====================

export const BOARD_TYPE_VALUES = [
  'general',
  'gallery',
  'archive',
  'qa',
  'video',
  'calendar',
  'vote',
] as const

export type BoardType = (typeof BOARD_TYPE_VALUES)[number]

export const BOARD_TYPE_LABELS: Record<BoardType, string> = {
  general: '일반',
  gallery: '갤러리',
  archive: '자료실',
  qa: 'Q&A',
  video: '동영상',
  calendar: '일정/캘린더',
  vote: '투표',
}

export const BOARD_TYPE_DESCRIPTIONS: Record<BoardType, string> = {
  general: '텍스트 기반의 일반 게시판입니다.',
  gallery: '이미지 중심의 갤러리형 게시판입니다.',
  archive: '파일 첨부 중심의 자료실입니다.',
  qa: '질문과 답변 형식의 게시판입니다.',
  video: '동영상 콘텐츠 중심 게시판입니다.',
  calendar: '일정 및 캘린더 기반 게시판입니다.',
  vote: '투표/설문 기능이 포함된 게시판입니다.',
}

export type BoardSkin = 'list' | 'card' | 'album'

export const BOARD_SKIN_LABELS: Record<BoardSkin, string> = {
  list: '리스트형',
  card: '카드형',
  album: '앨범형',
}

// ==================== 등급 ====================

export const GRADE_LABELS: Record<number, string> = {
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
}

// ==================== 게시판 그룹 ====================

export interface BoardGroup {
  id: string
  nameKey: string
  sortOrder: number
  isVisible: boolean
  createdAt: string
  updatedAt: string
  boards?: Board[]
  _count?: {
    boards: number
  }
}

export interface BoardGroupCreateInput {
  nameKey: string
  sortOrder?: number
  isVisible?: boolean
}

export interface BoardGroupUpdateInput {
  nameKey?: string
  sortOrder?: number
  isVisible?: boolean
}

// ==================== 게시판 ====================

export interface Board {
  id: string
  groupId: string | null
  parentId: string | null
  nameKey: string
  slug: string
  fullPath: string
  depth: number
  type: BoardType
  description: string | null
  sortOrder: number
  isVisible: boolean

  // 권한
  readGrade: number
  writeGrade: number
  commentGrade: number
  uploadGrade: number
  likeGrade: number

  // 게시물 설정
  allowAnonymous: boolean
  allowSecret: boolean
  allowAttachment: boolean
  minLength: number
  maxLength: number | null
  allowSchedule: boolean
  reportThreshold: number
  autoBlind: boolean
  filterLevel: string

  // 인터랙션
  useLike: boolean
  useDislike: boolean
  useComment: boolean
  useReply: boolean
  useShare: boolean
  useViewCount: boolean
  preventCopy: boolean
  watermark: boolean

  // 스킨
  skin: BoardSkin
  perPage: number

  createdAt: string
  updatedAt: string
  deletedAt: string | null

  // relations
  group?: BoardGroup | null
  parent?: Board | null
  children?: Board[]
  _count?: {
    posts: number
    children: number
  }
}

export interface BoardCreateInput {
  groupId?: string | null
  parentId?: string | null
  nameKey: string
  slug: string
  type: BoardType
  description?: string | null
  sortOrder?: number
  isVisible?: boolean

  // 권한
  readGrade?: number
  writeGrade?: number
  commentGrade?: number
  uploadGrade?: number
  likeGrade?: number

  // 게시물 설정
  allowAnonymous?: boolean
  allowSecret?: boolean
  allowAttachment?: boolean
  minLength?: number
  maxLength?: number | null
  allowSchedule?: boolean
  reportThreshold?: number
  autoBlind?: boolean
  filterLevel?: string

  // 인터랙션
  useLike?: boolean
  useDislike?: boolean
  useComment?: boolean
  useReply?: boolean
  useShare?: boolean
  useViewCount?: boolean
  preventCopy?: boolean
  watermark?: boolean

  // 스킨
  skin?: BoardSkin
  perPage?: number
}

export interface BoardUpdateInput extends Partial<BoardCreateInput> {}

export interface BoardReorderInput {
  items: Array<{
    id: string
    sortOrder: number
    groupId?: string | null
    parentId?: string | null
  }>
}

// ==================== 게시판 트리 ====================

export interface BoardTreeGroup {
  id: string
  nameKey: string
  sortOrder: number
  isVisible: boolean
  boards: BoardTreeItem[]
}

export interface BoardTreeItem {
  id: string
  nameKey: string
  slug: string
  type: BoardType
  sortOrder: number
  isVisible: boolean
  depth: number
  groupId: string | null
  parentId: string | null
  children: BoardTreeItem[]
  _count?: {
    posts: number
    children: number
  }
}

// ==================== 통계 ====================

export interface BoardStats {
  boardId: string
  boardName: string
  postCount: number
  commentCount: number
  likeCount: number
}
