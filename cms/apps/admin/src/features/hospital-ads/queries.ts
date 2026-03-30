import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchCredit,
  fetchCreatives,
  createCreative,
  fetchCampaigns,
  createCampaign,
  fetchCampaignReport,
  toggleCampaignPause,
} from './api'
import type { AdCampaign } from './api'

export function useAdCredit() {
  return useQuery({
    queryKey: ['ad-credit'],
    queryFn: fetchCredit,
    refetchInterval: 30_000,
  })
}

export function useAdCreatives() {
  return useQuery({
    queryKey: ['ad-creatives'],
    queryFn: () => fetchCreatives(),
  })
}

export function useCreateCreative() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ imageUrl, headline }: { imageUrl: string; headline: string }) =>
      createCreative(imageUrl, headline),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ad-creatives'] })
    },
  })
}

export function useAdCampaigns(status?: string) {
  return useQuery({
    queryKey: ['ad-campaigns', status],
    queryFn: () => fetchCampaigns(status ? { status } : undefined),
  })
}

export function useCreateCampaign() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      creativeId: number
      startDate: string
      endDate: string
      dailyBudget: number
    }) => createCampaign(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ad-campaigns'] })
      queryClient.invalidateQueries({ queryKey: ['ad-credit'] })
    },
  })
}

export function useCampaignReport(id: number, enabled: boolean) {
  return useQuery({
    queryKey: ['campaign-report', id],
    queryFn: () => fetchCampaignReport(id),
    enabled,
  })
}

export function useToggleCampaignPause() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => toggleCampaignPause(id),
    onSuccess: (updated: AdCampaign) => {
      queryClient.invalidateQueries({ queryKey: ['ad-campaigns'] })
      // Update the campaign in cache directly
      queryClient.setQueryData<{ campaigns: AdCampaign[]; total: number }>(
        ['ad-campaigns', undefined],
        (old) => {
          if (!old) return old
          return {
            ...old,
            campaigns: old.campaigns.map((c) =>
              c.id === updated.id ? { ...c, status: updated.status } : c,
            ),
          }
        },
      )
    },
  })
}
