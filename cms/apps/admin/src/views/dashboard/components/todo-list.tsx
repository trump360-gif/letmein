'use client'

import Link from 'next/link'
import { AlertCircle, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, Badge } from '@letmein/ui'
import { cn } from '@letmein/utils'
import { useDashboardTodo } from '@/features/dashboard'
import type { TodoItem } from '@/features/dashboard'

const urgencyConfig: Record<TodoItem['urgency'], { icon: typeof AlertCircle; color: string; badgeVariant: 'destructive' | 'default' | 'secondary' }> = {
  high: { icon: AlertCircle, color: 'text-red-600', badgeVariant: 'destructive' },
  medium: { icon: AlertTriangle, color: 'text-amber-600', badgeVariant: 'default' },
  low: { icon: CheckCircle2, color: 'text-emerald-600', badgeVariant: 'secondary' },
}

export function TodoList() {
  const { data, isLoading } = useDashboardTodo()

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">오늘 할 일</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse flex items-center justify-between rounded-md border p-3">
                <div className="h-4 w-32 rounded bg-muted" />
                <div className="h-5 w-8 rounded bg-muted" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const items = data?.items ?? []

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">오늘 할 일</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="flex items-center justify-center py-6">
            <p className="text-sm text-muted-foreground">처리할 항목이 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => {
              const config = urgencyConfig[item.urgency]
              const UrgencyIcon = config.icon

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className="flex items-center justify-between rounded-md border p-3 transition-colors hover:bg-accent"
                >
                  <div className="flex items-center gap-3">
                    <UrgencyIcon className={cn('h-4 w-4', config.color)} />
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                  <Badge variant={config.badgeVariant}>
                    {item.count}
                  </Badge>
                </Link>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
