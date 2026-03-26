'use client'

import { useReportStats } from '@/features/analytics'
import { StatsCard } from '@/widgets/stats-card'
import { LineChart } from '@/widgets/chart/line-chart'
import { PieChart } from '@/widgets/chart/pie-chart'
import { BarChart } from '@/widgets/chart/bar-chart'
import { Flag, ShieldAlert, CheckCircle } from 'lucide-react'
import type { StatsRequestParams } from '@letmein/types'

interface ReportsStatsProps {
  params: StatsRequestParams
}

const REASON_COLORS = ['#ef4444', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#10b981', '#94a3b8']

export function ReportsStats({ params }: ReportsStatsProps) {
  const { data, isLoading } = useReportStats(params)

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-lg border bg-muted" />
          ))}
        </div>
        <div className="h-[300px] animate-pulse rounded-lg border bg-muted" />
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <StatsCard
          title="전체 신고"
          value={data.totalReports}
          icon={Flag}
        />
        <StatsCard
          title="기간 내 신고"
          value={data.periodNewReports}
          icon={Flag}
          change={data.periodNewReportChange}
          changeLabel="전 기간 대비"
        />
        <StatsCard
          title="처리율"
          value={`${data.processRate}%`}
          icon={CheckCircle}
        />
        <StatsCard
          title="일 평균 신고"
          value={data.dailyReports.length > 0
            ? Math.round(data.dailyReports.reduce((s, d) => s + d.value, 0) / data.dailyReports.length)
            : 0
          }
          icon={ShieldAlert}
        />
      </div>

      <LineChart
        title="일별 신고 / 제재 추이"
        data={data.dailyReports.map((d, i) => ({
          date: d.date,
          reports: d.value,
          sanctions: data.dailySanctions[i]?.value ?? 0,
        }))}
        series={[
          { dataKey: 'reports', name: '신고', color: '#ef4444' },
          { dataKey: 'sanctions', name: '제재', color: '#f59e0b' },
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <PieChart
          title="신고 사유별 분포"
          data={data.reasonDistribution.map((r, i) => ({
            name: r.label,
            value: r.count,
            color: REASON_COLORS[i % REASON_COLORS.length],
          }))}
        />

        <BarChart
          title="처리 상태별 분포"
          data={data.statusDistribution.map((s) => ({
            name: s.label,
            value: s.count,
          }))}
          xDataKey="name"
          series={[{ dataKey: 'value', name: '건수', color: 'hsl(var(--primary))' }]}
          colors={['#f59e0b', '#10b981', '#94a3b8']}
        />
      </div>
    </div>
  )
}
