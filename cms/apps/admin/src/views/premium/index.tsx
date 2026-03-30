'use client'

import { useState, useCallback } from 'react'
import { SubscriptionTable } from './components/subscription-table'
import { cancelSubscription, grantSubscription } from '@/app/(dashboard)/premium/actions'
import type { HospitalSubscription, SubscriptionTier, SubscriptionStatus } from '@letmein/types'
import { cn } from '@letmein/utils'

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

  const [grantHospitalId, setGrantHospitalId] = useState('')
  const [grantTier, setGrantTier] = useState<'basic' | 'standard' | 'premium'>('basic')
  const [grantExpiresAt, setGrantExpiresAt] = useState(() => {
    const d = new Date()
    d.setFullYear(d.getFullYear() + 1)
    return d.toISOString().split('T')[0] // YYYY-MM-DD
  })
  const [isGranting, setIsGranting] = useState(false)
  const [grantError, setGrantError] = useState<string | null>(null)

  const handleGrant = async () => {
    const id = parseInt(grantHospitalId, 10)
    if (!id || isNaN(id)) { setGrantError('병원 ID를 입력하세요.'); return }
    setIsGranting(true)
    setGrantError(null)
    try {
      await grantSubscription(id, grantTier, grantExpiresAt)
      setGrantHospitalId('')
      setGrantError(null)
    } catch {
      setGrantError('구독 부여에 실패했습니다.')
    } finally {
      setIsGranting(false)
    }
  }

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

      {/* 구독 부여 섹션 */}
      <div className="rounded-lg border p-5">
        <h3 className="mb-4 text-base font-semibold">프리미엄 구독 부여</h3>
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">병원 ID</label>
            <input
              type="number"
              placeholder="예: 42"
              value={grantHospitalId}
              onChange={(e) => setGrantHospitalId(e.target.value)}
              className="h-9 w-36 rounded-md border px-3 text-sm"
              data-testid="grant-hospital-id"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">티어</label>
            <div className="flex gap-2" data-testid="grant-tier-selector">
              {(['basic', 'standard', 'premium'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setGrantTier(t)}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-sm transition-colors capitalize',
                    grantTier === t
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border text-muted-foreground hover:border-primary/50',
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">만료일</label>
            <input
              type="date"
              value={grantExpiresAt}
              onChange={(e) => setGrantExpiresAt(e.target.value)}
              className="h-9 rounded-md border px-3 text-sm"
              data-testid="grant-expires-at"
            />
          </div>
          <button
            onClick={handleGrant}
            disabled={isGranting}
            className="h-9 rounded-md bg-primary px-4 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            data-testid="grant-subscription-btn"
          >
            {isGranting ? '처리 중...' : '구독 부여'}
          </button>
        </div>
        {grantError && (
          <p className="mt-2 text-sm text-red-600" role="alert">{grantError}</p>
        )}
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
        <div className="flex gap-2" data-testid="tier-filter">
          {([['', '전체'], ['basic', 'Basic'], ['standard', 'Standard'], ['premium', 'Premium']] as [string, string][]).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setTierFilter((value || undefined) as SubscriptionTier | undefined)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-sm transition-colors',
                tierFilter === (value || undefined)
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border text-muted-foreground hover:border-primary/50',
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex gap-2" data-testid="status-filter">
          {([['', '전체'], ['active', '활성'], ['expired', '만료'], ['cancelled', '취소']] as [string, string][]).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setStatusFilter((value || undefined) as SubscriptionStatus | undefined)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-sm transition-colors',
                statusFilter === (value || undefined)
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border text-muted-foreground hover:border-primary/50',
              )}
            >
              {label}
            </button>
          ))}
        </div>
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
