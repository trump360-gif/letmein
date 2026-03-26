// ==================== 배너 타입 ====================

export const BANNER_POSITION_VALUES = [
  'main_top',
  'main_middle',
  'sidebar',
  'board_top',
  'footer',
] as const
export type BannerPosition = (typeof BANNER_POSITION_VALUES)[number]

export const BANNER_POSITION_LABELS: Record<BannerPosition, string> = {
  main_top: '메인 상단',
  main_middle: '메인 중단',
  sidebar: '사이드바',
  board_top: '게시판 상단',
  footer: '푸터',
}

export const BANNER_TYPE_VALUES = ['image', 'html', 'text'] as const
export type BannerType = (typeof BANNER_TYPE_VALUES)[number]

export const BANNER_TYPE_LABELS: Record<BannerType, string> = {
  image: '이미지',
  html: 'HTML',
  text: '텍스트',
}

export const TARGET_AUDIENCE_VALUES = ['all', 'logged_in', 'logged_out', 'grade', 'new_user'] as const
export type TargetAudience = (typeof TARGET_AUDIENCE_VALUES)[number]

export const TARGET_AUDIENCE_LABELS: Record<TargetAudience, string> = {
  all: '전체',
  logged_in: '로그인 회원',
  logged_out: '비로그인',
  grade: '등급별',
  new_user: '신규 회원',
}

export const DISMISS_OPTION_VALUES = ['today', 'week', 'forever', 'none'] as const
export type DismissOption = (typeof DISMISS_OPTION_VALUES)[number]

export const DISMISS_OPTION_LABELS: Record<DismissOption, string> = {
  today: '오늘 하루 보지 않기',
  week: '일주일 보지 않기',
  forever: '다시 보지 않기',
  none: '닫기 옵션 없음',
}

// ==================== 배너 아이템 ====================

export interface BannerItem {
  id: string
  groupId: string | null
  name: string
  position: BannerPosition
  type: BannerType
  pcImageId: string | null
  mobileImageId: string | null
  tabletImageId: string | null
  altText: string | null
  textContent: string | null
  bgColor: string | null
  textColor: string | null
  linkUrl: string | null
  openNewTab: boolean
  utmCampaign: string | null
  targetAudience: TargetAudience
  minGrade: number
  startsAt: string | null
  endsAt: string | null
  sortOrder: number
  isActive: boolean
  dismissOptions: DismissOption[]
  abGroup: string | null
  abRatio: number
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  group?: BannerGroupItem | null
  pcImage?: MediaRef | null
  mobileImage?: MediaRef | null
  tabletImage?: MediaRef | null
}

export interface MediaRef {
  id: string
  originalName: string
  mimeType: string
  sizeBytes: number
  width: number | null
  height: number | null
}

export interface BannerCreateInput {
  groupId?: string | null
  name: string
  position: BannerPosition
  type?: BannerType
  pcImageId?: string | null
  mobileImageId?: string | null
  tabletImageId?: string | null
  altText?: string | null
  textContent?: string | null
  bgColor?: string | null
  textColor?: string | null
  linkUrl?: string | null
  openNewTab?: boolean
  utmCampaign?: string | null
  targetAudience?: TargetAudience
  minGrade?: number
  startsAt?: string | null
  endsAt?: string | null
  sortOrder?: number
  isActive?: boolean
  dismissOptions?: DismissOption[]
  abGroup?: string | null
  abRatio?: number
}

export interface BannerUpdateInput extends Partial<BannerCreateInput> {}

// ==================== 배너 그룹 ====================

export interface BannerGroupItem {
  id: string
  name: string
  isActive: boolean
  createdAt: string
  _count?: {
    banners: number
  }
}

export interface BannerGroupCreateInput {
  name: string
  isActive?: boolean
}

// ==================== 배너 템플릿 ====================

export interface BannerTemplate {
  id: string
  name: string
  description: string
  data: BannerCreateInput
  createdAt: string
  updatedAt: string
}

export interface BannerTemplateCreateInput {
  name: string
  description?: string
  data: BannerCreateInput
}

export interface BannerTemplateListResponse {
  templates: BannerTemplate[]
  total: number
}

// ==================== 배너 임시저장 ====================

export interface BannerDraft {
  id: string
  data: Partial<BannerCreateInput>
  currentStep: number
  savedAt: string
}

// ==================== 응답 ====================

export interface BannerListResponse {
  banners: BannerItem[]
  total: number
}

export interface BannerGroupListResponse {
  groups: BannerGroupItem[]
}
