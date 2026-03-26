'use client'

import { useBannerStats } from '@/features/analytics'
import { StatsCard } from '@/widgets/stats-card'
import { LineChart } from '@/widgets/chart/line-chart'
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@letmein/ui'
import { MousePointerClick, Eye, Percent } from 'lucide-react'
import type { StatsRequestParams } from '@letmein/types'

interface BannerStatsProps {
  params: StatsRequestParams
}

export function BannerStats({ params }: BannerStatsProps) {
  const { data, isLoading } = useBannerStats(params)

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

  const totalImpressions = data.banners.reduce((s, b) => s + b.impressions, 0)
  const totalClicks = data.banners.reduce((s, b) => s + b.clicks, 0)

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <StatsCard
          title="총 노출수"
          value={totalImpressions}
          icon={Eye}
        />
        <StatsCard
          title="총 클릭수"
          value={totalClicks}
          icon={MousePointerClick}
        />
        <StatsCard
          title="전체 CTR"
          value={`${data.overallCTR}%`}
          icon={Percent}
        />
      </div>

      <LineChart
        title="일별 노출 / 클릭 추이"
        data={data.dailyImpressions.map((d, i) => ({
          date: d.date,
          impressions: d.value,
          clicks: data.dailyClicks[i]?.value ?? 0,
        }))}
        series={[
          { dataKey: 'impressions', name: '노출', color: '#6366f1' },
          { dataKey: 'clicks', name: '클릭', color: '#10b981' },
        ]}
      />

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">배너별 성과</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 font-medium">배너명</th>
                  <th className="pb-2 font-medium">위치</th>
                  <th className="pb-2 text-right font-medium">노출</th>
                  <th className="pb-2 text-right font-medium">클릭</th>
                  <th className="pb-2 text-right font-medium">CTR</th>
                  <th className="pb-2 text-right font-medium">PC</th>
                  <th className="pb-2 text-right font-medium">모바일</th>
                  <th className="pb-2 text-right font-medium">A/B</th>
                </tr>
              </thead>
              <tbody>
                {data.banners.map((banner) => (
                  <tr key={banner.id} className="border-b last:border-0">
                    <td className="py-3 font-medium">{banner.name}</td>
                    <td className="py-3 text-muted-foreground">{banner.position}</td>
                    <td className="py-3 text-right">{banner.impressions.toLocaleString()}</td>
                    <td className="py-3 text-right">{banner.clicks.toLocaleString()}</td>
                    <td className="py-3 text-right font-medium">{banner.ctr}%</td>
                    <td className="py-3 text-right">{banner.pcClicks.toLocaleString()}</td>
                    <td className="py-3 text-right">{banner.mobileClicks.toLocaleString()}</td>
                    <td className="py-3 text-right">
                      {banner.abGroup ? (
                        <Badge variant="outline">{banner.abGroup}</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                  </tr>
                ))}
                {data.banners.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-muted-foreground">
                      해당 기간에 배너 데이터가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
