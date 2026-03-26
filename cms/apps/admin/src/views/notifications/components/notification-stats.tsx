'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@letmein/ui'
import { Loader2, TrendingUp, TrendingDown, Clock } from 'lucide-react'
import { useNotificationStats } from '@/features/notification-send'
import { CHANNEL_LABELS, type NotificationChannel } from '@letmein/types'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts'

export function NotificationStats() {
  const [days, setDays] = useState(30)
  const { data: stats, isLoading } = useNotificationStats(days)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center">
        <p className="text-muted-foreground">통계 데이터가 없습니다.</p>
      </div>
    )
  }

  const channelChartData = stats.byChannel.map((c) => ({
    name: CHANNEL_LABELS[c.channel as NotificationChannel] || c.channel,
    발송: c.sent,
    실패: c.failed,
    대기: c.pending,
  }))

  const dailyChartData = stats.byDay.map((d) => ({
    date: d.date.substring(5), // MM-DD
    발송: d.sent,
    실패: d.failed,
  }))

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">기간:</span>
        {[7, 14, 30, 90].map((d) => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
              days === d
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-accent'
            }`}
          >
            {d}일
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">발송 완료</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSent.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">발송 실패</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {stats.totalFailed.toLocaleString()}
            </div>
            {stats.totalSent > 0 && (
              <p className="text-xs text-muted-foreground">
                실패율: {((stats.totalFailed / (stats.totalSent + stats.totalFailed)) * 100).toFixed(1)}%
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">대기 중</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPending.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Channel Distribution Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">채널별 발송 현황</CardTitle>
        </CardHeader>
        <CardContent>
          {channelChartData.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">데이터가 없습니다.</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={channelChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="발송" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="실패" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="대기" fill="#eab308" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Daily Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">일별 발송 추이</CardTitle>
        </CardHeader>
        <CardContent>
          {dailyChartData.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">데이터가 없습니다.</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="발송" stroke="#22c55e" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="실패" stroke="#ef4444" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Channel Detail Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">채널별 상세</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-2 text-left font-medium">채널</th>
                  <th className="px-4 py-2 text-right font-medium">발송</th>
                  <th className="px-4 py-2 text-right font-medium">실패</th>
                  <th className="px-4 py-2 text-right font-medium">대기</th>
                  <th className="px-4 py-2 text-right font-medium">성공률</th>
                </tr>
              </thead>
              <tbody>
                {stats.byChannel.map((c) => {
                  const total = c.sent + c.failed
                  const rate = total > 0 ? ((c.sent / total) * 100).toFixed(1) : '-'
                  return (
                    <tr key={c.channel} className="border-b last:border-0">
                      <td className="px-4 py-2">
                        <Badge variant="outline">
                          {CHANNEL_LABELS[c.channel as NotificationChannel] || c.channel}
                        </Badge>
                      </td>
                      <td className="px-4 py-2 text-right text-green-600">{c.sent.toLocaleString()}</td>
                      <td className="px-4 py-2 text-right text-destructive">{c.failed.toLocaleString()}</td>
                      <td className="px-4 py-2 text-right text-yellow-600">{c.pending.toLocaleString()}</td>
                      <td className="px-4 py-2 text-right">{rate}%</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
