'use client'

import { useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, Button } from '@letmein/ui'
import { BarChart3, TrendingUp, MousePointerClick, Eye } from 'lucide-react'
import { useBannerStats } from '@/features/banner-editor'

interface BannerStatsProps {
  bannerId: string
}

export function BannerStats({ bannerId }: BannerStatsProps) {
  const [days, setDays] = useState(30)
  const { data, isLoading } = useBannerStats(bannerId, days)

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </CardContent>
      </Card>
    )
  }

  const bannerItems = data?.banners ?? []
  const summary = {
    totalImpressions: bannerItems.reduce((s: number, b: { impressions: number }) => s + b.impressions, 0),
    totalClicks: bannerItems.reduce((s: number, b: { clicks: number }) => s + b.clicks, 0),
    avgCtr: data?.overallCTR ?? 0,
  }
  const stats = (data?.dailyImpressions ?? []).map((d, i) => ({
    date: d.date,
    impressions: d.value,
    clicks: data?.dailyClicks?.[i]?.value ?? 0,
    ctr: d.value > 0 ? Number(((data?.dailyClicks?.[i]?.value ?? 0) / d.value * 100).toFixed(2)) : 0,
    pcClicks: 0,
    mobileClicks: 0,
  }))

  return (
    <div className="space-y-4">
      {/* 요약 카드 */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-md bg-blue-100 p-2 dark:bg-blue-900">
              <Eye className="h-5 w-5 text-blue-600 dark:text-blue-300" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">총 노출</p>
              <p className="text-xl font-bold">{summary.totalImpressions.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-md bg-green-100 p-2 dark:bg-green-900">
              <MousePointerClick className="h-5 w-5 text-green-600 dark:text-green-300" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">총 클릭</p>
              <p className="text-xl font-bold">{summary.totalClicks.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-md bg-purple-100 p-2 dark:bg-purple-900">
              <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-300" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">평균 CTR</p>
              <p className="text-xl font-bold">{summary.avgCtr}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 차트 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="h-4 w-4" />
              배너 통계
            </CardTitle>
            <div className="flex gap-1">
              {[7, 14, 30, 90].map((d) => (
                <Button
                  key={d}
                  variant={days === d ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDays(d)}
                >
                  {d}일
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {stats.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              통계 데이터가 없습니다.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={stats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(v) => {
                    const d = new Date(v)
                    return `${d.getMonth() + 1}/${d.getDate()}`
                  }}
                  fontSize={12}
                />
                <YAxis yAxisId="left" fontSize={12} />
                <YAxis yAxisId="right" orientation="right" fontSize={12} />
                <Tooltip
                  labelFormatter={(v) => `${v}`}
                  formatter={(value: number, name: string) => {
                    if (name === 'CTR') return [`${value}%`, name]
                    return [value.toLocaleString(), name]
                  }}
                />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="impressions"
                  name="노출"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="clicks"
                  name="클릭"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="ctr"
                  name="CTR"
                  stroke="#a855f7"
                  strokeWidth={2}
                  dot={false}
                  strokeDasharray="5 5"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* 디바이스별 클릭 */}
      {stats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">디바이스별 클릭</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={stats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(v) => {
                    const d = new Date(v)
                    return `${d.getMonth() + 1}/${d.getDate()}`
                  }}
                  fontSize={12}
                />
                <YAxis fontSize={12} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="pcClicks"
                  name="PC 클릭"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="mobileClicks"
                  name="모바일 클릭"
                  stroke="#f97316"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
