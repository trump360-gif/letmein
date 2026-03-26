export interface BoardData {
  nameKey: string
  slug: string
  description: string | null
  skin: 'list' | 'card' | 'album'
  type: string
  useComment: boolean
  useLike: boolean
  useViewCount: boolean
}

export interface PostItem {
  id: string
  title: string
  authorName: string | null
  createdAt: string
  viewCount: number
  likeCount: number
  commentCount: number
  isPinned: boolean
  thumbnailUrl: string | null
  excerpt: string | null
}

export interface PaginationData {
  page: number
  perPage: number
  totalCount: number
  totalPages: number
}

export interface BoardSkinProps {
  board: BoardData
  posts: PostItem[]
  pagination: PaginationData
}
