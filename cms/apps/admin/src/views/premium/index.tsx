'use client'

import { useState, useCallback } from 'react'
import { SubscriptionTable } from './components/subscription-table'
import { cancelSubscription } from '@/app/(dashboard)/premium/actions'
import type { HospitalSubscription, SubscriptionTier, SubscriptionStatus } from '@letmein/types'

interface PremiumViewProps {
  subscriptions: HospitalSubscription[]
  total: number
  page: number
  limit: number
  hasNext: boolean
}

export function PremiumPage({ subscriptions, total, page, limit, hasNext }: PremiumViewProps) {
  const [search, setSearch] = useState('')
  const [tierFilter, setTierFilter] = useState<SubscriptionTier | undefined>(undefined)
  const [statusFilter, setStatusFilter] = useState<SubscriptionStatus | undefined>(undefined)
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const filtered = subscriptions.filter((s) => {
    const matchesSearch = !search || (s.hospitalName ?? '').includes(search)
    const matchesTier = !tierFilter || s.tier === tierFilter
    const matchesStatus = !statusFilter || s.status === statusFilter
    return matchesSearch && matchesTier && matchesStatus
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
    setTierFilter(undefined)
    setStatusFilter(undefined)
    setSortBy('createdAt')
    setSortOrder('desc')
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">프리미엄 관리</h2>
        <p className="mt-1 text-sm text-muted-foreground">병원 프리미엄 구독을 관리합니다.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="병원명으로 검색..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          data-testid="premium-search"
          className="h-9 w-64 rounded-md border px-3 text-sm"
        />
        <select
          value={tierFilter ?? ''}
          onChange={(e) => setTierFilter((e.target.value || undefined) as SubscriptionTier | undefined)}
          data-testid="tier-filter"
          className="h-9 rounded-md border px-3 text-sm"
        >
          <option value="">전체 티어</option>
          <option value="basic">Basic</option>
          <option value="standard">Standard</option>
          <option value="premium">Premium</option>
        </select>
        <select
          value={statusFilter ?? ''}
          onChange={(e) => setStatusFilter((e.target.value || undefined) as SubscriptionStatus | undefined)}
          data-testid="status-filter"
          className="h-9 rounded-md border px-3 text-sm"
        >
          <option value="">전체 상태</option>
          <option value="active">활성</option>
          <option value="expired">만료</option>
          <option value="cancelled">취소</option>
        </select>
        <button
          onClick={handleReset}
          className="h-9 rounded-md border px-3 text-sm text-muted-foreground hover:bg-accent"
        >
          초기화
        </button>
      </div>

      <SubscriptionTable
        subscriptions={filtered}
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
        onCancel={cancelSubscription}
      />
    </div>
  )
}
