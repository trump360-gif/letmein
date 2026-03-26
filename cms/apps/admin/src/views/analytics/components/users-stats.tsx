'use client'

import { useUserStats } from '@/features/analytics'
import { StatsCard } from '@/widgets/stats-card'
import { LineChart } from '@/widgets/chart/line-chart'
import { PieChart } from '@/widgets/chart/pie-chart'
import { Users, UserPlus, Activity } from 'lucide-react'
import type { StatsRequestParams } from '@letmein/types'

interface UsersStatsProps {
  params: StatsRequestParams
}

const GRADE_COLORS = [
  '#94a3b8',
  '#6366f1',
  '#f59e0b',
  '#a3a3a3',
  '#eab308',
  '#ef4444',
  '#8b5cf6',
  '#06b6d4',
  '#f97316',
  '#ec4899',
]

export function UsersStats({ params }: UsersStatsProps) {
  const { data, isLoading } = useUserStats(params)

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-lg border bg-muted" />
          ))}
        </div>
        <div className="h-[300px] animate-pulse rounded-lg border bg-muted" />
      </div>
    )
  }

  if (!data) return null

  const dauLatest = data.activeUsers.dau[data.activeUsers.dau.length - 1]?.value ?? 0

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <StatsCard
          title="전체 회원"
          value={data.totalUsers}
          icon={Users}
          changeLabel="total"
        />
        <StatsCard
          title="기간 내 신규 가입"
          value={data.periodNewUsers}
          icon={UserPlus}
          change={data.periodNewUserChange}
          changeLabel="전 기간 대비"
        />
        <StatsCard
          title="오늘 DAU"
          value={dauLatest}
          icon={Activity}
          changeLabel="활성 사용자"
        />
      </div>

      <LineChart
        title="일별 신규 가입 추이"
        data={data.dailySignups.map((d) => ({ date: d.date, value: d.value }))}
        series={[{ dataKey: 'value', name: '신규 가입', color: 'hsl(var(--primary))' }]}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <LineChart
          title="DAU / WAU / MAU 추이"
          data={data.activeUsers.dau.map((d, i) => ({
            date: d.date,
            dau: d.value,
            wau: data.activeUsers.wau[i]?.value ?? 0,
            mau: data.activeUsers.mau[i]?.value ?? 0,
          }))}
          series={[
            { dataKey: 'dau', name: 'DAU', color: '#6366f1' },
            { dataKey: 'wau', name: 'WAU', color: '#10b981' },
            { dataKey: 'mau', name: 'MAU', color: '#f59e0b' },
          ]}
        />

        <PieChart
          title="등급별 분포"
          data={data.gradeDistribution.map((g, i) => ({
            name: g.name,
            value: g.count,
            color: GRADE_COLORS[g.grade] ?? GRADE_COLORS[i % GRADE_COLORS.length],
          }))}
        />
      </div>
    </div>
  )
}
