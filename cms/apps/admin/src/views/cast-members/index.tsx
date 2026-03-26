'use client'

import { useState, useCallback } from 'react'
import { CastFilter } from './components/cast-filter'
import { CastTable } from './components/cast-table'
import type { CastMember, CastVerificationStatus } from '@letmein/types'

interface CastMembersViewProps {
  members: CastMember[]
  total: number
  page: number
  limit: number
  hasNext: boolean
}

export function CastMembersPage({ members, total, page, limit, hasNext }: CastMembersViewProps) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<CastVerificationStatus | undefined>(undefined)
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const filtered = members.filter((m) => {
    const matchesSearch =
      !search ||
      m.displayName.includes(search) ||
      (m.youtubeChannelUrl ?? '').includes(search)
    const matchesStatus = !statusFilter || m.verificationStatus === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleSortChange = useCallback(
    (field: string) => {
      if (sortBy === field) {
        setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
      } else {
        setSortBy(field)
        setSortOrder('desc')
      }
    },
    [sortBy],
  )

  const handleReset = useCallback(() => {
    setSearch('')
    setStatusFilter(undefined)
    setSortBy('createdAt')
    setSortOrder('desc')
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">출연자 관리</h2>
        <p className="mt-1 text-sm text-muted-foreground">출연자 인증 요청 및 관리를 합니다.</p>
      </div>

      <CastFilter
        search={search}
        onSearchChange={setSearch}
        status={statusFilter}
        onStatusChange={setStatusFilter}
        onReset={handleReset}
      />

      <CastTable
        members={filtered}
        total={total}
        page={page}
        limit={limit}
        hasNext={hasNext}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={handleSortChange}
        onPageChange={(p) => {
          const url = new URL(window.location.href)
          url.searchParams.set('page', String(p))
          window.location.href = url.toString()
        }}
      />
    </div>
  )
}
