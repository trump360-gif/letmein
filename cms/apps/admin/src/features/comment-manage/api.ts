import { api } from '@/shared/api/client'
import type { ApiResponse, PaginationMeta, CommentDetail } from '@letmein/types'

export interface CommentListParams {
  page?: number
  limit?: number
  postId?: string
  status?: string
  search?: string
}

export async function fetchComments(params: CommentListParams = {}) {
  const searchParams = new URLSearchParams()
  if (params.page) searchParams.set('page', String(params.page))
  if (params.limit) searchParams.set('limit', String(params.limit))
  if (params.postId) searchParams.set('postId', params.postId)
  if (params.status) searchParams.set('status', params.status)
  if (params.search) searchParams.set('search', params.search)

  return api.get('admin/comments', { searchParams }).json<ApiResponse<CommentDetail[]> & { meta: PaginationMeta }>()
}

export async function blindComment(id: string) {
  return api.patch(`admin/comments/${id}`).json<ApiResponse<{ id: string; status: string }>>()
}

export async function deleteComment(id: string) {
  return api.delete(`admin/comments/${id}`).json<ApiResponse<{ id: string }>>()
}
