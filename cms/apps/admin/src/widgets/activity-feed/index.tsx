'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@letmein/ui'
import { Activity } from 'lucide-react'
import { formatRelativeTime } from '@letmein/utils'

export interface ActivityItem {
  id: string
  action: string
  module: string
  targetType?: string
  targetId?: string
  adminNickname: string
  createdAt: string
}

interface ActivityFeedProps {
  items: ActivityItem[]
  loading?: boolean
}

const moduleLabels: Record<string, string> = {
  user: '회원',
  post: '게시물',
  board: '게시판',
  report: '신고',
  banner: '배너',
  menu: '메뉴',
  setting: '설정',
}

const actionLabels: Record<string, string> = {
  create: '생성',
  update: '수정',
  delete: '삭제',
  blind: '블라인드',
  approve: '승인',
  reject: '반려',
}

export function ActivityFeed({ items, loading = false }: ActivityFeedProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-4 w-4" />
            최근 활동
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse flex items-start gap-3">
                <div className="mt-1 h-2 w-2 rounded-full bg-muted" />
                <div className="flex-1 space-y-1">
                  <div className="h-4 w-3/4 rounded bg-muted" />
                  <div className="h-3 w-1/3 rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="h-4 w-4" />
          최근 활동
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">최근 활동이 없습니다.</p>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="flex items-start gap-3">
                <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm">
                    <span className="font-medium">{item.adminNickname}</span>
                    {' '}
                    <span className="text-muted-foreground">
                      {moduleLabels[item.module] ?? item.module}
                    </span>
                    {' '}
                    {actionLabels[item.action] ?? item.action}
                    {item.targetId && (
                      <span className="text-muted-foreground"> #{item.targetId}</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatRelativeTime(item.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
