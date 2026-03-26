// ==================== 홈페이지 관리 타입 ====================

// ==================== 헤더 설정 ====================

export interface SiteHeaderConfig {
  id: string
  logoIcon: string
  logoText: string
  logoImageUrl: string
  navItems: NavItem[]
  actionIcons: HeaderActionIcon[]
  updatedAt: string
}

export interface NavItem {
  id: string
  label: string
  href: string
  isActive: boolean
  sortOrder: number
}

export type HeaderActionIcon = 'search' | 'bell' | 'user'

export interface SiteHeaderUpdateInput {
  logoIcon?: string
  logoText?: string
  logoImageUrl?: string
  navItems?: Omit<NavItem, 'id'>[]
  actionIcons?: HeaderActionIcon[]
}

// ==================== 푸터 설정 ====================

export interface SiteFooterConfig {
  id: string
  description: string
  columns: FooterColumn[]
  copyright: string
  bottomLinks: FooterLink[]
  updatedAt: string
}

export interface FooterColumn {
  id: string
  title: string
  items: FooterLink[]
  sortOrder: number
}

export interface FooterLink {
  id: string
  label: string
  href: string
}

export interface FooterColumnInput {
  title: string
  items: { label: string; href: string }[]
  sortOrder: number
}

export interface SiteFooterUpdateInput {
  description?: string
  columns?: FooterColumnInput[]
  copyright?: string
  bottomLinks?: { label: string; href: string }[]
}

// ==================== 홈페이지 섹션 ====================

export const HOMEPAGE_SECTION_TYPES = [
  'hero_banner',
  'trust_stats',
  'category',
  'main_content',
  'doctor',
  'latest_posts',
  'popular_posts',
  'board_preview',
  'cta_banner',
  'html_block',
  'blog_magazine',
  'blog_grid',
  'blog_full',
] as const
export type HomepageSectionType = (typeof HOMEPAGE_SECTION_TYPES)[number]

export const HOMEPAGE_SECTION_LABELS: Record<HomepageSectionType, string> = {
  hero_banner: '히어로 배너',
  trust_stats: '신뢰 통계',
  category: '카테고리',
  main_content: '메인 콘텐츠',
  doctor: '팀 소개',
  latest_posts: '최신 게시글',
  popular_posts: '인기 게시글',
  board_preview: '게시판 미리보기',
  cta_banner: 'CTA 배너',
  html_block: '자유 HTML 블록',
  blog_magazine: '블로그 매거진',
  blog_grid: '블로그 그리드',
  blog_full: '블로그 풀와이드',
}

export interface HomepageSection {
  id: string
  type: HomepageSectionType
  title: string
  isActive: boolean
  sortOrder: number
  config: Record<string, unknown>
  updatedAt: string
}

// ==================== 히어로 배너 ====================

export interface HeroBannerConfig {
  badge: string
  title: string
  description: string
  buttonText: string
  buttonHref: string
  imageUrl: string
}

// ==================== 신뢰 통계 ====================

export interface TrustStatItem {
  id: string
  icon: string
  iconBgColor: string
  label: string
  value: string
  sortOrder: number
}

export interface TrustStatsConfig {
  items: TrustStatItem[]
}

// ==================== 카테고리 섹션 ====================

export interface CategoryItem {
  id: string
  icon: string
  iconBgColor: string
  label: string
  href: string
  sortOrder: number
}

export interface CategorySectionConfig {
  title: string
  moreHref: string
  items: CategoryItem[]
}

// ==================== 의료진 섹션 ====================

export interface DoctorItem {
  id: string
  name: string
  specialty: string
  description: string
  imageUrl: string
  sortOrder: number
}

export interface DoctorSectionConfig {
  title: string
  moreHref: string
  items: DoctorItem[]
}

// ==================== 최신 게시글 섹션 ====================

export interface LatestPostsConfig {
  title: string
  moreHref: string
  boardId?: string       // 특정 게시판 지정 (없으면 전체)
  limit: number          // 표시할 개수
  skin: 'list' | 'card'  // 표시 형태
}

// ==================== 인기 게시글 섹션 ====================

export interface PopularPostsConfig {
  title: string
  moreHref: string
  limit: number
  period: 'day' | 'week' | 'month' | 'all'
  skin: 'list' | 'card'
}

// ==================== 게시판 미리보기 섹션 ====================

export interface BoardPreviewConfig {
  title: string
  boards: {
    boardId: string
    limit: number
  }[]
  columns: number  // 2 | 3 | 4
}

// ==================== CTA 배너 섹션 ====================

export interface CtaBannerConfig {
  title: string
  description: string
  buttonText: string
  buttonHref: string
  bgColor: string
  textColor: string
  icon: string
}

// ==================== 블로그 피드 섹션 ====================

export interface BlogFeedConfig {
  title: string
  moreHref: string
  boardId?: string
  limit: number
}

// ==================== 자유 HTML 블록 ====================

export interface HtmlBlockConfig {
  html: string
}

// ==================== 섹션 업데이트 ====================

export interface HomepageSectionUpdateInput {
  title?: string
  isActive?: boolean
  sortOrder?: number
  config?: Record<string, unknown>
}

export interface HomepageSectionCreateInput {
  type: HomepageSectionType
  title: string
  isActive?: boolean
  sortOrder?: number
  config: Record<string, unknown>
}

// ==================== 전체 홈페이지 설정 ====================

export interface HomepageConfig {
  header: SiteHeaderConfig
  footer: SiteFooterConfig
  sections: HomepageSection[]
}
