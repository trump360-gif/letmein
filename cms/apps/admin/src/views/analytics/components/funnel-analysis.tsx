'use client'

import { useFunnelStats } from '@/features/analytics'
import { StatsCard } from '@/widgets/stats-card'
import { FunnelChart } from '@/widgets/funnel-chart'
import { Card, CardContent, CardHeader, CardTitle } from '@letmein/ui'
import { GitBranch, Target, ArrowRight } from 'lucide-react'
import type { StatsRequestParams } from '@letmein/types'

interface FunnelAnalysisProps {
  params: StatsRequestParams
}

export function FunnelAnalysis({ params }: FunnelAnalysisProps) {
  const { data, isLoading } = useFunnelStats(params)

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-lg border bg-muted" />
          ))}
        </div>
        <div className="h-[400px] animate-pulse rounded-lg border bg-muted" />
      </div>
    )
  }

  if (!data) return null

  const biggestDropoff = data.stages.reduce(
    (max, s) => (s.dropoffRate > max.dropoffRate ? s : max),
    { stage: '', label: '', dropoffRate: 0, count: 0, percentage: 0, dropoff: 0 },
  )

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <StatsCard
          title="총 방문"
          value={data.totalVisits}
          icon={GitBranch}
        />
        <StatsCard
          title="전체 전환율"
          value={`${data.overallConversion}%`}
          icon={Target}
          changeLabel="방문 -> 등급 승급"
        />
        <StatsCard
          title="최대 이탈 구간"
          value={biggestDropoff.label || '-'}
          icon={ArrowRight}
          changeLabel={biggestDropoff.dropoffRate > 0 ? `${biggestDropoff.dropoffRate}% 이탈` : ''}
        />
      </div>

      <FunnelChart
        title="퍼널 분석 (방문 -> 가입 -> 첫 게시물 -> 등급 승급)"
        stages={data.stages}
      />

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">단계별 상세</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 font-medium">단계</th>
                  <th className="pb-2 text-right font-medium">수</th>
                  <th className="pb-2 text-right font-medium">전환율</th>
                  <th className="pb-2 text-right font-medium">이탈 수</th>
                  <th className="pb-2 text-right font-medium">이탈률</th>
                </tr>
              </thead>
              <tbody>
                {data.stages.map((stage) => (
                  <tr key={stage.stage} className="border-b last:border-0">
                    <td className="py-3 font-medium">{stage.label}</td>
                    <td className="py-3 text-right">{stage.count.toLocaleString()}</td>
                    <td className="py-3 text-right">{stage.percentage}%</td>
                    <td className="py-3 text-right">{stage.dropoff.toLocaleString()}</td>
                    <td className="py-3 text-right">
                      {stage.dropoffRate > 0 ? (
                        <span className="text-red-500">{stage.dropoffRate}%</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
