'use client'

import { useState, useTransition } from 'react'
import { cn } from '@letmein/utils'
import type { CastMember } from '@letmein/types'
import { verifyCastMember, rejectCastMember } from '@/app/(dashboard)/cast-members/actions'

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  verified: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
}

const STATUS_LABELS: Record<string, string> = {
  pending: '인증 대기',
  verified: '인증됨',
  rejected: '거부됨',
}

interface CastTableProps {
  members: CastMember[]
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

export function CastTable({
  members,
  total,
  page,
  limit,
  hasNext,
  sortBy,
  sortOrder,
  onSortChange,
  onPageChange,
  isLoading = false,
}: CastTableProps) {
  const [isPending, startTransition] = useTransition()
  const [rejectingId, setRejectingId] = useState<number | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const handleVerify = (id: number) => {
    startTransition(async () => { await verifyCastMember(id) })
  }

  const handleRejectConfirm = (id: number) => {
    startTransition(async () => {
      await rejectCastMember(id, rejectReason || '관리자 거부')
      setRejectingId(null)
      setRejectReason('')
    })
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
    <div className="rounded-lg border" data-testid="cast-table">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">활동명</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">YouTube</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">상태</th>
              <SortHeader field="followerCount">팔로워</SortHeader>
              <SortHeader field="storyCount">스토리</SortHeader>
              <SortHeader field="createdAt">등록일</SortHeader>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">액션</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {members.map((m) => (
              <tr key={m.id} className="hover:bg-muted/30" data-testid={`cast-row-${m.id}`}>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{m.id}</td>
                <td className="px-4 py-3 text-sm font-medium">{m.displayName}</td>
                <td className="px-4 py-3 text-sm">
                  {m.youtubeChannelUrl ? (
                    <a
                      href={m.youtubeChannelUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      채널 링크
                    </a>
                  ) : (
                    '-'
                  )}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-xs font-medium',
                      STATUS_COLORS[m.verificationStatus] ?? 'bg-gray-100',
                    )}
                  >
                    {STATUS_LABELS[m.verificationStatus] ?? m.verificationStatus}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">{m.followerCount.toLocaleString()}</td>
                <td className="px-4 py-3 text-sm">{m.storyCount}</td>
                <td className="px-4 py-3 text-sm">{new Date(m.createdAt).toLocaleDateString('ko-KR')}</td>
                <td className="px-4 py-3">
                  {m.verificationStatus === 'pending' && (
                    <div className="flex flex-col gap-1">
                      {rejectingId === m.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            placeholder="거부 사유"
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            data-testid={`reject-reason-${m.id}`}
                            className="h-7 w-32 rounded border px-2 text-xs"
                          />
                          <button
                            onClick={() => handleRejectConfirm(m.id)}
                            disabled={isPending}
                            data-testid={`reject-confirm-${m.id}`}
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
                            onClick={() => handleVerify(m.id)}
                            disabled={isPending}
                            data-testid={`verify-cast-${m.id}`}
                            className="h-7 rounded bg-green-600 px-2 text-xs text-white hover:bg-green-700 disabled:opacity-50"
                          >
                            인증
                          </button>
                          <button
                            onClick={() => setRejectingId(m.id)}
                            data-testid={`reject-cast-${m.id}`}
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
            {members.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                  출연자가 없습니다.
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
