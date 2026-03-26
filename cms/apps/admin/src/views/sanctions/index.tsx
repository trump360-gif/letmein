'use client'

import { useState } from 'react'
import { Search, ShieldOff } from 'lucide-react'
import { Button, Input, Badge } from '@letmein/ui'
import { useSanctions, useLiftSanction } from '@/features/report-handle'
import {
  SANCTION_TYPES,
  SANCTION_TYPE_COLORS,
  ITEMS_PER_PAGE,
} from '@/shared/lib/constants'
import { useDebounce } from '@/shared/hooks/use-debounce'

export function SanctionsPage() {
  const [page, setPage] = useState(1)
  const [type, setType] = useState<string>('')
  const [activeOnly, setActiveOnly] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const debouncedSearch = useDebounce(searchInput, 300)

  const { data, isLoading, refetch } = useSanctions({
    page,
    limit: ITEMS_PER_PAGE,
    type: type || undefined,
    active: activeOnly || undefined,
    search: debouncedSearch || undefined,
  })

  const liftSanction = useLiftSanction()

  const sanctions = data?.data ?? []
  const meta = data?.meta

  const handleLift = async (id: string) => {
    if (!confirm('이 제재를 해제하시겠습니까?')) return
    await liftSanction.mutateAsync(id)
    refetch()
  }

  return (
    <div className="space-y-6">
      {meta && (
        <Badge variant="secondary">총 {meta.total}건</Badge>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="닉네임 또는 이메일 검색..."
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value)
              setPage(1)
            }}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground shrink-0">유형</span>
          <div className="flex flex-wrap gap-1">
            <button
              type="button"
              onClick={() => { setType(''); setPage(1) }}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                type === ''
                  ? 'bg-foreground text-background'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
              }`}
            >
              전체
            </button>
            {Object.entries(SANCTION_TYPES).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => { setType(value); setPage(1) }}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  type === value
                    ? 'bg-foreground text-background'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              setActiveOnly(!activeOnly)
              setPage(1)
            }}
            className={`rounded-md border px-3 py-2 text-sm transition-colors ${
              activeOnly
                ? 'border-red-500 bg-red-50 text-red-700'
                : 'border-input hover:bg-muted'
            }`}
          >
            활성만 보기
          </button>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
          로딩 중...
        </div>
      ) : sanctions.length === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
          제재 이력이 없습니다.
        </div>
      ) : (
        <div className="rounded-lg border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">ID</th>
                <th className="px-4 py-3 text-left font-medium">대상 유저</th>
                <th className="px-4 py-3 text-left font-medium">유형</th>
                <th className="px-4 py-3 text-left font-medium">사유</th>
                <th className="px-4 py-3 text-left font-medium">적용자</th>
                <th className="px-4 py-3 text-left font-medium">적용일</th>
                <th className="px-4 py-3 text-left font-medium">만료일</th>
                <th className="px-4 py-3 text-left font-medium">상태</th>
                <th className="px-4 py-3 text-left font-medium">작업</th>
              </tr>
            </thead>
            <tbody>
              {sanctions.map((sanction) => (
                <tr
                  key={sanction.id}
                  className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3 font-medium">#{sanction.id}</td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium">{sanction.userNickname}</p>
                      {sanction.userEmail && (
                        <p className="text-xs text-muted-foreground">{sanction.userEmail}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        SANCTION_TYPE_COLORS[sanction.type as keyof typeof SANCTION_TYPE_COLORS] ?? 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {SANCTION_TYPES[sanction.type as keyof typeof SANCTION_TYPES] ?? sanction.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 max-w-[200px] truncate text-muted-foreground">
                    {sanction.reason ?? '-'}
                  </td>
                  <td className="px-4 py-3">{sanction.applierNickname}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(sanction.createdAt).toLocaleDateString('ko-KR')}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {sanction.expiresAt
                      ? new Date(sanction.expiresAt).toLocaleDateString('ko-KR')
                      : '영구'}
                  </td>
                  <td className="px-4 py-3">
                    {sanction.isActive ? (
                      <Badge variant="destructive" className="text-xs">활성</Badge>
                    ) : sanction.liftedAt ? (
                      <Badge variant="secondary" className="text-xs">해제됨</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">만료</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {sanction.isActive && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleLift(sanction.id)}
                        disabled={liftSanction.isPending}
                      >
                        <ShieldOff className="h-4 w-4 mr-1" />
                        해제
                      </Button>
                    )}
                    {sanction.liftedAt && (
                      <span className="text-xs text-muted-foreground">
                        {sanction.lifterNickname}이(가) 해제
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {meta && meta.total > ITEMS_PER_PAGE && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {(page - 1) * ITEMS_PER_PAGE + 1} - {Math.min(page * ITEMS_PER_PAGE, meta.total)} / {meta.total}건
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              이전
            </Button>
            <Button variant="outline" size="sm" disabled={!meta.hasNext} onClick={() => setPage((p) => p + 1)}>
              다음
            </Button>
          </div>
        </div>
      )}

    </div>
  )
}
