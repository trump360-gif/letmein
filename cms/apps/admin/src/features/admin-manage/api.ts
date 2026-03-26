import { api } from '@/shared/api/client'
import type {
  AdminRole,
  AdminRolePermission,
  AdminActivityLog,
  AdminLoginHistory,
  AdminUserDetail,
  SystemLog,
  AdminRoleCreatePayload,
  AdminRoleUpdatePayload,
  AdminRolePermissionUpdatePayload,
  AdminUserCreatePayload,
  AdminUserRoleChangePayload,
  AdminActivityLogSearchParams,
  AdminLoginHistorySearchParams,
  SystemLogSearchParams,
  PaginationMeta,
} from '@letmein/types'

// ==================== Activity Logs ====================

export async function fetchActivityLogs(params?: AdminActivityLogSearchParams) {
  const searchParams: Record<string, string> = {}
  if (params?.page) searchParams.page = params.page.toString()
  if (params?.limit) searchParams.limit = params.limit.toString()
  if (params?.adminId) searchParams.adminId = params.adminId
  if (params?.action) searchParams.action = params.action
  if (params?.module) searchParams.module = params.module
  if (params?.targetType) searchParams.targetType = params.targetType
  if (params?.targetId) searchParams.targetId = params.targetId
  if (params?.ipAddress) searchParams.ipAddress = params.ipAddress
  if (params?.dateFrom) searchParams.dateFrom = params.dateFrom
  if (params?.dateTo) searchParams.dateTo = params.dateTo
  if (params?.search) searchParams.search = params.search

  const res = await api
    .get('admin/activity-logs', { searchParams })
    .json<{ success: boolean; data: AdminActivityLog[]; meta: PaginationMeta }>()
  return { data: res.data, meta: res.meta }
}

export async function exportActivityLogs(params?: Record<string, string>) {
  const searchParams: Record<string, string> = { ...params }
  const res = await api.get('admin/activity-logs/export', { searchParams })
  return res.blob()
}

// ==================== Login History ====================

export async function fetchLoginHistory(params?: AdminLoginHistorySearchParams) {
  const searchParams: Record<string, string> = {}
  if (params?.page) searchParams.page = params.page.toString()
  if (params?.limit) searchParams.limit = params.limit.toString()
  if (params?.adminId) searchParams.adminId = params.adminId
  if (params?.status) searchParams.status = params.status
  if (params?.ipAddress) searchParams.ipAddress = params.ipAddress
  if (params?.dateFrom) searchParams.dateFrom = params.dateFrom
  if (params?.dateTo) searchParams.dateTo = params.dateTo

  const res = await api
    .get('admin/login-history', { searchParams })
    .json<{ success: boolean; data: AdminLoginHistory[]; meta: PaginationMeta }>()
  return { data: res.data, meta: res.meta }
}

// ==================== System Logs ====================

export async function fetchSystemLogs(params?: SystemLogSearchParams) {
  const searchParams: Record<string, string> = {}
  if (params?.page) searchParams.page = params.page.toString()
  if (params?.limit) searchParams.limit = params.limit.toString()
  if (params?.level) searchParams.level = params.level
  if (params?.type) searchParams.type = params.type
  if (params?.source) searchParams.source = params.source
  if (params?.dateFrom) searchParams.dateFrom = params.dateFrom
  if (params?.dateTo) searchParams.dateTo = params.dateTo
  if (params?.search) searchParams.search = params.search

  const res = await api
    .get('admin/system-logs', { searchParams })
    .json<{ success: boolean; data: SystemLog[]; meta: PaginationMeta }>()
  return { data: res.data, meta: res.meta }
}

// ==================== Roles ====================

export async function fetchRoles() {
  const res = await api
    .get('admin/roles')
    .json<{ success: boolean; data: AdminRole[] }>()
  return res.data
}

export async function createRole(payload: AdminRoleCreatePayload) {
  const res = await api
    .post('admin/roles', { json: payload })
    .json<{ success: boolean; data: AdminRole }>()
  return res.data
}

export async function updateRole(id: string, payload: AdminRoleUpdatePayload) {
  const res = await api
    .patch(`admin/roles/${id}`, { json: payload })
    .json<{ success: boolean; data: AdminRole }>()
  return res.data
}

export async function deleteRole(id: string) {
  await api.delete(`admin/roles/${id}`).json()
}

// ==================== Permissions ====================

export async function fetchRolePermissions(roleId: string) {
  const res = await api
    .get(`admin/roles/${roleId}/permissions`)
    .json<{ success: boolean; data: AdminRolePermission[] }>()
  return res.data
}

export async function updateRolePermissions(roleId: string, payload: AdminRolePermissionUpdatePayload) {
  const res = await api
    .patch(`admin/roles/${roleId}/permissions`, { json: payload })
    .json<{ success: boolean; data: AdminRolePermission[] }>()
  return res.data
}

// ==================== Admin Users ====================

export async function fetchAdmins(params?: { page?: number; limit?: number }) {
  const searchParams: Record<string, string> = {}
  if (params?.page) searchParams.page = params.page.toString()
  if (params?.limit) searchParams.limit = params.limit.toString()

  const res = await api
    .get('admin/admins', { searchParams })
    .json<{ success: boolean; data: AdminUserDetail[]; meta: PaginationMeta }>()
  return { data: res.data, meta: res.meta }
}

export async function createAdmin(payload: AdminUserCreatePayload) {
  const res = await api
    .post('admin/admins', { json: payload })
    .json<{ success: boolean; data: AdminUserDetail }>()
  return res.data
}

export async function changeAdminRole(id: string, payload: AdminUserRoleChangePayload) {
  const res = await api
    .patch(`admin/admins/${id}/role`, { json: payload })
    .json<{ success: boolean; data: AdminUserDetail }>()
  return res.data
}

export async function deleteAdmin(id: string) {
  await api.delete(`admin/admins/${id}`).json()
}
