'use client'

import { type LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'
import { Card, CardContent } from '@letmein/ui'
import { cn } from '@letmein/utils'

interface StatsCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  change?: number | null
  changeLabel?: string
  loading?: boolean
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  change,
  changeLabel,
  loading = false,
}: StatsCardProps) {
  const isPositive = change != null && change >= 0
  const hasChange = change != null

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 w-24 rounded bg-muted" />
            <div className="h-8 w-16 rounded bg-muted" />
            <div className="h-3 w-32 rounded bg-muted" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="mt-2 text-3xl font-bold">{typeof value === 'number' ? value.toLocaleString() : value}</p>
        {hasChange && (
          <div className="mt-2 flex items-center gap-1 text-xs">
            {isPositive ? (
              <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5 text-red-600" />
            )}
            <span
              className={cn(
                'font-medium',
                isPositive ? 'text-emerald-600' : 'text-red-600',
              )}
            >
              {isPositive ? '+' : ''}{change}%
            </span>
            {changeLabel && (
              <span className="text-muted-foreground">{changeLabel}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
