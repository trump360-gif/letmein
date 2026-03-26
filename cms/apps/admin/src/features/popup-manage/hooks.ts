import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { PopupCreateInput, PopupUpdateInput } from '@letmein/types'
import { fetchPopups, createPopup, updatePopup, deletePopup, togglePopup } from './api'

export const popupKeys = {
  all: ['popups'] as const,
  list: (params?: Record<string, string | number | undefined>) =>
    ['popups', 'list', params] as const,
}

export function usePopups(params?: {
  isActive?: string
  page?: number
  limit?: number
}) {
  return useQuery({
    queryKey: popupKeys.list(params),
    queryFn: () => fetchPopups(params),
  })
}

export function useCreatePopup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: PopupCreateInput) => createPopup(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: popupKeys.all })
    },
  })
}

export function useUpdatePopup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: PopupUpdateInput }) =>
      updatePopup(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: popupKeys.all })
    },
  })
}

export function useDeletePopup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deletePopup(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: popupKeys.all })
    },
  })
}

export function useTogglePopup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => togglePopup(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: popupKeys.all })
    },
  })
}
