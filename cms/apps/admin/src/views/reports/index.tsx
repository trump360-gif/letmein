'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import { Button, Input, Badge } from '@letmein/ui'
import { useReports } from '@/features/report-handle'
import { ReportTable } from './components/report-table'
import {
  REPORT_STATUS,
  REPORT_TARGET_TYPES,
  REPORT_REASONS,
  ITEMS_PER_PAGE,
} from '@/shared/lib/constants'
import { useDebounce } from '@/shared/hooks/use-debounce'

export function ReportsPage() {
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<string>('')
  const [targetType, setTargetType] = useState<string>('')
  const [reason, setReason] = useState<string>('')
  const [searchInput, setSearchInput] = useState('')
  const debouncedSearch = useDebounce(searchInput, 300)

  const { data, isLoading } = useReports({
    page,
    limit: ITEMS_PER_PAGE,
    status: status || undefined,
    targetType: targetType || undefined,
    reason: reason || undefined,
    search: debouncedSearch || undefined,
  })

  const reports = data?.data ?? []
  const meta = data?.meta

  return (
    <div className="space-y-6">
      {meta && (
        <Badge variant="secondary">
          총 {meta.total}건
        </Badge>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="신고자 닉네임, 사유 검색..."
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value)
              setPage(1)
            }}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground shrink-0">상태</span>
          <div className="flex flex-wrap gap-1">
            <button
              type="button"
              onClick={() => { setStatus(''); setPage(1) }}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                status === ''
                  ? 'bg-foreground text-background'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
              }`}
            >
              전체
            </button>
            {Object.entries(REPORT_STATUS).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => { setStatus(value); setPage(1) }}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  status === value
                    ? 'bg-foreground text-background'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* 구분선 */}
        <div className="h-6 w-px bg-border" />

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground shrink-0">대상</span>
          <div className="flex flex-wrap gap-1">
            <button
              type="button"
              onClick={() => { setTargetType(''); setPage(1) }}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                targetType === ''
                  ? 'bg-foreground text-background'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
              }`}
            >
              전체
            </button>
            {Object.entries(REPORT_TARGET_TYPES).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => { setTargetType(value); setPage(1) }}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  targetType === value
                    ? 'bg-foreground text-background'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* 구분선 */}
        <div className="h-6 w-px bg-border" />

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground shrink-0">사유</span>
          <div className="flex flex-wrap gap-1">
            <button
              type="button"
              onClick={() => { setReason(''); setPage(1) }}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                reason === ''
                  ? 'bg-foreground text-background'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
              }`}
            >
              전체
            </button>
            {Object.entries(REPORT_REASONS).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => { setReason(value); setPage(1) }}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  reason === value
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
      <ReportTable reports={reports} isLoading={isLoading} />

      {/* Pagination */}
      {meta && meta.total > ITEMS_PER_PAGE && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {(page - 1) * ITEMS_PER_PAGE + 1} - {Math.min(page * ITEMS_PER_PAGE, meta.total)} / {meta.total}건
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              이전
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!meta.hasNext}
              onClick={() => setPage((p) => p + 1)}
            >
              다음
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
