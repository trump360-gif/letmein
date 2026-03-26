import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { AdCreativeListParams, AdReviewPayload } from '@letmein/types'
import { fetchAdCreatives, reviewAdCreative, fetchAdCampaigns } from './api'

export const adKeys = {
  all: ['ads'] as const,
  creatives: () => [...adKeys.all, 'creatives'] as const,
  creativeList: (params: AdCreativeListParams) => [...adKeys.creatives(), params] as const,
  campaigns: () => [...adKeys.all, 'campaigns'] as const,
  campaignList: (params: { page?: number; limit?: number; status?: string }) => [...adKeys.campaigns(), params] as const,
}

export function useAdCreatives(params: AdCreativeListParams) {
  return useQuery({
    queryKey: adKeys.creativeList(params),
    queryFn: () => fetchAdCreatives(params),
    placeholderData: (prev) => prev,
  })
}

export function useReviewAdCreative() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: AdReviewPayload }) => reviewAdCreative(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adKeys.creatives() })
    },
  })
}

export function useAdCampaigns(params: { page?: number; limit?: number; status?: string }) {
  return useQuery({
    queryKey: adKeys.campaignList(params),
    queryFn: () => fetchAdCampaigns(params),
    placeholderData: (prev) => prev,
  })
}
