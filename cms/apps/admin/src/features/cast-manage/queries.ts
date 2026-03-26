import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { CastMemberListParams } from '@letmein/types'
import { fetchCastMembers, fetchCastMemberDetail, verifyCastMember } from './api'

export const castKeys = {
  all: ['cast-members'] as const,
  lists: () => [...castKeys.all, 'list'] as const,
  list: (params: CastMemberListParams) => [...castKeys.lists(), params] as const,
  details: () => [...castKeys.all, 'detail'] as const,
  detail: (id: number) => [...castKeys.details(), id] as const,
}

export function useCastMembers(params: CastMemberListParams) {
  return useQuery({
    queryKey: castKeys.list(params),
    queryFn: () => fetchCastMembers(params),
    placeholderData: (prev) => prev,
  })
}

export function useCastMemberDetail(id: number) {
  return useQuery({
    queryKey: castKeys.detail(id),
    queryFn: () => fetchCastMemberDetail(id),
    enabled: id > 0,
  })
}

export function useVerifyCastMember() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { status: 'verified' | 'rejected'; reason?: string } }) =>
      verifyCastMember(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: castKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: castKeys.lists() })
    },
  })
}
