import { api } from '@/shared/api/client'
import type {
  CastMemberListParams,
  CastMemberListResponse,
  CastMember,
  ApiResponse,
} from '@letmein/types'

export async function fetchCastMembers(params: CastMemberListParams): Promise<CastMemberListResponse> {
  const searchParams = new URLSearchParams()
  if (params.page) searchParams.set('page', String(params.page))
  if (params.limit) searchParams.set('limit', String(params.limit))
  if (params.search) searchParams.set('search', params.search)
  if (params.status) searchParams.set('status', params.status)
  if (params.sortBy) searchParams.set('sortBy', params.sortBy)
  if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder)

  const res = await api.get(`admin/cast-members?${searchParams.toString()}`).json<ApiResponse<CastMemberListResponse>>()
  return res.data
}

export async function fetchCastMemberDetail(id: number): Promise<CastMember> {
  const res = await api.get(`admin/cast-members/${id}`).json<ApiResponse<CastMember>>()
  return res.data
}

export async function verifyCastMember(id: number, data: { status: 'verified' | 'rejected'; reason?: string }) {
  return api.patch(`admin/cast-members/${id}`, { json: data }).json<ApiResponse<{ message: string }>>()
}
