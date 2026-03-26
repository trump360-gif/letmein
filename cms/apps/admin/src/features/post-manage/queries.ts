import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchPosts, fetchPost, blindPost, deletePost, movePost, updatePost, generatePostThumbnail } from './api'
import type { PostListParams } from './api'

export const postKeys = {
  all: ['posts'] as const,
  lists: () => [...postKeys.all, 'list'] as const,
  list: (params: PostListParams) => [...postKeys.lists(), params] as const,
  details: () => [...postKeys.all, 'detail'] as const,
  detail: (id: string) => [...postKeys.details(), id] as const,
}

export function usePostList(params: PostListParams = {}) {
  return useQuery({
    queryKey: postKeys.list(params),
    queryFn: () => fetchPosts(params),
  })
}

export function usePostDetail(id: string) {
  return useQuery({
    queryKey: postKeys.detail(id),
    queryFn: () => fetchPost(id),
    enabled: !!id,
  })
}

export function useBlindPost() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => blindPost(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postKeys.all })
    },
  })
}

export function useDeletePost() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deletePost(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postKeys.all })
    },
  })
}

export function useMovePost() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, targetBoardId }: { id: string; targetBoardId: string }) =>
      movePost(id, targetBoardId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postKeys.all })
    },
  })
}

export function useUpdatePost(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: Parameters<typeof updatePost>[1]) => updatePost(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postKeys.detail(id) })
    },
  })
}

export function useGeneratePostThumbnail(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => generatePostThumbnail(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postKeys.detail(id) })
    },
  })
}
