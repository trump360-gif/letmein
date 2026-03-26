// ==================== 메뉴 타입 ====================

export const MENU_LOCATION_VALUES = ['gnb', 'sidebar', 'footer'] as const
export type MenuLocation = (typeof MENU_LOCATION_VALUES)[number]

export const MENU_LOCATION_LABELS: Record<MenuLocation, string> = {
  gnb: 'GNB (상단 메뉴)',
  sidebar: '사이드바',
  footer: '푸터',
}

export const LINK_TYPE_VALUES = ['internal', 'external', 'board', 'none'] as const
export type LinkType = (typeof LINK_TYPE_VALUES)[number]

export const LINK_TYPE_LABELS: Record<LinkType, string> = {
  internal: '내부 링크',
  external: '외부 링크',
  board: '게시판 연결',
  none: '링크 없음',
}

export const BADGE_TYPE_VALUES = ['new', 'hot', 'event', 'custom'] as const
export type BadgeType = (typeof BADGE_TYPE_VALUES)[number]

export const BADGE_TYPE_LABELS: Record<BadgeType, string> = {
  new: 'NEW',
  hot: 'HOT',
  event: '이벤트',
  custom: '직접 입력',
}

// ==================== 메뉴 아이템 ====================

export interface MenuItem {
  id: string
  parentId: string | null
  location: MenuLocation
  nameKey: string
  linkType: LinkType
  linkUrl: string | null
  boardId: string | null
  openNewTab: boolean
  icon: string | null
  minGrade: number
  maxGrade: number
  badgeType: string | null
  badgeText: string | null
  badgeColor: string | null
  badgeExpiresAt: string | null
  sortOrder: number
  isVisible: boolean
  createdAt: string
  updatedAt: string
  children?: MenuItem[]
  board?: {
    id: string
    nameKey: string
    slug: string
  } | null
}

export interface MenuCreateInput {
  parentId?: string | null
  location: MenuLocation
  nameKey: string
  linkType: LinkType
  linkUrl?: string | null
  boardId?: string | null
  openNewTab?: boolean
  icon?: string | null
  minGrade?: number
  maxGrade?: number
  badgeType?: string | null
  badgeText?: string | null
  badgeColor?: string | null
  badgeExpiresAt?: string | null
  sortOrder?: number
  isVisible?: boolean
}

export interface MenuUpdateInput extends Partial<MenuCreateInput> {}

export interface MenuReorderInput {
  items: Array<{
    id: string
    sortOrder: number
    parentId?: string | null
  }>
}

export interface MenuTreeItem extends MenuItem {
  children: MenuTreeItem[]
}

export interface MenuListResponse {
  menus: MenuItem[]
}
