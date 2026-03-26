import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { SubscriptionListParams } from '@letmein/types'
import { fetchSubscriptions, fetchSubscriptionDetail, updateSubscription } from './api'

export const subscriptionKeys = {
  all: ['subscriptions'] as const,
  lists: () => [...subscriptionKeys.all, 'list'] as const,
  list: (params: SubscriptionListParams) => [...subscriptionKeys.lists(), params] as const,
  details: () => [...subscriptionKeys.all, 'detail'] as const,
  detail: (id: number) => [...subscriptionKeys.details(), id] as const,
}

export function useSubscriptions(params: SubscriptionListParams) {
  return useQuery({
    queryKey: subscriptionKeys.list(params),
    queryFn: () => fetchSubscriptions(params),
    placeholderData: (prev) => prev,
  })
}

export function useSubscriptionDetail(id: number) {
  return useQuery({
    queryKey: subscriptionKeys.detail(id),
    queryFn: () => fetchSubscriptionDetail(id),
    enabled: id > 0,
  })
}

export function useUpdateSubscription() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { status?: string; tier?: string; expiresAt?: string } }) =>
      updateSubscription(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.lists() })
    },
  })
}
