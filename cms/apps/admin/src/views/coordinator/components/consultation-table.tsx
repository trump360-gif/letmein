'use client'

import { useState, useTransition } from 'react'
import { cn } from '@letmein/utils'
import type { ConsultationRequest, Hospital } from '@letmein/types'
import { matchHospital, updateConsultationStatus } from '@/app/(dashboard)/coordinator/actions'

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-blue-100 text-blue-800',
  matched: 'bg-green-100 text-green-800',
  expired: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
}

const STATUS_LABELS: Record<string, string> = {
  active: '대기중',
  matched: '매칭 완료',
  expired: '만료',
  cancelled: '취소',
}

interface ConsultationTableProps {
  requests: ConsultationRequest[]
  total: number
  page: number
  limit: number
  hasNext: boolean
  sortBy: string
  sortOrder: 'asc' | 'desc'
  onSortChange: (field: string) => void
  onPageChange: (page: number) => void
  isLoading?: boolean
  hospitals: Hospital[]
}

export function ConsultationTable({
  requests,
  total,
  page,
  limit,
  hasNext,
  sortBy,
  sortOrder,
  onSortChange,
  onPageChange,
  isLoading = false,
  hospitals,
}: ConsultationTableProps) {
  const [isPending, startTransition] = useTransition()
  const [matchingId, setMatchingId] = useState<number | null>(null)
  const [selectedHospitalId, setSelectedHospitalId] = useState<number | null>(null)
  const [matchNote, setMatchNote] = useState('')

  const handleMatchConfirm = (requestId: number) => {
    if (!selectedHospitalId) return
    startTransition(async () => {
      await matchHospital(requestId, selectedHospitalId, matchNote)
      setMatchingId(null)
      setSelectedHospitalId(null)
      setMatchNote('')
    })
  }

  const handleCancel = (requestId: number) => {
    startTransition(async () => { await updateConsultationStatus(requestId, 'cancelled') })
  }

  const SortHeader = ({ field, children }: { field: string; children: React.ReactNode }) => (
    <th
      className="cursor-pointer px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground hover:text-foreground"
      onClick={() => onSortChange(field)}
    >
      {children} {sortBy === field && (sortOrder === 'asc' ? '↑' : '↓')}
    </th>
  )

  if (isLoading) {
    return <div className="py-12 text-center text-muted-foreground">로딩 중...</div>
  }

  return (
    <div className="rounded-lg border" data-testid="consultation-table">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">사용자</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">카테고리</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">상태</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">매칭</th>
              <SortHeader field="expiresAt">만료일</SortHeader>
              <SortHeader field="createdAt">등록일</SortHeader>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">액션</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {requests.map((req) => (
              <tr key={req.id} className="hover:bg-muted/30" data-testid={`consultation-row-${req.id}`}>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{req.id}</td>
                <td className="px-4 py-3 text-sm">{req.userName ?? `User#${req.userId}`}</td>
                <td className="px-4 py-3 text-sm">{req.categoryName ?? `카테고리 #${req.categoryId}`}</td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-xs font-medium',
                      STATUS_COLORS[req.status] ?? 'bg-gray-100',
                    )}
                  >
                    {STATUS_LABELS[req.status] ?? req.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">{req.matchCount ?? 0}건</td>
                <td className="px-4 py-3 text-sm">{new Date(req.expiresAt).toLocaleDateString('ko-KR')}</td>
                <td className="px-4 py-3 text-sm">{new Date(req.createdAt).toLocaleDateString('ko-KR')}</td>
                <td className="px-4 py-3">
                  {req.status === 'active' && (
                    <div className="flex flex-col gap-1">
                      {matchingId === req.id ? (
                        <div className="space-y-1">
                          <select
                            value={selectedHospitalId ?? ''}
                            onChange={(e) => setSelectedHospitalId(Number(e.target.value) || null)}
                            data-testid={`hospital-select-${req.id}`}
                            className="h-7 w-40 rounded border px-2 text-xs"
                          >
                            <option value="">병원 선택</option>
                            {hospitals.map((h) => (
                              <option key={h.id} value={h.id}>
                                {h.name}
                              </option>
                            ))}
                          </select>
                          <input
                            type="text"
                            placeholder="메모 (선택)"
                            value={matchNote}
                            onChange={(e) => setMatchNote(e.target.value)}
                            className="h-7 w-40 rounded border px-2 text-xs"
                          />
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleMatchConfirm(req.id)}
                              disabled={isPending || !selectedHospitalId}
                              data-testid={`confirm-match-${req.id}`}
                              className="h-7 rounded bg-primary px-2 text-xs text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                            >
                              확인
                            </button>
                            <button
                              onClick={() => {
                                setMatchingId(null)
                                setSelectedHospitalId(null)
                                setMatchNote('')
                              }}
                              className="h-7 rounded border px-2 text-xs hover:bg-accent"
                            >
                              취소
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-1">
                          <button
                            data-testid={`match-btn-${req.id}`}
                            onClick={() => setMatchingId(req.id)}
                            className="h-7 rounded bg-primary px-2 text-xs text-primary-foreground hover:bg-primary/90"
                          >
                            매칭
                          </button>
                          <button
                            data-testid={`cancel-btn-${req.id}`}
                            onClick={() => handleCancel(req.id)}
                            disabled={isPending}
                            className="h-7 rounded border px-2 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
                          >
                            취소
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {requests.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                  상담 요청이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t px-4 py-3">
        <span className="text-sm text-muted-foreground">
          총 {total}건 중 {total > 0 ? `${(page - 1) * limit + 1}-${Math.min(page * limit, total)}` : '0'}
        </span>
        <div className="flex gap-1">
          <button
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="h-8 rounded border px-3 text-sm disabled:opacity-50"
          >
            이전
          </button>
          <button
            disabled={!hasNext}
            onClick={() => onPageChange(page + 1)}
            className="h-8 rounded border px-3 text-sm disabled:opacity-50"
          >
            다음
          </button>
        </div>
      </div>
    </div>
  )
}
