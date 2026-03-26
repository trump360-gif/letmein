import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { MenuCreateInput, MenuUpdateInput, MenuReorderInput, MenuLocation } from '@letmein/types'
import { fetchMenus, createMenu, updateMenu, deleteMenu, reorderMenus } from './api'

export const menuKeys = {
  all: ['menus'] as const,
  list: (location?: string) => ['menus', 'list', location] as const,
}

export function useMenus(location?: MenuLocation) {
  return useQuery({
    queryKey: menuKeys.list(location),
    queryFn: () => fetchMenus(location),
  })
}

export function useCreateMenu() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: MenuCreateInput) => createMenu(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuKeys.all })
    },
  })
}

export function useUpdateMenu() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: MenuUpdateInput }) =>
      updateMenu(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuKeys.all })
    },
  })
}

export function useDeleteMenu() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteMenu(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuKeys.all })
    },
  })
}

export function useReorderMenus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: MenuReorderInput) => reorderMenus(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuKeys.all })
    },
  })
}
