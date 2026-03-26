'use client'

import { RefreshCw } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@letmein/ui'
import { dashboardKeys } from '@/features/dashboard'
import { StatCards } from './components/stat-cards'
import { DashboardCharts } from './components/dashboard-charts'
import { TodoList } from './components/todo-list'
import { QuickActions } from './components/quick-actions'
import { RecentActivity } from './components/recent-activity'

export function DashboardPage() {
  const queryClient = useQueryClient()

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: dashboardKeys.all })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <Button variant="outline" size="sm" onClick={handleRefresh}>
          <RefreshCw className="mr-2 h-4 w-4" />
          새로고침
        </Button>
      </div>

      {/* 상단: 핵심 지표 카드 */}
      <StatCards />

      {/* 중단: 차트 */}
      <DashboardCharts />

      {/* 하단: 오늘 할 일 + 활동 피드 + 빠른 액션 */}
      <div className="grid gap-4 lg:grid-cols-3">
        <TodoList />
        <RecentActivity />
        <QuickActions />
      </div>
    </div>
  )
}
