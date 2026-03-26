import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchApiKeys, updateApiKey, testApiKey } from './api'
import type { ApiKeyUpdateRequest } from '@letmein/types'

const QUERY_KEY = ['api-keys'] as const

export function useApiKeys() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchApiKeys,
  })
}

export function useUpdateApiKey() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ service, data }: { service: string; data: ApiKeyUpdateRequest }) =>
      updateApiKey(service, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

export function useTestApiKey() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (service: string) => testApiKey(service),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}
