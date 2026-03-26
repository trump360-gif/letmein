import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { BannerCreateInput, BannerUpdateInput, BannerGroupCreateInput } from '@letmein/types'
import {
  fetchBanners,
  fetchBanner,
  createBanner,
  updateBanner,
  deleteBanner,
  toggleBanner,
  fetchBannerStats,
  fetchBannerGroups,
  createBannerGroup,
  toggleBannerGroup,
} from './api'

export const bannerKeys = {
  all: ['banners'] as const,
  list: (params?: Record<string, string | number | undefined>) =>
    ['banners', 'list', params] as const,
  detail: (id: string) => ['banners', 'detail', id] as const,
  stats: (id: string, days?: number) => ['banners', 'stats', id, days] as const,
  groups: ['banner-groups'] as const,
}

export function useBanners(params?: {
  position?: string
  groupId?: string
  isActive?: string
  page?: number
  limit?: number
}) {
  return useQuery({
    queryKey: bannerKeys.list(params),
    queryFn: () => fetchBanners(params),
  })
}

export function useBanner(id: string) {
  return useQuery({
    queryKey: bannerKeys.detail(id),
    queryFn: () => fetchBanner(id),
    enabled: !!id,
  })
}

export function useCreateBanner() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: BannerCreateInput) => createBanner(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bannerKeys.all })
    },
  })
}

export function useUpdateBanner() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: BannerUpdateInput }) =>
      updateBanner(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: bannerKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: bannerKeys.all })
    },
  })
}

export function useDeleteBanner() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteBanner(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bannerKeys.all })
    },
  })
}

export function useToggleBanner() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => toggleBanner(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bannerKeys.all })
    },
  })
}

export function useBannerStats(id: string, days?: number) {
  return useQuery({
    queryKey: bannerKeys.stats(id, days),
    queryFn: () => fetchBannerStats(id, days),
    enabled: !!id,
  })
}

export function useBannerGroups() {
  return useQuery({
    queryKey: bannerKeys.groups,
    queryFn: () => fetchBannerGroups(),
  })
}

export function useCreateBannerGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: BannerGroupCreateInput) => createBannerGroup(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bannerKeys.groups })
    },
  })
}

export function useToggleBannerGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => toggleBannerGroup(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bannerKeys.groups })
    },
  })
}
