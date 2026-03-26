'use client'

import { useTransition } from 'react'
import { cn } from '@letmein/utils'
import type { HospitalSubscription } from '@letmein/types'

const TIER_COLORS: Record<string, string> = {
  basic: 'bg-gray-100 text-gray-800',
  standard: 'bg-blue-100 text-blue-800',
  premium: 'bg-purple-100 text-purple-800',
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  expired: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
}

const STATUS_LABELS: Record<string, string> = {
  active: '활성',
  expired: '만료',
  cancelled: '취소',
}

interface SubscriptionTableProps {
  subscriptions: HospitalSubscription[]
  total: number
  page: number
  limit: number
  hasNext: boolean
  sortBy: string
  sortOrder: 'asc' | 'desc'
  onSortChange: (field: string) => void
  onPageChange: (page: number) => void
  isLoading?: boolean
  onCancel?: (id: number) => Promise<void>
}

export function SubscriptionTable({
  subscriptions,
  total,
  page,
  limit,
  hasNext,
  sortBy,
  sortOrder,
  onSortChange,
  onPageChange,
  isLoading = false,
  onCancel,
}: SubscriptionTableProps) {
  const [isPending, startTransition] = useTransition()

  const handleCancel = (id: number) => {
    if (!onCancel) return
    startTransition(async () => { await onCancel(id) })
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
    <div className="rounded-lg border" data-testid="subscription-table">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">병원</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">티어</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">상태</th>
              <SortHeader field="monthlyPrice">월 금액</SortHeader>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">시작일</th>
              <SortHeader field="expiresAt">만료일</SortHeader>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">액션</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {subscriptions.map((sub) => (
              <tr key={sub.id} className="hover:bg-muted/30">
                <td className="px-4 py-3 text-sm">{sub.id}</td>
                <td className="px-4 py-3 text-sm font-medium">{sub.hospitalName ?? `Hospital#${sub.hospitalId}`}</td>
                <td className="px-4 py-3">
                  <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium capitalize', TIER_COLORS[sub.tier] ?? 'bg-gray-100')}>
                    {sub.tier}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', STATUS_COLORS[sub.status] ?? 'bg-gray-100')}>
                    {STATUS_LABELS[sub.status] ?? sub.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">{sub.monthlyPrice.toLocaleString()}원</td>
                <td className="px-4 py-3 text-sm">{new Date(sub.startedAt).toLocaleDateString('ko-KR')}</td>
                <td className="px-4 py-3 text-sm">{new Date(sub.expiresAt).toLocaleDateString('ko-KR')}</td>
                <td className="px-4 py-3">
                  {sub.status === 'active' && (
                    <button
                      data-testid={`cancel-subscription-${sub.id}`}
                      onClick={() => handleCancel(sub.id)}
                      disabled={isPending || !onCancel}
                      className="h-7 rounded border px-2 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      해지
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {subscriptions.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                  구독 내역이 없습니다.
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
