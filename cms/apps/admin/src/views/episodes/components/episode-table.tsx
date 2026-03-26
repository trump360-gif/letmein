'use client'

import { useTransition } from 'react'
import type { YouTubeEpisode } from '@letmein/types'
import { deleteEpisode, updateEpisode } from '@/app/(dashboard)/episodes/actions'

interface EpisodeTableProps {
  episodes: YouTubeEpisode[]
  total: number
  page: number
  limit: number
  hasNext: boolean
  sortBy: string
  sortOrder: 'asc' | 'desc'
  onSortChange: (field: string) => void
  onPageChange: (page: number) => void
  isLoading?: boolean
}

export function EpisodeTable({
  episodes,
  total,
  page,
  limit,
  hasNext,
  sortBy,
  sortOrder,
  onSortChange,
  onPageChange,
  isLoading = false,
}: EpisodeTableProps) {
  const [isPending, startTransition] = useTransition()

  const handleDelete = (id: number) => {
    if (window.confirm('이 에피소드를 삭제하시겠습니까?')) {
      startTransition(async () => { await deleteEpisode(id) })
    }
  }

  const SortHeader = ({ field, children }: { field: string; children: React.ReactNode }) => (
    <th
      className="cursor-pointer px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground hover:text-foreground"
      onClick={() => onSortChange(field)}
    >
      {children} {sortBy === field && (sortOrder === 'asc' ? '↑' : '↓')}
    </th>
  )

  if (isLoading) {
    return <div className="py-12 text-center text-muted-foreground">로딩 중...</div>
  }

  return (
    <div className="rounded-lg border" data-testid="episode-table">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">썸네일</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">제목</th>
              <SortHeader field="airDate">방영일</SortHeader>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">히어로</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">출연자</th>
              <SortHeader field="createdAt">등록일</SortHeader>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">액션</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {episodes.map((ep) => (
              <tr key={ep.id} className="hover:bg-muted/30">
                <td className="px-4 py-3 text-sm">{ep.id}</td>
                <td className="px-4 py-3">
                  {ep.thumbnailUrl ? (
                    <img src={ep.thumbnailUrl} alt="" className="h-10 w-16 rounded object-cover" />
                  ) : (
                    <div className="flex h-10 w-16 items-center justify-center rounded bg-muted text-xs text-muted-foreground">
                      없음
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-sm">
                  <a href={ep.youtubeUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    {ep.title}
                  </a>
                </td>
                <td className="px-4 py-3 text-sm">
                  {ep.airDate ? new Date(ep.airDate).toLocaleDateString('ko-KR') : '-'}
                </td>
                <td className="px-4 py-3 text-sm">
                  <button
                    data-testid={`toggle-hero-${ep.id}`}
                    onClick={() => startTransition(async () => {
                      await updateEpisode(ep.id, { isHero: !ep.isHero })
                      window.location.reload()
                    })}
                    disabled={isPending}
                    className={`rounded-full px-3 py-0.5 text-xs font-medium transition-colors ${
                      ep.isHero
                        ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {ep.isHero ? '✦ Hero ON' : 'Hero OFF'}
                  </button>
                </td>
                <td className="px-4 py-3 text-sm">{ep.castMemberCount ?? 0}명</td>
                <td className="px-4 py-3 text-sm">{new Date(ep.createdAt).toLocaleDateString('ko-KR')}</td>
                <td className="px-4 py-3">
                  <button
                    data-testid={`delete-episode-${ep.id}`}
                    onClick={() => handleDelete(ep.id)}
                    disabled={isPending}
                    className="h-7 rounded border px-2 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    삭제
                  </button>
                </td>
              </tr>
            ))}
            {episodes.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                  에피소드가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t px-4 py-3">
        <span className="text-sm text-muted-foreground">
          총 {total}건 중 {(page - 1) * limit + 1}-{Math.min(page * limit, total)}
        </span>
        <div className="flex gap-1">
          <button
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="h-8 rounded border px-3 text-sm disabled:opacity-50"
          >
            이전
          </button>
          <button
            disabled={!hasNext}
            onClick={() => onPageChange(page + 1)}
            className="h-8 rounded border px-3 text-sm disabled:opacity-50"
          >
            다음
          </button>
        </div>
      </div>
    </div>
  )
}
