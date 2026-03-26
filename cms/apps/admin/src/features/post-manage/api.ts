import { api } from '@/shared/api/client'
import type { ApiResponse, PaginationMeta, PostListItem, PostDetail } from '@letmein/types'

export interface PostListParams {
  page?: number
  limit?: number
  boardId?: string
  status?: string
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  postType?: string
  language?: string
  aiGenerated?: string
}

export async function fetchPosts(params: PostListParams = {}) {
  const searchParams = new URLSearchParams()
  if (params.page) searchParams.set('page', String(params.page))
  if (params.limit) searchParams.set('limit', String(params.limit))
  if (params.boardId) searchParams.set('boardId', params.boardId)
  if (params.status) searchParams.set('status', params.status)
  if (params.search) searchParams.set('search', params.search)
  if (params.sortBy) searchParams.set('sortBy', params.sortBy)
  if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder)
  if (params.postType) searchParams.set('postType', params.postType)
  if (params.language) searchParams.set('language', params.language)
  if (params.aiGenerated) searchParams.set('aiGenerated', params.aiGenerated)

  return api.get('admin/posts', { searchParams }).json<ApiResponse<PostListItem[]> & { meta: PaginationMeta }>()
}

export async function fetchPost(id: string) {
  return api.get(`admin/posts/${id}`).json<ApiResponse<PostDetail>>()
}

export async function blindPost(id: string) {
  return api.patch(`admin/posts/${id}/blind`).json<ApiResponse<{ id: string; status: string }>>()
}

export async function deletePost(id: string) {
  return api.delete(`admin/posts/${id}`).json<ApiResponse<{ id: string }>>()
}

export async function updatePost(
  id: string,
  body: {
    title?: string
    content?: string
    metaTitle?: string
    metaDesc?: string
    summary?: string
    status?: string
    thumbnailId?: string | null
  },
) {
  return api.put(`admin/posts/${id}`, { json: body }).json<ApiResponse<{ id: string }>>()
}

export async function generatePostThumbnail(id: string) {
  return api.post(`admin/posts/${id}/thumbnail`).json<ApiResponse<{ thumbnailId: string }>>()
}

export async function movePost(id: string, targetBoardId: string) {
  return api
    .patch(`admin/posts/${id}/move`, { json: { targetBoardId } })
    .json<ApiResponse<{ id: string; boardId: string; boardName: string }>>()
}
