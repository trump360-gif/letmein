export type PostStatus = 'draft' | 'published' | 'hidden' | 'deleted' | 'blind' | 'scheduled'

export type PostType = 'TREND' | 'EVERGREEN'
export type PostLanguage = 'KO' | 'JA'
export type AutoPostStatus = 'SUCCESS' | 'FAILED' | 'SKIPPED'
export type PersonaType = 'BLOG' | 'COMMUNITY'

export interface Post {
  id: number
  boardId: number
  authorId: number
  title: string
  content: string
  status: PostStatus
  isPinned: boolean
  viewCount: number
  likeCount: number
  commentCount: number
  createdAt: string
  updatedAt: string
}

export interface PostDetail {
  id: string
  boardId: string
  boardName: string
  boardSlug: string
  userId: string | null
  userName: string | null
  userNickname: string | null
  categoryId: string | null
  title: string
  content: string
  contentPlain: string | null
  thumbnailId: string | null
  isNotice: boolean
  isAnonymous: boolean
  isSecret: boolean
  status: string
  viewCount: number
  likeCount: number
  dislikeCount: number
  commentCount: number
  reportCount: number
  metaTitle: string | null
  metaDesc: string | null
  ogImageId: string | null
  noIndex: boolean
  summary: string | null
  faqData: unknown | null
  schemaType: string | null
  seoScore: number | null
  aeoScore: number | null
  geoScore: number | null
  scheduledAt: string | null
  publishedAt: string
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  tags: { id: string; name: string }[]
  revisions: PostRevisionItem[]
}

export interface PostListItem {
  id: string
  boardId: string
  boardName: string
  boardSlug: string
  userId: string | null
  userNickname: string | null
  title: string
  status: string
  isNotice: boolean
  viewCount: number
  likeCount: number
  commentCount: number
  reportCount: number
  publishedAt: string
  createdAt: string
  thumbnailId: string | null
  // AI 자동 포스팅 필드
  postType: PostType | null
  language: PostLanguage
  aiGenerated: boolean
  seoScore: number | null
  aeoScore: number | null
  geoScore: number | null
}

export interface Persona {
  id: string
  name: string
  type: PersonaType
  description: string | null
  writingStyle: string | null
  externalId: string | null
  avatarUrl: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface PersonaCreateInput {
  name: string
  type: PersonaType
  description?: string
  writingStyle?: string
  externalId?: string
  avatarUrl?: string
}

export interface ContentSource {
  id: string
  sourceDb: string
  externalId: string
  title: string
  content: string
  sourceUrl: string | null
  category: string | null
  author: string | null
  viewCount: number | null
  extra: unknown | null
  fetchedAt: string
  sourceDate: string
  isProcessed: boolean
}

export interface AutoPostConfig {
  id: string
  name: string
  isActive: boolean
  personaId: string | null
  userId: string | null
  boardId: string | null
  postType: PostType
  language: PostLanguage
  generateCount: number
  generateHour: number
  publishWindowStart: number
  publishWindowEnd: number
  dailyLimit: number
  scheduleHour: number
  minSeoScore: number
  minAeoScore: number
  minGeoScore: number
  generateImage: boolean
  autoTranslate: boolean
  autoPublish: boolean
  sourceDb: string | null
  createdAt: string
  updatedAt: string
  persona?: Pick<Persona, 'id' | 'name' | 'type'>
}

export interface AutoPostConfigCreateInput {
  name: string
  personaId?: string
  userId?: string
  boardId?: string
  postType: PostType
  language: PostLanguage
  generateCount?: number
  generateHour?: number
  publishWindowStart?: number
  publishWindowEnd?: number
  dailyLimit?: number
  scheduleHour?: number
  minSeoScore?: number
  minAeoScore?: number
  minGeoScore?: number
  generateImage?: boolean
  autoTranslate?: boolean
  autoPublish?: boolean
  sourceDb?: string
}

export interface AutoPostLog {
  id: string
  configId: string
  postId: string | null
  status: AutoPostStatus
  postType: PostType
  language: PostLanguage
  seoScore: number | null
  aeoScore: number | null
  geoScore: number | null
  retryCount: number
  errorMessage: string | null
  executedAt: string
}

export interface PostRevisionItem {
  id: string
  userId: string | null
  title: string
  createdAt: string
}

export interface CommentDetail {
  id: string
  postId: string
  postTitle: string
  boardName: string
  parentId: string | null
  userId: string | null
  userNickname: string | null
  content: string
  isAnonymous: boolean
  isSecret: boolean
  likeCount: number
  reportCount: number
  status: string
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface DraftItem {
  id: string
  userId: string
  boardId: string | null
  postId: string | null
  title: string | null
  content: string | null
  createdAt: string
  updatedAt: string
}

export interface TemplateItem {
  id: string
  userId: string
  boardId: string | null
  name: string
  content: string
  isPublic: boolean
  isSystem: boolean
  createdAt: string
  updatedAt: string
}
