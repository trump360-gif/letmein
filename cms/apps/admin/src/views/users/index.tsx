'use client'

import { useState, useCallback } from 'react'
import { useDebounce } from '@/shared/hooks/use-debounce'
import { ITEMS_PER_PAGE } from '@/shared/lib/constants'
import { useUsers } from '@/features/user-manage'
import { UserFilter } from './components/user-filter'
import { UserTable } from './components/user-table'
import type { UserStatus } from '@letmein/types'

export function UsersPage() {
  const [search, setSearch] = useState('')
  const [grade, setGrade] = useState<number | undefined>(undefined)
  const [status, setStatus] = useState<UserStatus | undefined>(undefined)
  const [joinFrom, setJoinFrom] = useState('')
  const [joinTo, setJoinTo] = useState('')
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const debouncedSearch = useDebounce(search, 300)

  const { data, isLoading } = useUsers({
    page,
    limit: ITEMS_PER_PAGE,
    search: debouncedSearch,
    grade,
    status,
    sortBy: sortBy as 'createdAt' | 'lastLoginAt' | 'points' | 'grade',
    sortOrder,
    joinFrom: joinFrom || undefined,
    joinTo: joinTo || undefined,
  })

  const handleSortChange = useCallback((field: string) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
    setPage(1)
  }, [sortBy])

  const handleReset = useCallback(() => {
    setSearch('')
    setGrade(undefined)
    setStatus(undefined)
    setJoinFrom('')
    setJoinTo('')
    setPage(1)
    setSortBy('createdAt')
    setSortOrder('desc')
  }, [])

  return (
    <div className="space-y-6">
      <UserFilter
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1) }}
        grade={grade}
        onGradeChange={(v) => { setGrade(v); setPage(1) }}
        status={status}
        onStatusChange={(v) => { setStatus(v); setPage(1) }}
        joinFrom={joinFrom}
        onJoinFromChange={(v) => { setJoinFrom(v); setPage(1) }}
        joinTo={joinTo}
        onJoinToChange={(v) => { setJoinTo(v); setPage(1) }}
        onReset={handleReset}
      />

      <UserTable
        users={data?.users ?? []}
        total={data?.total ?? 0}
        page={data?.page ?? page}
        limit={data?.limit ?? ITEMS_PER_PAGE}
        hasNext={data?.hasNext ?? false}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={handleSortChange}
        onPageChange={setPage}
        isLoading={isLoading}
      />
    </div>
  )
}

