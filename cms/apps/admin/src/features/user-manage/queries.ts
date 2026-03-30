import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { UserListParams } from '@letmein/types'
import {
  fetchUsers,
  fetchUserDetail,
  updateUser,
  deleteUser,
  changeUserGrade,
  processPoints,
  suspendUser,
  unsuspendUser,
} from './api'

// ==================== Query Keys ====================

export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (params: UserListParams) => [...userKeys.lists(), params] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: number) => [...userKeys.details(), id] as const,
}

// ==================== User Queries ====================

export function useUsers(params: UserListParams) {
  return useQuery({
    queryKey: userKeys.list(params),
    queryFn: () => fetchUsers(params),
    placeholderData: (prev) => prev,
  })
}

export function useUserDetail(id: number) {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => fetchUserDetail(id),
    enabled: id > 0,
  })
}

// ==================== User Mutations ====================

export function useUpdateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { nickname?: string; name?: string; phone?: string } }) =>
      updateUser(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: userKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
    },
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
    },
  })
}

export function useChangeGrade() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { grade: number; reason: string } }) =>
      changeUserGrade(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: userKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
    },
  })
}

export function useProcessPoints() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof processPoints>[1] }) =>
      processPoints(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: userKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
    },
  })
}

export function useSuspendUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { reason: string; durationDays: number } }) =>
      suspendUser(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: userKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
    },
  })
}

export function useUnsuspendUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => unsuspendUser(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: userKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
    },
  })
}
