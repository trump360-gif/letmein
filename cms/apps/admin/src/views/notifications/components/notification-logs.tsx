'use client'

import { useState } from 'react'
import { Badge, Button, Input } from '@letmein/ui'
import { Search, Loader2 } from 'lucide-react'
import { useNotificationLogs } from '@/features/notification-send'
import {
  CHANNEL_LABELS,
  QUEUE_STATUS_LABELS,
  type NotificationChannel,
  type QueueStatus,
} from '@letmein/types'
import { useDebounce } from '@/shared/hooks/use-debounce'

const STATUS_VARIANT: Record<string, 'default' | 'destructive' | 'outline'> = {
  sent: 'default',
  failed: 'destructive',
}

export function NotificationLogs() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [channelFilter, setChannelFilter] = useState<string>('')
  const debouncedSearch = useDebounce(search, 300)

  const { data, isLoading } = useNotificationLogs({
    page,
    limit: 20,
    status: statusFilter || undefined,
    channel: channelFilter || undefined,
    search: debouncedSearch || undefined,
  })

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="이름, 이메일, 제목 검색..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground shrink-0">상태</span>
          <div className="flex flex-wrap gap-1">
            {[
              { value: '', label: '전체' },
              { value: 'sent', label: '발송완료' },
              { value: 'failed', label: '실패' },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { setStatusFilter(opt.value); setPage(1) }}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  statusFilter === opt.value
                    ? 'bg-foreground text-background'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="h-6 w-px bg-border" />

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground shrink-0">채널</span>
          <div className="flex flex-wrap gap-1">
            <button
              type="button"
              onClick={() => { setChannelFilter(''); setPage(1) }}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                channelFilter === ''
                  ? 'bg-foreground text-background'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
              }`}
            >
              전체
            </button>
            {Object.entries(CHANNEL_LABELS).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => { setChannelFilter(key); setPage(1) }}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  channelFilter === key
                    ? 'bg-foreground text-background'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : !data || data.items.length === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="text-muted-foreground">발송 이력이 없습니다.</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">ID</th>
                  <th className="px-4 py-3 text-left font-medium">수신자</th>
                  <th className="px-4 py-3 text-left font-medium">채널</th>
                  <th className="px-4 py-3 text-left font-medium">제목</th>
                  <th className="px-4 py-3 text-left font-medium">상태</th>
                  <th className="px-4 py-3 text-left font-medium">재시도</th>
                  <th className="px-4 py-3 text-left font-medium">에러</th>
                  <th className="px-4 py-3 text-left font-medium">발송일</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item) => (
                  <tr key={item.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3 font-mono text-xs">{item.id}</td>
                    <td className="px-4 py-3">
                      <div>{item.userName || '-'}</div>
                      <div className="text-xs text-muted-foreground">{item.userEmail || '-'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline">
                        {CHANNEL_LABELS[item.channel as NotificationChannel] || item.channel}
                      </Badge>
                    </td>
                    <td className="max-w-[200px] truncate px-4 py-3">{item.subject || '-'}</td>
                    <td className="px-4 py-3">
                      <Badge variant={STATUS_VARIANT[item.status] || 'outline'}>
                        {QUEUE_STATUS_LABELS[item.status as QueueStatus] || item.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center">{item.retryCount}</td>
                    <td className="max-w-[150px] truncate px-4 py-3 text-xs text-destructive">
                      {item.lastError || '-'}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {item.sentAt
                        ? new Date(item.sentAt).toLocaleString('ko-KR')
                        : new Date(item.createdAt).toLocaleString('ko-KR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data.meta && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">전체 {data.meta.total}건</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  이전
                </Button>
                <span className="flex items-center px-3 text-sm">
                  {page} / {Math.ceil(data.meta.total / 20) || 1}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!data.meta.hasNext}
                  onClick={() => setPage((p) => p + 1)}
                >
                  다음
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
