import { api } from '@/shared/api/client'
import type {
  EpisodeListParams,
  EpisodeListResponse,
  YouTubeEpisode,
  EpisodeCreatePayload,
  ApiResponse,
} from '@letmein/types'

export async function fetchEpisodes(params: EpisodeListParams): Promise<EpisodeListResponse> {
  const searchParams = new URLSearchParams()
  if (params.page) searchParams.set('page', String(params.page))
  if (params.limit) searchParams.set('limit', String(params.limit))
  if (params.search) searchParams.set('search', params.search)
  if (params.sortBy) searchParams.set('sortBy', params.sortBy)
  if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder)

  const res = await api.get(`admin/episodes?${searchParams.toString()}`).json<ApiResponse<EpisodeListResponse>>()
  return res.data
}

export async function fetchEpisodeDetail(id: number): Promise<YouTubeEpisode> {
  const res = await api.get(`admin/episodes/${id}`).json<ApiResponse<YouTubeEpisode>>()
  return res.data
}

export async function createEpisode(data: EpisodeCreatePayload) {
  return api.post('admin/episodes', { json: data }).json<ApiResponse<YouTubeEpisode>>()
}

export async function updateEpisode(id: number, data: Partial<EpisodeCreatePayload>) {
  return api.patch(`admin/episodes/${id}`, { json: data }).json<ApiResponse<YouTubeEpisode>>()
}

export async function deleteEpisode(id: number) {
  return api.delete(`admin/episodes/${id}`).json<ApiResponse<{ message: string }>>()
}
