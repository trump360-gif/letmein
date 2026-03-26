'use client'

import type { HospitalStatus } from '@letmein/types'

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
      <select
        value={status ?? ''}
        onChange={(e) => onStatusChange((e.target.value || undefined) as HospitalStatus | undefined)}
        className="h-9 rounded-md border px-3 text-sm"
      >
        <option value="">전체 상태</option>
        {Object.entries(HOSPITAL_STATUSES).map(([k, v]) => (
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
