'use client'

import type { HospitalStatus } from '@letmein/types'
import { cn } from '@letmein/utils'

const HOSPITAL_STATUSES: Record<string, string> = {
  pending: '승인 대기',
  approved: '승인됨',
  rejected: '거부됨',
  suspended: '정지됨',
}

interface HospitalFilterProps {
  search: string
  onSearchChange: (v: string) => void
  status: HospitalStatus | undefined
  onStatusChange: (v: HospitalStatus | undefined) => void
  onReset: () => void
}

export function HospitalFilter({ search, onSearchChange, status, onStatusChange, onReset }: HospitalFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <input
        type="text"
        placeholder="병원명, 주소로 검색..."
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
        {Object.entries(HOSPITAL_STATUSES).map(([k, v]) => (
          <button
            key={k}
            type="button"
            onClick={() => onStatusChange(k as HospitalStatus)}
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
