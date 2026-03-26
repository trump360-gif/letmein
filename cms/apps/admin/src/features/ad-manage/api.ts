import { api } from '@/shared/api/client'
import type {
  AdCreativeListParams,
  AdCreativeListResponse,
  AdCreative,
  AdReviewPayload,
  AdCampaign,
  ApiResponse,
} from '@letmein/types'

export async function fetchAdCreatives(params: AdCreativeListParams): Promise<AdCreativeListResponse> {
  const searchParams = new URLSearchParams()
  if (params.page) searchParams.set('page', String(params.page))
  if (params.limit) searchParams.set('limit', String(params.limit))
  if (params.search) searchParams.set('search', params.search)
  if (params.reviewStatus) searchParams.set('reviewStatus', params.reviewStatus)
  if (params.sortBy) searchParams.set('sortBy', params.sortBy)
  if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder)

  const res = await api.get(`admin/ads/creatives?${searchParams.toString()}`).json<ApiResponse<AdCreativeListResponse>>()
  return res.data
}

export async function reviewAdCreative(id: number, data: AdReviewPayload) {
  return api.patch(`admin/ads/creatives/${id}/review`, { json: data }).json<ApiResponse<{ message: string }>>()
}

export async function fetchAdCampaigns(params: { page?: number; limit?: number; status?: string }): Promise<{
  campaigns: AdCampaign[]
  total: number
  page: number
  limit: number
  hasNext: boolean
}> {
  const searchParams = new URLSearchParams()
  if (params.page) searchParams.set('page', String(params.page))
  if (params.limit) searchParams.set('limit', String(params.limit))
  if (params.status) searchParams.set('status', params.status)

  const res = await api.get(`admin/ads/campaigns?${searchParams.toString()}`).json<ApiResponse<{
    campaigns: AdCampaign[]
    total: number
    page: number
    limit: number
    hasNext: boolean
  }>>()
  return res.data
}
