'use client'

import { useState, useCallback } from 'react'
import { Button, Input, Badge, Card, CardContent, CardHeader, CardTitle } from '@letmein/ui'
import {
  Search,
  Download,
  Eye,
  X,
  Save,
  BookmarkPlus,
} from 'lucide-react'
import { formatDateTime } from '@letmein/utils'
import { useActivityLogs } from '@/features/admin-manage'
import { LogDetailDialog } from './log-detail-dialog'
import { ExportDialog } from './export-dialog'
import type {
  AdminActivityLog,
  AdminActivityLogSearchParams,
  SavedSearch,
} from '@letmein/types'
import { ADMIN_MODULES } from '@letmein/types'

const SAVED_SEARCHES_KEY = 'admin-activity-log-saved-searches'

function loadSavedSearches(): SavedSearch[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(SAVED_SEARCHES_KEY) || '[]')
  } catch {
    return []
  }
}

function saveSavedSearches(searches: SavedSearch[]) {
  localStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(searches))
}

export function ActivityLogs() {
  const [params, setParams] = useState<AdminActivityLogSearchParams>({
    page: 1,
    limit: 20,
  })
  const [selectedLog, setSelectedLog] = useState<AdminActivityLog | null>(null)
  const [showExport, setShowExport] = useState(false)
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>(loadSavedSearches)
  const [searchName, setSearchName] = useState('')
  const [showSaveInput, setShowSaveInput] = useState(false)

  // Filter state
  const [filterAdmin, setFilterAdmin] = useState('')
  const [filterAction, setFilterAction] = useState('')
  const [filterModule, setFilterModule] = useState('')
  const [filterTargetType, setFilterTargetType] = useState('')
  const [filterIp, setFilterIp] = useState('')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')
  const [filterSearch, setFilterSearch] = useState('')

  const { data, isLoading } = useActivityLogs(params)

  const applyFilters = useCallback(() => {
    setParams({
      page: 1,
      limit: 20,
      adminId: filterAdmin || undefined,
      action: filterAction || undefined,
      module: filterModule || undefined,
      targetType: filterTargetType || undefined,
      ipAddress: filterIp || undefined,
      dateFrom: filterDateFrom || undefined,
      dateTo: filterDateTo || undefined,
      search: filterSearch || undefined,
    })
  }, [filterAdmin, filterAction, filterModule, filterTargetType, filterIp, filterDateFrom, filterDateTo, filterSearch])

  const clearFilters = () => {
    setFilterAdmin('')
    setFilterAction('')
    setFilterModule('')
    setFilterTargetType('')
    setFilterIp('')
    setFilterDateFrom('')
    setFilterDateTo('')
    setFilterSearch('')
    setParams({ page: 1, limit: 20 })
  }

  const saveCurrentSearch = () => {
    if (!searchName.trim()) return
    const newSearch: SavedSearch = {
      id: Date.now().toString(),
      name: searchName.trim(),
      params: { ...params, page: undefined, limit: undefined },
    }
    const updated = [...savedSearches, newSearch]
    setSavedSearches(updated)
    saveSavedSearches(updated)
    setSearchName('')
    setShowSaveInput(false)
  }

  const loadSearch = (search: SavedSearch) => {
    const p = search.params
    setFilterAdmin(p.adminId || '')
    setFilterAction(p.action || '')
    setFilterModule(p.module || '')
    setFilterTargetType(p.targetType || '')
    setFilterIp(p.ipAddress || '')
    setFilterDateFrom(p.dateFrom || '')
    setFilterDateTo(p.dateTo || '')
    setFilterSearch(p.search || '')
    setParams({ ...p, page: 1, limit: 20 })
  }

  const removeSavedSearch = (id: string) => {
    const updated = savedSearches.filter((s) => s.id !== id)
    setSavedSearches(updated)
    saveSavedSearches(updated)
  }

  const actionBadgeVariant = (action: string) => {
    if (action.includes('delete') || action.includes('suspend')) return 'destructive' as const
    if (action.includes('create') || action.includes('approve')) return 'default' as const
    return 'secondary' as const
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">활동 로그</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowExport(true)}
            >
              <Download className="mr-1 h-4 w-4" />
              내보내기
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Saved Searches */}
        {savedSearches.length > 0 && (
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">저장된 검색:</span>
            {savedSearches.map((s) => (
              <div key={s.id} className="flex items-center gap-1">
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => loadSearch(s)}>
                  {s.name}
                </Button>
                <button
                  onClick={() => removeSavedSearch(s.id)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Filters - 항상 표시 */}
        <div className="mb-4 space-y-3 rounded-lg border bg-muted/30 p-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">검색어</label>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="pl-8"
                    placeholder="닉네임, 이메일, 액션..."
                    value={filterSearch}
                    onChange={(e) => setFilterSearch(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">관리자 ID</label>
                <Input
                  placeholder="관리자 ID"
                  value={filterAdmin}
                  onChange={(e) => setFilterAdmin(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">액션</label>
                <Input
                  placeholder="create, update, delete..."
                  value={filterAction}
                  onChange={(e) => setFilterAction(e.target.value)}
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground shrink-0">모듈</span>
                  <div className="flex flex-wrap gap-1">
                    {[{ key: '', label: '전체' }, ...ADMIN_MODULES].map((m) => (
                      <button
                        key={m.key}
                        type="button"
                        onClick={() => setFilterModule(m.key)}
                        className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                          filterModule === m.key
                            ? 'bg-foreground text-background'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">대상 타입</label>
                <Input
                  placeholder="user, post, board..."
                  value={filterTargetType}
                  onChange={(e) => setFilterTargetType(e.target.value)}
                />
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
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={applyFilters}>
                <Search className="mr-1 h-4 w-4" />
                검색
              </Button>
              <Button variant="outline" size="sm" onClick={clearFilters}>
                초기화
              </Button>
              <div className="ml-auto flex items-center gap-2">
                {showSaveInput ? (
                  <>
                    <Input
                      className="h-8 w-40"
                      placeholder="검색 이름"
                      value={searchName}
                      onChange={(e) => setSearchName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && saveCurrentSearch()}
                    />
                    <Button size="sm" variant="outline" onClick={saveCurrentSearch}>
                      <Save className="mr-1 h-3 w-3" />
                      저장
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setShowSaveInput(false)}>
                      취소
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowSaveInput(true)}
                  >
                    <BookmarkPlus className="mr-1 h-3 w-3" />
                    검색 저장
                  </Button>
                )}
              </div>
            </div>
          </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="whitespace-nowrap px-3 py-2">시각</th>
                <th className="whitespace-nowrap px-3 py-2">관리자</th>
                <th className="whitespace-nowrap px-3 py-2">액션</th>
                <th className="whitespace-nowrap px-3 py-2">모듈</th>
                <th className="whitespace-nowrap px-3 py-2">대상</th>
                <th className="whitespace-nowrap px-3 py-2">IP</th>
                <th className="whitespace-nowrap px-3 py-2">상세</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted-foreground">
                    로딩 중...
                  </td>
                </tr>
              ) : !data?.data?.length ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted-foreground">
                    활동 로그가 없습니다.
                  </td>
                </tr>
              ) : (
                data.data.map((log) => (
                  <tr key={log.id} className="border-b hover:bg-muted/50">
                    <td className="whitespace-nowrap px-3 py-2 text-xs">
                      {formatDateTime(log.createdAt)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2">
                      <div className="font-medium">{log.adminNickname}</div>
                      <div className="text-xs text-muted-foreground">{log.adminEmail}</div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2">
                      <Badge variant={actionBadgeVariant(log.action)}>
                        {log.action}
                      </Badge>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2">{log.module}</td>
                    <td className="whitespace-nowrap px-3 py-2">
                      {log.targetType && (
                        <span className="text-xs">
                          {log.targetType}
                          {log.targetId && ` #${log.targetId}`}
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-xs font-mono">
                      {log.ipAddress}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2">
                      {(log.beforeData || log.afterData) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedLog(log)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
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

        {/* Dialogs */}
        {selectedLog && (
          <LogDetailDialog
            log={selectedLog}
            open={!!selectedLog}
            onClose={() => setSelectedLog(null)}
          />
        )}

        {showExport && (
          <ExportDialog
            open={showExport}
            onClose={() => setShowExport(false)}
            currentParams={params}
          />
        )}
      </CardContent>
    </Card>
  )
}
