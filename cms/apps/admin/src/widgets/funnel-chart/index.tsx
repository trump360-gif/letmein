'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@letmein/ui'
import { cn } from '@letmein/utils'
import type { FunnelStageData } from '@letmein/types'

interface FunnelChartProps {
  title?: string
  stages: FunnelStageData[]
  className?: string
}

const STAGE_COLORS = [
  'bg-blue-500',
  'bg-indigo-500',
  'bg-violet-500',
  'bg-purple-500',
  'bg-fuchsia-500',
  'bg-pink-500',
]

export function FunnelChart({ title, stages, className }: FunnelChartProps) {
  const maxCount = Math.max(...stages.map((s) => s.count), 1)

  return (
    <Card className={className}>
      {title && (
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent className={title ? '' : 'pt-6'}>
        <div className="space-y-3">
          {stages.map((stage, index) => {
            const widthPercent = (stage.count / maxCount) * 100

            return (
              <div key={stage.stage}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{stage.label}</span>
                    <span className="text-muted-foreground">
                      {stage.count.toLocaleString()}명
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-muted-foreground">{stage.percentage}%</span>
                    {index > 0 && stage.dropoffRate > 0 && (
                      <span className="text-red-500">
                        -{stage.dropoffRate}% 이탈
                      </span>
                    )}
                  </div>
                </div>
                <div className="h-8 w-full rounded-md bg-muted">
                  <div
                    className={cn(
                      'h-full rounded-md transition-all duration-500',
                      STAGE_COLORS[index % STAGE_COLORS.length],
                    )}
                    style={{ width: `${Math.max(widthPercent, 2)}%` }}
                  />
                </div>
                {index < stages.length - 1 && (
                  <div className="ml-4 flex items-center py-1">
                    <div className="h-4 w-px bg-muted-foreground/30" />
                    {stage.dropoff > 0 && (
                      <span className="ml-2 text-[10px] text-muted-foreground">
                        {stage.dropoff.toLocaleString()}명 이탈
                      </span>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
