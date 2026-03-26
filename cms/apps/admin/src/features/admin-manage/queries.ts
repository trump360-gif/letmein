import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchActivityLogs,
  fetchLoginHistory,
  fetchSystemLogs,
  fetchRoles,
  createRole,
  updateRole,
  deleteRole,
  fetchRolePermissions,
  updateRolePermissions,
  fetchAdmins,
  createAdmin,
  changeAdminRole,
  deleteAdmin,
} from './api'
import type {
  AdminRoleCreatePayload,
  AdminRoleUpdatePayload,
  AdminRolePermissionUpdatePayload,
  AdminUserCreatePayload,
  AdminUserRoleChangePayload,
  AdminActivityLogSearchParams,
  AdminLoginHistorySearchParams,
  SystemLogSearchParams,
} from '@letmein/types'

// ==================== Query Keys ====================

export const adminManageKeys = {
  all: ['admin-manage'] as const,
  activityLogs: (params?: AdminActivityLogSearchParams) =>
    [...adminManageKeys.all, 'activity-logs', params] as const,
  loginHistory: (params?: AdminLoginHistorySearchParams) =>
    [...adminManageKeys.all, 'login-history', params] as const,
  systemLogs: (params?: SystemLogSearchParams) =>
    [...adminManageKeys.all, 'system-logs', params] as const,
  roles: () => [...adminManageKeys.all, 'roles'] as const,
  rolePermissions: (roleId: string) =>
    [...adminManageKeys.all, 'role-permissions', roleId] as const,
  admins: (params?: { page?: number; limit?: number }) =>
    [...adminManageKeys.all, 'admins', params] as const,
}

// ==================== Activity Logs ====================

export function useActivityLogs(params?: AdminActivityLogSearchParams) {
  return useQuery({
    queryKey: adminManageKeys.activityLogs(params),
    queryFn: () => fetchActivityLogs(params),
    staleTime: 30 * 1000,
  })
}

// ==================== Login History ====================

export function useLoginHistory(params?: AdminLoginHistorySearchParams) {
  return useQuery({
    queryKey: adminManageKeys.loginHistory(params),
    queryFn: () => fetchLoginHistory(params),
    staleTime: 30 * 1000,
  })
}

// ==================== System Logs ====================

export function useSystemLogs(params?: SystemLogSearchParams) {
  return useQuery({
    queryKey: adminManageKeys.systemLogs(params),
    queryFn: () => fetchSystemLogs(params),
    staleTime: 30 * 1000,
  })
}

// ==================== Roles ====================

export function useRoles() {
  return useQuery({
    queryKey: adminManageKeys.roles(),
    queryFn: fetchRoles,
    staleTime: 60 * 1000,
  })
}

export function useCreateRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: AdminRoleCreatePayload) => createRole(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminManageKeys.roles() })
    },
  })
}

export function useUpdateRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AdminRoleUpdatePayload }) =>
      updateRole(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminManageKeys.roles() })
    },
  })
}

export function useDeleteRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteRole(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminManageKeys.roles() })
    },
  })
}

// ==================== Permissions ====================

export function useRolePermissions(roleId: string | null) {
  return useQuery({
    queryKey: adminManageKeys.rolePermissions(roleId!),
    queryFn: () => fetchRolePermissions(roleId!),
    enabled: !!roleId,
    staleTime: 60 * 1000,
  })
}

export function useUpdateRolePermissions() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ roleId, payload }: { roleId: string; payload: AdminRolePermissionUpdatePayload }) =>
      updateRolePermissions(roleId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: adminManageKeys.rolePermissions(variables.roleId),
      })
      queryClient.invalidateQueries({ queryKey: adminManageKeys.roles() })
    },
  })
}

// ==================== Admin Users ====================

export function useAdmins(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: adminManageKeys.admins(params),
    queryFn: () => fetchAdmins(params),
    staleTime: 30 * 1000,
  })
}

export function useCreateAdmin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: AdminUserCreatePayload) => createAdmin(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...adminManageKeys.all, 'admins'] })
    },
  })
}

export function useChangeAdminRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AdminUserRoleChangePayload }) =>
      changeAdminRole(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...adminManageKeys.all, 'admins'] })
    },
  })
}

export function useDeleteAdmin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteAdmin(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...adminManageKeys.all, 'admins'] })
    },
  })
}
