import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  BoardCreateInput,
  BoardUpdateInput,
  BoardReorderInput,
  BoardGroupCreateInput,
  BoardGroupUpdateInput,
} from '@letmein/types'
import {
  fetchBoardTree,
  fetchBoard,
  fetchBoardGroups,
  createBoard,
  updateBoard,
  deleteBoard,
  reorderBoards,
  createBoardGroup,
  updateBoardGroup,
  deleteBoardGroup,
} from './api'

// ==================== Query Keys ====================

export const boardKeys = {
  all: ['boards'] as const,
  tree: () => [...boardKeys.all, 'tree'] as const,
  detail: (id: string) => [...boardKeys.all, 'detail', id] as const,
  groups: () => ['board-groups'] as const,
}

// ==================== Board Tree ====================

export function useBoardTree() {
  return useQuery({
    queryKey: boardKeys.tree(),
    queryFn: fetchBoardTree,
  })
}

// ==================== Board Detail ====================

export function useBoard(id: string) {
  return useQuery({
    queryKey: boardKeys.detail(id),
    queryFn: () => fetchBoard(id),
    enabled: !!id,
  })
}

// ==================== Board Groups ====================

export function useBoardGroups() {
  return useQuery({
    queryKey: boardKeys.groups(),
    queryFn: fetchBoardGroups,
  })
}

// ==================== Mutations ====================

export function useCreateBoard() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: BoardCreateInput) => createBoard(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: boardKeys.all })
    },
  })
}

export function useUpdateBoard() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: BoardUpdateInput }) => updateBoard(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: boardKeys.tree() })
      queryClient.invalidateQueries({ queryKey: boardKeys.detail(variables.id) })
    },
  })
}

export function useDeleteBoard() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteBoard(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: boardKeys.all })
    },
  })
}

export function useReorderBoards() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: BoardReorderInput) => reorderBoards(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: boardKeys.tree() })
    },
  })
}

// ==================== Board Group Mutations ====================

export function useCreateBoardGroup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: BoardGroupCreateInput) => createBoardGroup(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: boardKeys.groups() })
      queryClient.invalidateQueries({ queryKey: boardKeys.tree() })
    },
  })
}

export function useUpdateBoardGroup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: BoardGroupUpdateInput }) => updateBoardGroup(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: boardKeys.groups() })
      queryClient.invalidateQueries({ queryKey: boardKeys.tree() })
    },
  })
}

export function useDeleteBoardGroup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteBoardGroup(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: boardKeys.groups() })
      queryClient.invalidateQueries({ queryKey: boardKeys.tree() })
    },
  })
}
