import { api } from '@/shared/api/client'
import type {
  SubscriptionListParams,
  SubscriptionListResponse,
  HospitalSubscription,
  ApiResponse,
} from '@letmein/types'

export async function fetchSubscriptions(params: SubscriptionListParams): Promise<SubscriptionListResponse> {
  const searchParams = new URLSearchParams()
  if (params.page) searchParams.set('page', String(params.page))
  if (params.limit) searchParams.set('limit', String(params.limit))
  if (params.search) searchParams.set('search', params.search)
  if (params.tier) searchParams.set('tier', params.tier)
  if (params.status) searchParams.set('status', params.status)
  if (params.sortBy) searchParams.set('sortBy', params.sortBy)
  if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder)

  const res = await api.get(`admin/premium?${searchParams.toString()}`).json<ApiResponse<SubscriptionListResponse>>()
  return res.data
}

export async function fetchSubscriptionDetail(id: number): Promise<HospitalSubscription> {
  const res = await api.get(`admin/premium/${id}`).json<ApiResponse<HospitalSubscription>>()
  return res.data
}

export async function updateSubscription(id: number, data: { status?: string; tier?: string; expiresAt?: string }) {
  return api.patch(`admin/premium/${id}`, { json: data }).json<ApiResponse<{ message: string }>>()
}
