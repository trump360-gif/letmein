'use client'

import type { CastVerificationStatus } from '@letmein/types'
import { cn } from '@letmein/utils'

const VERIFICATION_STATUSES: Record<string, string> = {
  pending: '인증 대기',
  verified: '인증됨',
  rejected: '거부됨',
}

interface CastFilterProps {
  search: string
  onSearchChange: (v: string) => void
  status: CastVerificationStatus | undefined
  onStatusChange: (v: CastVerificationStatus | undefined) => void
  onReset: () => void
}

export function CastFilter({ search, onSearchChange, status, onStatusChange, onReset }: CastFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <input
        type="text"
        placeholder="출연자명, 채널명으로 검색..."
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
        {Object.entries(VERIFICATION_STATUSES).map(([k, v]) => (
          <button
            key={k}
            type="button"
            onClick={() => onStatusChange(k as CastVerificationStatus)}
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
