'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/shared/api/client'
import { ActivityFeed, type ActivityItem } from '@/widgets/activity-feed'

async function fetchRecentActivity(): Promise<ActivityItem[]> {
  // AdminActivityLog에서 최근 활동을 조회
  // 별도 API가 없으므로 직접 호출 (향후 분리 가능)
  try {
    const res = await api
      .get('admin/dashboard/activity')
      .json<{ success: boolean; data: { items: ActivityItem[] } }>()
    return res.data.items
  } catch {
    // activity API가 없는 경우 빈 배열 반환
    return []
  }
}

export function RecentActivity() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', 'activity'],
    queryFn: fetchRecentActivity,
    refetchInterval: 60 * 1000,
    staleTime: 30 * 1000,
  })

  return <ActivityFeed items={data ?? []} loading={isLoading} />
}
