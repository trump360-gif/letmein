import { api } from '@/shared/api/client'
import type { ApiResponse, PaginationMeta, TemplateItem } from '@letmein/types'

export interface TemplateListParams {
  page?: number
  limit?: number
  boardId?: string
  search?: string
}

export async function fetchTemplates(params: TemplateListParams = {}) {
  const searchParams = new URLSearchParams()
  if (params.page) searchParams.set('page', String(params.page))
  if (params.limit) searchParams.set('limit', String(params.limit))
  if (params.boardId) searchParams.set('boardId', params.boardId)
  if (params.search) searchParams.set('search', params.search)

  return api.get('admin/templates', { searchParams }).json<ApiResponse<TemplateItem[]> & { meta: PaginationMeta }>()
}

export async function createTemplate(data: {
  name: string
  content: string
  userId: string
  boardId?: string
  isPublic?: boolean
  isSystem?: boolean
}) {
  return api.post('admin/templates', { json: data }).json<ApiResponse<TemplateItem>>()
}
