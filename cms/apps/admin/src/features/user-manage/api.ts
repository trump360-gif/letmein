import { api } from '@/shared/api/client'
import type {
  UserListParams,
  UserListResponse,
  UserDetail,
  GradeChangePayload,
  PointActionPayload,
  SuspendPayload,
} from '@letmein/types'
import type { ApiResponse } from '@letmein/types'

// ==================== Users ====================

export async function fetchUsers(params: UserListParams): Promise<UserListResponse> {
  const searchParams = new URLSearchParams()
  if (params.page) searchParams.set('page', String(params.page))
  if (params.limit) searchParams.set('limit', String(params.limit))
  if (params.search) searchParams.set('search', params.search)
  if (params.grade !== undefined && params.grade !== null) searchParams.set('grade', String(params.grade))
  if (params.status) searchParams.set('status', params.status)
  if (params.sortBy) searchParams.set('sortBy', params.sortBy)
  if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder)
  if (params.joinFrom) searchParams.set('joinFrom', params.joinFrom)
  if (params.joinTo) searchParams.set('joinTo', params.joinTo)

  const res = await api.get(`admin/users?${searchParams.toString()}`).json<ApiResponse<UserListResponse>>()
  return res.data
}

export async function fetchUserDetail(id: number): Promise<UserDetail> {
  const res = await api.get(`admin/users/${id}`).json<ApiResponse<UserDetail>>()
  return res.data
}

export async function updateUser(id: number, data: { nickname?: string; name?: string; phone?: string }) {
  return api.patch(`admin/users/${id}`, { json: data }).json<ApiResponse<{ message: string }>>()
}

export async function deleteUser(id: number) {
  return api.delete(`admin/users/${id}`).json<ApiResponse<{ message: string }>>()
}

// ==================== Grade ====================

export async function changeUserGrade(id: number, data: GradeChangePayload) {
  return api.patch(`admin/users/${id}/grade`, { json: data }).json<ApiResponse<{ message: string }>>()
}

// ==================== Points ====================

export async function processPoints(id: number, data: PointActionPayload) {
  return api.post(`admin/users/${id}/points`, { json: data }).json<ApiResponse<{ message: string; balance: number }>>()
}

// ==================== Suspend ====================

export async function suspendUser(id: number, data: SuspendPayload) {
  return api.post(`admin/users/${id}/suspend`, { json: data }).json<ApiResponse<{ message: string }>>()
}

export async function unsuspendUser(id: number) {
  return api.delete(`admin/users/${id}/suspend`).json<ApiResponse<{ message: string }>>()
}

// ==================== Force Logout ====================

export async function forceLogout(id: number) {
  return api.post(`admin/users/${id}/force-logout`).json<ApiResponse<{ message: string }>>()
}
