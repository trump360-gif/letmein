import { api } from '@/shared/api/client'
import type {
  ConsultationListParams,
  ConsultationListResponse,
  ConsultationRequest,
  CoordinatorMatch,
  MatchPayload,
  ApiResponse,
} from '@letmein/types'

export async function fetchConsultations(params: ConsultationListParams): Promise<ConsultationListResponse> {
  const searchParams = new URLSearchParams()
  if (params.page) searchParams.set('page', String(params.page))
  if (params.limit) searchParams.set('limit', String(params.limit))
  if (params.search) searchParams.set('search', params.search)
  if (params.status) searchParams.set('status', params.status)
  if (params.sortBy) searchParams.set('sortBy', params.sortBy)
  if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder)

  const res = await api.get(`admin/consultations?${searchParams.toString()}`).json<ApiResponse<ConsultationListResponse>>()
  return res.data
}

export async function fetchConsultationDetail(id: number): Promise<ConsultationRequest & { matches: CoordinatorMatch[] }> {
  const res = await api.get(`admin/consultations/${id}`).json<ApiResponse<ConsultationRequest & { matches: CoordinatorMatch[] }>>()
  return res.data
}

export async function matchConsultation(id: number, data: MatchPayload) {
  return api.post(`admin/consultations/${id}/match`, { json: data }).json<ApiResponse<{ message: string }>>()
}

export async function updateConsultationStatus(id: number, data: { status: string; note?: string }) {
  return api.patch(`admin/consultations/${id}`, { json: data }).json<ApiResponse<{ message: string }>>()
}
