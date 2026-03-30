'use client'

import Link from 'next/link'
import { useTransition } from 'react'
import { cn } from '@letmein/utils'
import type { Hospital } from '@letmein/types'
import { approveHospital, rejectHospital, suspendHospital } from '@/app/(dashboard)/hospitals/actions'

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  suspended: 'bg-gray-100 text-gray-800',
}

const STATUS_LABELS: Record<string, string> = {
  pending: '승인 대기',
  approved: '승인됨',
  rejected: '거부됨',
  suspended: '정지됨',
}

interface HospitalTableProps {
  hospitals: Hospital[]
  total: number
  page: number
  limit: number
  hasNext: boolean
  sortBy: string
  sortOrder: 'asc' | 'desc'
  onSortChange: (field: string) => void
  onPageChange: (page: number) => void
  isLoading?: boolean
}

export function HospitalTable({
  hospitals,
  total,
  page,
  limit,
  hasNext,
  sortBy,
  sortOrder,
  onSortChange,
  onPageChange,
  isLoading = false,
}: HospitalTableProps) {
  const [isPending, startTransition] = useTransition()

  const handleApprove = (id: number) => {
    startTransition(async () => { await approveHospital(id) })
  }
  const handleReject = (id: number) => {
    startTransition(async () => { await rejectHospital(id) })
  }
  const handleSuspend = (id: number) => {
    startTransition(async () => { await suspendHospital(id) })
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
    <div className="rounded-lg border" data-testid="hospital-table">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">ID</th>
              <SortHeader field="name">병원명</SortHeader>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">주소</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">상태</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">프리미엄</th>
              <SortHeader field="caseCount">사례수</SortHeader>
              <SortHeader field="createdAt">등록일</SortHeader>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">액션</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {hospitals.map((h) => (
              <tr key={h.id} className="hover:bg-muted/30" data-testid={`hospital-row-${h.id}`}>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{h.id}</td>
                <td className="px-4 py-3 text-sm font-medium">
                  <Link
                    href={`/hospitals/${h.id}`}
                    className="hover:underline"
                    data-testid={`hospital-detail-link-${h.id}`}
                  >
                    {h.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{h.address ?? '-'}</td>
                <td className="px-4 py-3">
                  <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', STATUS_COLORS[h.status] ?? 'bg-gray-100')}>
                    {STATUS_LABELS[h.status] ?? h.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">
                  {h.isPremium ? (
                    <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800">
                      {h.premiumTier ?? 'Premium'}
                    </span>
                  ) : '-'}
                </td>
                <td className="px-4 py-3 text-sm">{h.caseCount}</td>
                <td className="px-4 py-3 text-sm">{new Date(h.createdAt).toLocaleDateString('ko-KR')}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    {h.status === 'pending' && (
                      <>
                        <button
                          data-testid={`approve-hospital-${h.id}`}
                          onClick={() => handleApprove(h.id)}
                          disabled={isPending}
                          className="h-7 rounded bg-green-600 px-2 text-xs text-white hover:bg-green-700 disabled:opacity-50"
                        >
                          승인
                        </button>
                        <button
                          data-testid={`reject-hospital-${h.id}`}
                          onClick={() => handleReject(h.id)}
                          disabled={isPending}
                          className="h-7 rounded border px-2 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                          거부
                        </button>
                      </>
                    )}
                    {h.status === 'approved' && (
                      <button
                        data-testid={`suspend-hospital-${h.id}`}
                        onClick={() => handleSuspend(h.id)}
                        disabled={isPending}
                        className="h-7 rounded border px-2 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        정지
                      </button>
                    )}
                    {h.status === 'suspended' && (
                      <button
                        data-testid={`reactivate-hospital-${h.id}`}
                        onClick={() => handleApprove(h.id)}
                        disabled={isPending}
                        className="h-7 rounded bg-green-600 px-2 text-xs text-white hover:bg-green-700 disabled:opacity-50"
                      >
                        해제
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {hospitals.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                  병원이 없습니다.
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
