import { api } from '@/shared/api/client'
import type {
  HospitalListParams,
  HospitalListResponse,
  Hospital,
  ApiResponse,
} from '@letmein/types'

export async function fetchHospitals(params: HospitalListParams): Promise<HospitalListResponse> {
  const searchParams = new URLSearchParams()
  if (params.page) searchParams.set('page', String(params.page))
  if (params.limit) searchParams.set('limit', String(params.limit))
  if (params.search) searchParams.set('search', params.search)
  if (params.status) searchParams.set('status', params.status)
  if (params.isPremium !== undefined) searchParams.set('isPremium', String(params.isPremium))
  if (params.sortBy) searchParams.set('sortBy', params.sortBy)
  if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder)

  const res = await api.get(`admin/hospitals?${searchParams.toString()}`).json<ApiResponse<HospitalListResponse>>()
  return res.data
}

export async function fetchHospitalDetail(id: number): Promise<Hospital> {
  const res = await api.get(`admin/hospitals/${id}`).json<ApiResponse<Hospital>>()
  return res.data
}

export async function updateHospitalStatus(id: number, data: { status: string; reason?: string }) {
  return api.patch(`admin/hospitals/${id}`, { json: data }).json<ApiResponse<{ message: string }>>()
}
