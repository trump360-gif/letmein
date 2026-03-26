'use client'

import { useState } from 'react'
import { Button, Input, Badge, Card, CardContent, CardHeader, CardTitle, Dialog, DialogContent, DialogHeader, DialogTitle } from '@letmein/ui'
import { Search, AlertTriangle, Clock, Wifi, Eye } from 'lucide-react'
import { formatDateTime } from '@letmein/utils'
import { useSystemLogs } from '@/features/admin-manage'
import type { SystemLogSearchParams } from '@letmein/types'

export function SystemLogs() {
  const [params, setParams] = useState<SystemLogSearchParams>({
    page: 1,
    limit: 20,
  })
  const [filterLevel, setFilterLevel] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterSource, setFilterSource] = useState('')
  const [filterSearch, setFilterSearch] = useState('')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null)

  const { data, isLoading } = useSystemLogs(params)

  const applyFilters = () => {
    setParams({
      page: 1,
      limit: 20,
      level: filterLevel || undefined,
      type: filterType || undefined,
      source: filterSource || undefined,
      search: filterSearch || undefined,
      dateFrom: filterDateFrom || undefined,
      dateTo: filterDateTo || undefined,
    })
  }

  const clearFilters = () => {
    setFilterLevel('')
    setFilterType('')
    setFilterSource('')
    setFilterSearch('')
    setFilterDateFrom('')
    setFilterDateTo('')
    setParams({ page: 1, limit: 20 })
  }

  const levelBadge = (level: string) => {
    switch (level) {
      case 'error':
        return <Badge variant="destructive">ERROR</Badge>
      case 'warn':
        return <Badge className="bg-yellow-500 text-white hover:bg-yellow-600">WARN</Badge>
      case 'info':
        return <Badge variant="secondary">INFO</Badge>
      default:
        return <Badge variant="outline">{level}</Badge>
    }
  }

  const typeIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-destructive" />
      case 'slow_query':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'api_failure':
        return <Wifi className="h-4 w-4 text-orange-500" />
      default:
        return null
    }
  }

  const typeLabel = (type: string) => {
    switch (type) {
      case 'error':
        return '에러'
      case 'slow_query':
        return '느린 쿼리'
      case 'api_failure':
        return 'API 실패'
      default:
        return type
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">시스템 로그</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Filters - 항상 표시 */}
        <div className="mb-4 space-y-3 rounded-lg border bg-muted/30 p-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">검색어</label>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="pl-8"
                    placeholder="메시지, 소스..."
                    value={filterSearch}
                    onChange={(e) => setFilterSearch(e.target.value)}
                  />
                </div>
              </div>
              <div className="lg:col-span-2">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground shrink-0">레벨</span>
                    <div className="flex flex-wrap gap-1">
                      {[{ value: '', label: '전체' }, { value: 'error', label: 'Error' }, { value: 'warn', label: 'Warn' }, { value: 'info', label: 'Info' }].map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setFilterLevel(opt.value)}
                          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                            filterLevel === opt.value
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
                    <span className="text-xs font-medium text-muted-foreground shrink-0">유형</span>
                    <div className="flex flex-wrap gap-1">
                      {[{ value: '', label: '전체' }, { value: 'error', label: '에러' }, { value: 'slow_query', label: '느린 쿼리' }, { value: 'api_failure', label: 'API 실패' }].map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setFilterType(opt.value)}
                          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                            filterType === opt.value
                              ? 'bg-foreground text-background'
                              : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">소스</label>
                <Input
                  placeholder="소스 필터"
                  value={filterSource}
                  onChange={(e) => setFilterSource(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">시작일</label>
                <Input
                  type="date"
                  value={filterDateFrom}
                  onChange={(e) => setFilterDateFrom(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">종료일</label>
                <Input
                  type="date"
                  value={filterDateTo}
                  onChange={(e) => setFilterDateTo(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={applyFilters}>
                <Search className="mr-1 h-4 w-4" />
                검색
              </Button>
              <Button variant="outline" size="sm" onClick={clearFilters}>
                초기화
              </Button>
            </div>
          </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="whitespace-nowrap px-3 py-2">시각</th>
                <th className="whitespace-nowrap px-3 py-2">레벨</th>
                <th className="whitespace-nowrap px-3 py-2">타입</th>
                <th className="whitespace-nowrap px-3 py-2">소스</th>
                <th className="px-3 py-2">메시지</th>
                <th className="whitespace-nowrap px-3 py-2">Duration</th>
                <th className="whitespace-nowrap px-3 py-2">상세</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground">
                    로딩 중...
                  </td>
                </tr>
              ) : !data?.data?.length ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground">
                    시스템 로그가 없습니다.
                  </td>
                </tr>
              ) : (
                data.data.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b hover:bg-muted/50"
                  >
                    <td className="whitespace-nowrap px-3 py-2 text-xs">
                      {formatDateTime(log.createdAt)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2">
                      {levelBadge(log.level)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2">
                      <div className="flex items-center gap-1.5">
                        {typeIcon(log.type)}
                        <span className="text-xs">{typeLabel(log.type)}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 font-mono text-xs">
                      {log.source}
                    </td>
                    <td className="max-w-[300px] truncate px-3 py-2 text-xs">
                      {log.message}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-xs">
                      {log.duration != null ? `${log.duration}ms` : '-'}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2">
                      {(log.stackTrace || log.metadata) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedLogId(selectedLogId === log.id ? null : log.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data?.meta && (
          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <span>
              총 {data.meta.total}건 (페이지 {data.meta.page}/{Math.ceil(data.meta.total / data.meta.limit) || 1})
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={data.meta.page <= 1}
                onClick={() => setParams((p) => ({ ...p, page: (p.page || 1) - 1 }))}
              >
                이전
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!data.meta.hasNext}
                onClick={() => setParams((p) => ({ ...p, page: (p.page || 1) + 1 }))}
              >
                다음
              </Button>
            </div>
          </div>
        )}
        {/* System Log Detail Dialog */}
        {selectedLogId && data?.data && (() => {
          const log = data.data.find((l) => l.id === selectedLogId)
          if (!log) return null
          return (
            <Dialog open={!!selectedLogId} onOpenChange={(isOpen) => !isOpen && setSelectedLogId(null)}>
              <DialogContent className="max-h-[80vh] max-w-3xl overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>시스템 로그 상세</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 text-sm">
                  <div className="grid grid-cols-2 gap-3 rounded-lg border bg-muted/30 p-4">
                    <div>
                      <span className="text-muted-foreground">시각:</span>{' '}
                      <span className="font-medium">{formatDateTime(log.createdAt)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">레벨:</span>{' '}
                      {levelBadge(log.level)}
                    </div>
                    <div>
                      <span className="text-muted-foreground">타입:</span>{' '}
                      <span className="font-medium">{typeLabel(log.type)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">소스:</span>{' '}
                      <span className="font-mono text-xs">{log.source}</span>
                    </div>
                    {log.duration != null && (
                      <div>
                        <span className="text-muted-foreground">Duration:</span>{' '}
                        <span className="font-medium">{log.duration}ms</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <strong>메시지:</strong>
                    <p className="mt-1">{log.message}</p>
                  </div>
                  {log.stackTrace && (
                    <div>
                      <strong>스택 트레이스:</strong>
                      <pre className="mt-1 overflow-x-auto rounded border bg-black/5 p-2 font-mono text-[11px] dark:bg-white/5">
                        {log.stackTrace}
                      </pre>
                    </div>
                  )}
                  {log.metadata && (
                    <div>
                      <strong>메타데이터:</strong>
                      <pre className="mt-1 overflow-x-auto rounded border bg-black/5 p-2 font-mono text-[11px] dark:bg-white/5">
                        {JSON.stringify(log.metadata, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          )
        })()}
      </CardContent>
    </Card>
  )
}
