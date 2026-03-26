'use client'

import type { CastVerificationStatus } from '@letmein/types'

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
      <select
        value={status ?? ''}
        onChange={(e) => onStatusChange((e.target.value || undefined) as CastVerificationStatus | undefined)}
        className="h-9 rounded-md border px-3 text-sm"
      >
        <option value="">전체 상태</option>
        {Object.entries(VERIFICATION_STATUSES).map(([k, v]) => (
          <option key={k} value={k}>{v}</option>
        ))}
      </select>
      <button
        onClick={onReset}
        className="h-9 rounded-md border px-3 text-sm text-muted-foreground hover:bg-accent"
      >
        초기화
      </button>
    </div>
  )
}
