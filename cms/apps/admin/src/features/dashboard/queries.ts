import { useQuery } from '@tanstack/react-query'
import { fetchDashboardStats, fetchDashboardChart, fetchDashboardTodo } from './api'

// ==================== Query Keys ====================

export const dashboardKeys = {
  all: ['dashboard'] as const,
  stats: () => [...dashboardKeys.all, 'stats'] as const,
  chart: (days: number) => [...dashboardKeys.all, 'chart', days] as const,
  todo: () => [...dashboardKeys.all, 'todo'] as const,
}

// ==================== Hooks ====================

export function useDashboardStats() {
  return useQuery({
    queryKey: dashboardKeys.stats(),
    queryFn: fetchDashboardStats,
    refetchInterval: 60 * 1000, // 1분마다 자동 갱신
    staleTime: 30 * 1000,
  })
}

export function useDashboardChart(days: number = 7) {
  return useQuery({
    queryKey: dashboardKeys.chart(days),
    queryFn: () => fetchDashboardChart(days),
    staleTime: 5 * 60 * 1000, // 5분
  })
}

export function useDashboardTodo() {
  return useQuery({
    queryKey: dashboardKeys.todo(),
    queryFn: fetchDashboardTodo,
    refetchInterval: 60 * 1000, // 1분마다 자동 갱신
    staleTime: 30 * 1000,
  })
}
