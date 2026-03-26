'use client'

import { useState } from 'react'
import { Button, Input, Badge, Card, CardContent, CardHeader, CardTitle } from '@letmein/ui'
import { Search } from 'lucide-react'
import { formatDateTime } from '@letmein/utils'
import { useLoginHistory } from '@/features/admin-manage'
import type { AdminLoginHistorySearchParams } from '@letmein/types'

export function LoginHistory() {
  const [params, setParams] = useState<AdminLoginHistorySearchParams>({
    page: 1,
    limit: 20,
  })
  const [filterAdminId, setFilterAdminId] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterIp, setFilterIp] = useState('')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')

  const { data, isLoading } = useLoginHistory(params)

  const applyFilters = () => {
    setParams({
      page: 1,
      limit: 20,
      adminId: filterAdminId || undefined,
      status: filterStatus || undefined,
      ipAddress: filterIp || undefined,
      dateFrom: filterDateFrom || undefined,
      dateTo: filterDateTo || undefined,
    })
  }

  const clearFilters = () => {
    setFilterAdminId('')
    setFilterStatus('')
    setFilterIp('')
    setFilterDateFrom('')
    setFilterDateTo('')
    setParams({ page: 1, limit: 20 })
  }

  const statusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="default">성공</Badge>
      case 'failed':
        return <Badge variant="destructive">실패</Badge>
      case 'blocked':
        return <Badge variant="destructive">차단</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">로그인 이력</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Filters - 항상 표시 */}
        <div className="mb-4 space-y-3 rounded-lg border bg-muted/30 p-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">관리자 ID</label>
                <Input
                  placeholder="관리자 ID"
                  value={filterAdminId}
                  onChange={(e) => setFilterAdminId(e.target.value)}
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground shrink-0">상태</span>
                  <div className="flex flex-wrap gap-1">
                    {[{ value: '', label: '전체' }, { value: 'success', label: '성공' }, { value: 'failed', label: '실패' }, { value: 'blocked', label: '차단' }].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setFilterStatus(opt.value)}
                        className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                          filterStatus === opt.value
                            ? 'bg-foreground text-background'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">IP 주소</label>
                <Input
                  placeholder="IP 주소"
                  value={filterIp}
                  onChange={(e) => setFilterIp(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">시작일</label>
                <Input
                  type="date"
                  value={filterDateFrom}
                  onChange={(e) => setFilterDateFrom(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">종료일</label>
                <Input
                  type="date"
                  value={filterDateTo}
                  onChange={(e) => setFilterDateTo(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={applyFilters}>
                <Search className="mr-1 h-4 w-4" />
                검색
              </Button>
              <Button variant="outline" size="sm" onClick={clearFilters}>
                초기화
              </Button>
            </div>
          </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="whitespace-nowrap px-3 py-2">시각</th>
                <th className="whitespace-nowrap px-3 py-2">관리자</th>
                <th className="whitespace-nowrap px-3 py-2">IP 주소</th>
                <th className="whitespace-nowrap px-3 py-2">상태</th>
                <th className="whitespace-nowrap px-3 py-2">새 IP</th>
                <th className="whitespace-nowrap px-3 py-2">User Agent</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground">
                    로딩 중...
                  </td>
                </tr>
              ) : !data?.data?.length ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground">
                    로그인 이력이 없습니다.
                  </td>
                </tr>
              ) : (
                data.data.map((h) => (
                  <tr key={h.id} className="border-b hover:bg-muted/50">
                    <td className="whitespace-nowrap px-3 py-2 text-xs">
                      {formatDateTime(h.createdAt)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2">
                      <div className="font-medium">{h.adminNickname}</div>
                      <div className="text-xs text-muted-foreground">{h.adminEmail}</div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 font-mono text-xs">
                      {h.ipAddress}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2">{statusBadge(h.status)}</td>
                    <td className="whitespace-nowrap px-3 py-2">
                      {h.isNewIp && (
                        <Badge variant="destructive" className="text-[10px]">
                          NEW IP
                        </Badge>
                      )}
                    </td>
                    <td className="max-w-[200px] truncate px-3 py-2 text-xs text-muted-foreground">
                      {h.userAgent}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data?.meta && (
          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <span>
              총 {data.meta.total}건 (페이지 {data.meta.page}/{Math.ceil(data.meta.total / data.meta.limit) || 1})
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={data.meta.page <= 1}
                onClick={() => setParams((p) => ({ ...p, page: (p.page || 1) - 1 }))}
              >
                이전
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!data.meta.hasNext}
                onClick={() => setParams((p) => ({ ...p, page: (p.page || 1) + 1 }))}
              >
                다음
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
