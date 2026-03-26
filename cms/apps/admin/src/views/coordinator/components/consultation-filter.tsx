'use client'

import type { ConsultationStatus } from '@letmein/types'

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
      <select
        value={status ?? ''}
        onChange={(e) => onStatusChange((e.target.value || undefined) as ConsultationStatus | undefined)}
        className="h-9 rounded-md border px-3 text-sm"
      >
        <option value="">전체 상태</option>
        {Object.entries(CONSULTATION_STATUSES).map(([k, v]) => (
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
