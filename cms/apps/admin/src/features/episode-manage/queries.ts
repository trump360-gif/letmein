import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { EpisodeListParams, EpisodeCreatePayload } from '@letmein/types'
import { fetchEpisodes, fetchEpisodeDetail, createEpisode, updateEpisode, deleteEpisode } from './api'

export const episodeKeys = {
  all: ['episodes'] as const,
  lists: () => [...episodeKeys.all, 'list'] as const,
  list: (params: EpisodeListParams) => [...episodeKeys.lists(), params] as const,
  details: () => [...episodeKeys.all, 'detail'] as const,
  detail: (id: number) => [...episodeKeys.details(), id] as const,
}

export function useEpisodes(params: EpisodeListParams) {
  return useQuery({
    queryKey: episodeKeys.list(params),
    queryFn: () => fetchEpisodes(params),
    placeholderData: (prev) => prev,
  })
}

export function useEpisodeDetail(id: number) {
  return useQuery({
    queryKey: episodeKeys.detail(id),
    queryFn: () => fetchEpisodeDetail(id),
    enabled: id > 0,
  })
}

export function useCreateEpisode() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: EpisodeCreatePayload) => createEpisode(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: episodeKeys.lists() })
    },
  })
}

export function useUpdateEpisode() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<EpisodeCreatePayload> }) => updateEpisode(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: episodeKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: episodeKeys.lists() })
    },
  })
}

export function useDeleteEpisode() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteEpisode(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: episodeKeys.lists() })
    },
  })
}
