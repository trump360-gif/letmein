'use client'

import type { ConsultationStatus } from '@letmein/types'
import { cn } from '@letmein/utils'

const CONSULTATION_STATUSES: Record<string, string> = {
  active: '대기중',
  matched: '매칭 완료',
  expired: '만료',
  cancelled: '취소',
}

interface ConsultationFilterProps {
  search: string
  onSearchChange: (v: string) => void
  status: ConsultationStatus | undefined
  onStatusChange: (v: ConsultationStatus | undefined) => void
  onReset: () => void
}

export function ConsultationFilter({ search, onSearchChange, status, onStatusChange, onReset }: ConsultationFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <input
        type="text"
        placeholder="사용자명, 카테고리로 검색..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="h-9 w-64 rounded-md border px-3 text-sm"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onStatusChange(undefined)}
          className={cn(
            'rounded-full border px-3 py-1.5 text-sm transition-colors',
            status === undefined
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border text-muted-foreground hover:border-primary/50',
          )}
        >
          전체
        </button>
        {Object.entries(CONSULTATION_STATUSES).map(([k, v]) => (
          <button
            key={k}
            type="button"
            onClick={() => onStatusChange(k as ConsultationStatus)}
            className={cn(
              'rounded-full border px-3 py-1.5 text-sm transition-colors',
              status === k
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border text-muted-foreground hover:border-primary/50',
            )}
          >
            {v}
          </button>
        ))}
      </div>
      <button
        onClick={onReset}
        className="h-9 rounded-md border px-3 text-sm text-muted-foreground hover:bg-accent"
      >
        초기화
      </button>
    </div>
  )
}
