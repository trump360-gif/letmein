// ==================== 팝업 타입 ====================

export const POPUP_TYPE_VALUES = ['image', 'html'] as const
export type PopupType = (typeof POPUP_TYPE_VALUES)[number]

export const POPUP_TYPE_LABELS: Record<PopupType, string> = {
  image: '이미지',
  html: 'HTML',
}

export const POPUP_DISPLAY_SCOPE_VALUES = ['all', 'main', 'board'] as const
export type PopupDisplayScope = (typeof POPUP_DISPLAY_SCOPE_VALUES)[number]

export const POPUP_DISPLAY_SCOPE_LABELS: Record<PopupDisplayScope, string> = {
  all: '전체 페이지',
  main: '메인 페이지',
  board: '특정 게시판',
}

export const POPUP_ANIMATION_VALUES = ['fade', 'slide', 'scale', 'none'] as const
export type PopupAnimation = (typeof POPUP_ANIMATION_VALUES)[number]

export const POPUP_ANIMATION_LABELS: Record<PopupAnimation, string> = {
  fade: '페이드',
  slide: '슬라이드',
  scale: '스케일',
  none: '없음',
}

// ==================== 팝업 아이템 ====================

export interface PopupItem {
  id: string
  name: string
  type: PopupType
  imageId: string | null
  htmlContent: string | null
  displayScope: PopupDisplayScope
  boardId: string | null
  widthPx: number
  heightPx: number
  posX: number
  posY: number
  dismissOptions: string[]
  targetAudience: string
  minGrade: number
  targetNewDays: number | null
  targetRegion: string | null
  animation: PopupAnimation
  abGroup: string | null
  abRatio: number
  priority: number
  maxDisplay: number
  startsAt: string | null
  endsAt: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  image?: {
    id: string
    originalName: string
    mimeType: string
    width: number | null
    height: number | null
  } | null
  board?: {
    id: string
    nameKey: string
    slug: string
  } | null
}

export interface PopupCreateInput {
  name: string
  type?: PopupType
  imageId?: string | null
  htmlContent?: string | null
  displayScope?: PopupDisplayScope
  boardId?: string | null
  widthPx?: number
  heightPx?: number
  posX?: number
  posY?: number
  dismissOptions?: string[]
  targetAudience?: string
  minGrade?: number
  targetNewDays?: number | null
  targetRegion?: string | null
  animation?: PopupAnimation
  abGroup?: string | null
  abRatio?: number
  priority?: number
  maxDisplay?: number
  startsAt?: string | null
  endsAt?: string | null
  isActive?: boolean
}

export interface PopupUpdateInput extends Partial<PopupCreateInput> {}

export interface PopupListResponse {
  popups: PopupItem[]
  total: number
}
