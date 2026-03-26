'use client'

import { useState, useCallback } from 'react'
import { EpisodeTable } from './components/episode-table'
import { EpisodeCreateDialog } from './components/episode-create-dialog'
import type { YouTubeEpisode } from '@letmein/types'

interface EpisodesViewProps {
  episodes: YouTubeEpisode[]
  total: number
  page: number
  limit: number
  hasNext: boolean
}

export function EpisodesPage({ episodes, total, page, limit, hasNext }: EpisodesViewProps) {
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [showCreate, setShowCreate] = useState(false)

  const filtered = episodes.filter((ep) => !search || ep.title.includes(search))

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

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold">에피소드 관리</h2>
          <p className="mt-1 text-sm text-muted-foreground">YouTube 에피소드 및 출연자 연결을 관리합니다.</p>
        </div>
        <button
          data-testid="add-episode-btn"
          onClick={() => setShowCreate(true)}
          className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          에피소드 추가
        </button>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder="제목으로 검색..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          data-testid="episode-search"
          className="h-9 w-64 rounded-md border px-3 text-sm"
        />
      </div>

      <EpisodeTable
        episodes={filtered}
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

      {showCreate && <EpisodeCreateDialog onClose={() => setShowCreate(false)} />}
    </div>
  )
}
