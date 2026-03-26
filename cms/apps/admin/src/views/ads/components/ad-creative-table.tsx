'use client'

import { useState, useTransition } from 'react'
import { cn } from '@letmein/utils'
import type { AdCreative } from '@letmein/types'
import { approveAdCreative, rejectAdCreative } from '@/app/(dashboard)/ads/actions'

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
}

const STATUS_LABELS: Record<string, string> = {
  pending: '심사 대기',
  approved: '승인됨',
  rejected: '거부됨',
}

interface AdCreativeTableProps {
  creatives: AdCreative[]
  total: number
  page: number
  limit: number
  hasNext: boolean
  onPageChange: (page: number) => void
  isLoading?: boolean
}

export function AdCreativeTable({
  creatives,
  total,
  page,
  limit,
  hasNext,
  onPageChange,
  isLoading = false,
}: AdCreativeTableProps) {
  const [isPending, startTransition] = useTransition()
  const [rejectingId, setRejectingId] = useState<number | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const handleApprove = (id: number) => {
    startTransition(async () => { await approveAdCreative(id) })
  }

  const handleRejectConfirm = (id: number) => {
    startTransition(async () => {
      await rejectAdCreative(id, rejectReason)
      setRejectingId(null)
      setRejectReason('')
    })
  }

  if (isLoading) {
    return <div className="py-12 text-center text-muted-foreground">로딩 중...</div>
  }

  return (
    <div className="rounded-lg border" data-testid="ad-creative-table">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">이미지</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">헤드라인</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">병원</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">상태</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">등록일</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">액션</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {creatives.map((cr) => (
              <tr key={cr.id} className="hover:bg-muted/30">
                <td className="px-4 py-3 text-sm">{cr.id}</td>
                <td className="px-4 py-3">
                  <img src={cr.imageUrl} alt="" className="h-12 w-20 rounded object-cover" />
                </td>
                <td className="px-4 py-3 text-sm font-medium">{cr.headline}</td>
                <td className="px-4 py-3 text-sm">{cr.hospitalName ?? `Hospital#${cr.hospitalId}`}</td>
                <td className="px-4 py-3">
                  <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', STATUS_COLORS[cr.reviewStatus] ?? 'bg-gray-100')}>
                    {STATUS_LABELS[cr.reviewStatus] ?? cr.reviewStatus}
                  </span>
                  {cr.rejectionReason && (
                    <p className="mt-1 text-xs text-red-500">{cr.rejectionReason}</p>
                  )}
                </td>
                <td className="px-4 py-3 text-sm">{new Date(cr.createdAt).toLocaleDateString('ko-KR')}</td>
                <td className="px-4 py-3">
                  {cr.reviewStatus === 'pending' && (
                    <div className="flex flex-col gap-1">
                      {rejectingId === cr.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            placeholder="거부 사유"
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            data-testid={`reject-reason-${cr.id}`}
                            className="h-7 w-32 rounded border px-2 text-xs"
                          />
                          <button
                            onClick={() => handleRejectConfirm(cr.id)}
                            disabled={isPending}
                            data-testid={`reject-confirm-${cr.id}`}
                            className="h-7 rounded bg-red-600 px-2 text-xs text-white hover:bg-red-700 disabled:opacity-50"
                          >
                            확인
                          </button>
                          <button
                            onClick={() => setRejectingId(null)}
                            className="h-7 rounded border px-2 text-xs hover:bg-accent"
                          >
                            취소
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <button
                            data-testid={`approve-ad-${cr.id}`}
                            onClick={() => handleApprove(cr.id)}
                            disabled={isPending}
                            className="h-7 rounded bg-green-600 px-2 text-xs text-white hover:bg-green-700 disabled:opacity-50"
                          >
                            승인
                          </button>
                          <button
                            data-testid={`reject-ad-${cr.id}`}
                            onClick={() => setRejectingId(cr.id)}
                            className="h-7 rounded border px-2 text-xs text-red-600 hover:bg-red-50"
                          >
                            거부
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {creatives.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                  광고 소재가 없습니다.
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
