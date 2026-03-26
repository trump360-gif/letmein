'use client'

import { useState, useCallback } from 'react'
import { ConsultationFilter } from './components/consultation-filter'
import { ConsultationTable } from './components/consultation-table'
import type { ConsultationRequest, ConsultationStatus, Hospital } from '@letmein/types'

interface CoordinatorViewProps {
  requests: ConsultationRequest[]
  total: number
  page: number
  limit: number
  hasNext: boolean
  hospitals: Hospital[]
}

export function CoordinatorPage({ requests, total, page, limit, hasNext, hospitals }: CoordinatorViewProps) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<ConsultationStatus | undefined>(undefined)
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const filtered = requests.filter((r) => {
    const matchesSearch = !search || (r.userName ?? '').includes(search) || (r.description ?? '').includes(search)
    const matchesStatus = !statusFilter || r.status === statusFilter
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
        <h2 className="text-2xl font-bold">코디네이터 매칭</h2>
        <p className="mt-1 text-sm text-muted-foreground">상담 요청을 확인하고 적합한 병원과 매칭합니다.</p>
      </div>

      <ConsultationFilter
        search={search}
        onSearchChange={setSearch}
        status={statusFilter}
        onStatusChange={setStatusFilter}
        onReset={handleReset}
      />

      <ConsultationTable
        requests={filtered}
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
        hospitals={hospitals}
      />
    </div>
  )
}
