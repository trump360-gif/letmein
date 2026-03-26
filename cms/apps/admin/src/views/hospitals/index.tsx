'use client'

import { useState, useCallback } from 'react'
import { HospitalFilter } from './components/hospital-filter'
import { HospitalTable } from './components/hospital-table'
import type { Hospital, HospitalStatus } from '@letmein/types'

const ITEMS_PER_PAGE = 20

interface HospitalsViewProps {
  hospitals: Hospital[]
  total: number
  page: number
  limit: number
  hasNext: boolean
}

export function HospitalsPage({ hospitals, total, page, limit, hasNext }: HospitalsViewProps) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<HospitalStatus | undefined>(undefined)
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const filtered = hospitals.filter((h) => {
    const matchesSearch = !search || h.name.includes(search) || (h.address ?? '').includes(search)
    const matchesStatus = !statusFilter || h.status === statusFilter
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
        <h2 className="text-2xl font-bold">병원 관리</h2>
        <p className="mt-1 text-sm text-muted-foreground">병원 등록 승인 및 관리를 합니다.</p>
      </div>

      <HospitalFilter
        search={search}
        onSearchChange={setSearch}
        status={statusFilter}
        onStatusChange={setStatusFilter}
        onReset={handleReset}
      />

      <HospitalTable
        hospitals={filtered}
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
