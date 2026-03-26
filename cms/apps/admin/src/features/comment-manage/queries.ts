import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchComments, blindComment, deleteComment } from './api'
import type { CommentListParams } from './api'

export const commentKeys = {
  all: ['comments'] as const,
  lists: () => [...commentKeys.all, 'list'] as const,
  list: (params: CommentListParams) => [...commentKeys.lists(), params] as const,
}

export function useCommentList(params: CommentListParams = {}) {
  return useQuery({
    queryKey: commentKeys.list(params),
    queryFn: () => fetchComments(params),
  })
}

export function useBlindComment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => blindComment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commentKeys.all })
    },
  })
}

export function useDeleteComment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteComment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commentKeys.all })
    },
  })
}
