import { useQuery } from '@tanstack/react-query'
import {
  fetchStatsSummary,
  fetchUserStats,
  fetchPostStats,
  fetchReportStats,
  fetchNotificationStats,
} from './api'
import type { StatsRequestParams } from '@letmein/types'

export const statsKeys = {
  all: ['stats'] as const,
  summary: () => [...statsKeys.all, 'summary'] as const,
  users: (params?: StatsRequestParams) => [...statsKeys.all, 'users', params] as const,
  posts: (params?: StatsRequestParams) => [...statsKeys.all, 'posts', params] as const,
  reports: (params?: StatsRequestParams) => [...statsKeys.all, 'reports', params] as const,
  notifications: (params?: StatsRequestParams) =>
    [...statsKeys.all, 'notifications', params] as const,
}

export function useStatsSummary() {
  return useQuery({
    queryKey: statsKeys.summary(),
    queryFn: fetchStatsSummary,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  })
}

export function useUserStats(params?: StatsRequestParams) {
  return useQuery({
    queryKey: statsKeys.users(params),
    queryFn: () => fetchUserStats(params),
    staleTime: 60 * 1000,
  })
}

export function usePostStats(params?: StatsRequestParams) {
  return useQuery({
    queryKey: statsKeys.posts(params),
    queryFn: () => fetchPostStats(params),
    staleTime: 60 * 1000,
  })
}

export function useReportStats(params?: StatsRequestParams) {
  return useQuery({
    queryKey: statsKeys.reports(params),
    queryFn: () => fetchReportStats(params),
    staleTime: 60 * 1000,
  })
}

export function useNotificationStats(params?: StatsRequestParams) {
  return useQuery({
    queryKey: statsKeys.notifications(params),
    queryFn: () => fetchNotificationStats(params),
    staleTime: 60 * 1000,
  })
}
