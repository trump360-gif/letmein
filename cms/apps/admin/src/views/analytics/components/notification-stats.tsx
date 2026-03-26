'use client'

import { useNotificationStats } from '@/features/analytics'
import { StatsCard } from '@/widgets/stats-card'
import { LineChart } from '@/widgets/chart/line-chart'
import { BarChart } from '@/widgets/chart/bar-chart'
import { Bell, Mail, CheckCheck } from 'lucide-react'
import type { StatsRequestParams } from '@letmein/types'

interface NotificationStatsProps {
  params: StatsRequestParams
}

export function NotificationStats({ params }: NotificationStatsProps) {
  const { data, isLoading } = useNotificationStats(params)

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

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <StatsCard
          title="발송 수"
          value={data.totalSent}
          icon={Bell}
        />
        <StatsCard
          title="열람 수"
          value={data.totalRead}
          icon={Mail}
        />
        <StatsCard
          title="열람률"
          value={`${data.readRate}%`}
          icon={CheckCheck}
        />
      </div>

      <LineChart
        title="일별 발송 / 열람 추이"
        data={data.dailySent.map((d, i) => ({
          date: d.date,
          sent: d.value,
          read: data.dailyRead[i]?.value ?? 0,
        }))}
        series={[
          { dataKey: 'sent', name: '발송', color: '#6366f1' },
          { dataKey: 'read', name: '열람', color: '#10b981' },
        ]}
      />

      <BarChart
        title="채널별 발송/열람"
        data={data.channelDistribution.map((c) => ({
          name: c.label,
          sent: c.sent,
          read: c.read,
        }))}
        xDataKey="name"
        series={[
          { dataKey: 'sent', name: '발송', color: '#6366f1' },
          { dataKey: 'read', name: '열람', color: '#10b981' },
        ]}
      />
    </div>
  )
}
