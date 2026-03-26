'use client'

import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@letmein/ui'
import { USER_STATUS, USER_GRADES } from '@/shared/lib/constants'
import type { User } from '@letmein/types'

interface UserTableProps {
  users: User[]
  total: number
  page: number
  limit: number
  hasNext: boolean
  sortBy: string
  sortOrder: 'asc' | 'desc'
  onSortChange: (field: string) => void
  onPageChange: (page: number) => void
  isLoading: boolean
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  dormant: 'bg-yellow-100 text-yellow-800',
  suspended: 'bg-red-100 text-red-800',
  withdrawn: 'bg-gray-100 text-gray-800',
}

const GRADE_COLORS: Record<number, string> = {
  0: 'bg-gray-100 text-gray-600',
  1: 'bg-blue-100 text-blue-700',
  2: 'bg-amber-100 text-amber-700',
  3: 'bg-slate-200 text-slate-700',
  4: 'bg-yellow-200 text-yellow-800',
  5: 'bg-purple-200 text-purple-800',
  9: 'bg-red-200 text-red-800',
}

function SortHeader({
  label,
  field,
  currentSort,
  currentOrder,
  onSort,
}: {
  label: string
  field: string
  currentSort: string
  currentOrder: string
  onSort: (field: string) => void
}) {
  const isActive = currentSort === field
  return (
    <button
      onClick={() => onSort(field)}
      className="inline-flex items-center gap-1 font-medium hover:text-foreground"
    >
      {label}
      <ArrowUpDown
        className={`h-3.5 w-3.5 ${isActive ? 'text-foreground' : 'text-muted-foreground/50'}`}
      />
      {isActive && <span className="text-xs">{currentOrder === 'asc' ? '\u2191' : '\u2193'}</span>}
    </button>
  )
}

export function UserTable({
  users,
  total,
  page,
  limit,
  hasNext,
  sortBy,
  sortOrder,
  onSortChange,
  onPageChange,
  isLoading,
}: UserTableProps) {
  const router = useRouter()
  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">ID</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">닉네임</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">이메일</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  <SortHeader label="등급" field="grade" currentSort={sortBy} currentOrder={sortOrder} onSort={onSortChange} />
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  <SortHeader label="포인트" field="points" currentSort={sortBy} currentOrder={sortOrder} onSort={onSortChange} />
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">상태</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  <SortHeader label="가입일" field="createdAt" currentSort={sortBy} currentOrder={sortOrder} onSort={onSortChange} />
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  <SortHeader label="최근 로그인" field="lastLoginAt" currentSort={sortBy} currentOrder={sortOrder} onSort={onSortChange} />
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                    로딩 중...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                    검색 결과가 없습니다.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b transition-colors hover:bg-muted/30 cursor-pointer"
                    onClick={() => router.push(`/members/users/${user.id}`)}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{user.id}</td>
                    <td className="px-4 py-3 font-medium">{user.nickname}</td>
                    <td className="px-4 py-3 text-muted-foreground">{user.email || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${GRADE_COLORS[user.grade] || 'bg-gray-100 text-gray-600'}`}>
                        {USER_GRADES[user.grade] || `Lv.${user.grade}`}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono">{user.points.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[user.status] || ''}`}>
                        {USER_STATUS[user.status as keyof typeof USER_STATUS] || user.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {format(new Date(user.createdAt), 'yyyy.MM.dd')}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {user.lastLoginAt
                        ? format(new Date(user.lastLoginAt), 'yyyy.MM.dd HH:mm')
                        : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          총 <span className="font-medium text-foreground">{total.toLocaleString()}</span>명
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
            이전
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number
              if (totalPages <= 5) {
                pageNum = i + 1
              } else if (page <= 3) {
                pageNum = i + 1
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i
              } else {
                pageNum = page - 2 + i
              }
              return (
                <Button
                  key={pageNum}
                  variant={pageNum === page ? 'default' : 'outline'}
                  size="sm"
                  className="w-9"
                  onClick={() => onPageChange(pageNum)}
                >
                  {pageNum}
                </Button>
              )
            })}
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={!hasNext}
            onClick={() => onPageChange(page + 1)}
          >
            다음
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
