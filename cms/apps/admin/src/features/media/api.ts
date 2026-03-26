import { api } from '@/shared/api/client'
import type { ApiResponse, PaginationMeta, MediaItem, MediaFolderItem, MediaUploadResponse } from '@letmein/types'

export interface MediaListParams {
  page?: number
  limit?: number
  folderId?: string | null
  fileType?: string
  search?: string
}

export interface MediaListResponse {
  media: MediaItem[]
  folders: MediaFolderItem[]
}

export async function fetchMedia(params: MediaListParams = {}) {
  const searchParams = new URLSearchParams()
  if (params.page) searchParams.set('page', String(params.page))
  if (params.limit) searchParams.set('limit', String(params.limit))
  if (params.folderId) searchParams.set('folderId', params.folderId)
  if (params.fileType) searchParams.set('fileType', params.fileType)
  if (params.search) searchParams.set('search', params.search)

  return api.get('media', { searchParams }).json<ApiResponse<MediaListResponse> & { meta: PaginationMeta }>()
}

export async function uploadMedia(file: File, options?: { folderId?: string; altText?: string }) {
  const formData = new FormData()
  formData.append('file', file)
  if (options?.folderId) formData.append('folderId', options.folderId)
  if (options?.altText) formData.append('altText', options.altText)

  return api.post('media/upload', { body: formData }).json<ApiResponse<MediaUploadResponse>>()
}

export async function deleteMedia(id: string) {
  return api.delete(`media/${id}`).json<ApiResponse<{ id: string }>>()
}
