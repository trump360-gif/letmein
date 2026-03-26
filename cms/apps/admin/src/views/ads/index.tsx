'use client'

import { useState, useCallback } from 'react'
import { AdCreativeTable } from './components/ad-creative-table'
import type { AdCreative, AdReviewStatus } from '@letmein/types'

interface AdsViewProps {
  creatives: AdCreative[]
  total: number
  page: number
  limit: number
  hasNext: boolean
}

export function AdsPage({ creatives, total, page, limit, hasNext }: AdsViewProps) {
  const [search, setSearch] = useState('')
  const [reviewStatusFilter, setReviewStatusFilter] = useState<AdReviewStatus | undefined>(undefined)

  const filtered = creatives.filter((c) => {
    const matchesSearch =
      !search || c.headline.includes(search) || (c.hospitalName ?? '').includes(search)
    const matchesStatus = !reviewStatusFilter || c.reviewStatus === reviewStatusFilter
    return matchesSearch && matchesStatus
  })

  const handleReset = useCallback(() => {
    setSearch('')
    setReviewStatusFilter(undefined)
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">광고 심사</h2>
        <p className="mt-1 text-sm text-muted-foreground">광고 소재를 심사하고 캠페인을 관리합니다.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="병원명, 헤드라인으로 검색..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          data-testid="ads-search"
          className="h-9 w-64 rounded-md border px-3 text-sm"
        />
        <select
          value={reviewStatusFilter ?? ''}
          onChange={(e) =>
            setReviewStatusFilter((e.target.value || undefined) as AdReviewStatus | undefined)
          }
          data-testid="review-status-filter"
          className="h-9 rounded-md border px-3 text-sm"
        >
          <option value="">전체 상태</option>
          <option value="pending">심사 대기</option>
          <option value="approved">승인됨</option>
          <option value="rejected">거부됨</option>
        </select>
        <button
          onClick={handleReset}
          className="h-9 rounded-md border px-3 text-sm text-muted-foreground hover:bg-accent"
        >
          초기화
        </button>
      </div>

      <AdCreativeTable
        creatives={filtered}
        total={total}
        page={page}
        limit={limit}
        hasNext={hasNext}
        onPageChange={(p) => {
          const url = new URL(window.location.href)
          url.searchParams.set('page', String(p))
          window.location.href = url.toString()
        }}
      />
    </div>
  )
}
