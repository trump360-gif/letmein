'use client'

import { useTransition } from 'react'
import { blindStory, restoreStory, deleteStory } from './actions'

interface Story {
  id: number
  castMemberName: string
  castMemberImage: string | null
  content: string
  storyType: string
  status: string
  likeCount: number
  commentCount: number
  createdAt: string
}

interface Props {
  stories: Story[]
  total: number
  page: number
  limit: number
  hasNext: boolean
  currentStatus: string
}

const storyTypeLabels: Record<string, string> = {
  general: '일반',
  recovery: '회복 일지',
  qa: 'Q&A',
  tip: '팁',
}

const statusLabels: Record<string, { label: string; color: string }> = {
  active: { label: '활성', color: 'bg-green-100 text-green-800' },
  blinded: { label: '블라인드', color: 'bg-yellow-100 text-yellow-800' },
  deleted: { label: '삭제됨', color: 'bg-red-100 text-red-800' },
}

export function CastStoriesView({ stories, total, page, limit, hasNext, currentStatus }: Props) {
  const [isPending, startTransition] = useTransition()

  const navigate = (params: Record<string, string>) => {
    const url = new URL(window.location.href)
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
    window.location.href = url.toString()
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">출연자 스토리 관리</h2>
        <p className="mt-1 text-sm text-muted-foreground">출연자들이 작성한 스토리를 관리합니다.</p>
      </div>

      <div className="flex gap-2">
        {['all', 'active', 'blinded', 'deleted'].map((s) => (
          <button
            key={s}
            onClick={() => navigate({ status: s, page: '1' })}
            className={`h-8 rounded-md px-3 text-sm font-medium transition-colors ${
              currentStatus === s
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {s === 'all' ? '전체' : statusLabels[s]?.label ?? s}
          </button>
        ))}
      </div>

      <div className="rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">출연자</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">내용</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">유형</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">상태</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">반응</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">작성일</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">액션</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {stories.map((story) => {
                const st = statusLabels[story.status] ?? { label: story.status, color: 'bg-muted text-muted-foreground' }
                return (
                  <tr key={story.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 text-sm">{story.id}</td>
                    <td className="px-4 py-3 text-sm font-medium">{story.castMemberName}</td>
                    <td className="max-w-xs truncate px-4 py-3 text-sm">{story.content}</td>
                    <td className="px-4 py-3 text-sm">{storyTypeLabels[story.storyType] ?? story.storyType}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${st.color}`}>
                        {st.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      ❤️ {story.likeCount} 💬 {story.commentCount}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {new Date(story.createdAt).toLocaleDateString('ko-KR')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {story.status === 'active' && (
                          <button
                            onClick={() => startTransition(async () => {
                              await blindStory(story.id)
                              window.location.reload()
                            })}
                            disabled={isPending}
                            className="h-7 rounded border px-2 text-xs text-yellow-600 hover:bg-yellow-50 disabled:opacity-50"
                          >
                            블라인드
                          </button>
                        )}
                        {story.status === 'blinded' && (
                          <button
                            onClick={() => startTransition(async () => {
                              await restoreStory(story.id)
                              window.location.reload()
                            })}
                            disabled={isPending}
                            className="h-7 rounded border px-2 text-xs text-green-600 hover:bg-green-50 disabled:opacity-50"
                          >
                            복구
                          </button>
                        )}
                        {story.status !== 'deleted' && (
                          <button
                            onClick={() => {
                              if (window.confirm('이 스토리를 삭제하시겠습니까?')) {
                                startTransition(async () => {
                                  await deleteStory(story.id)
                                  window.location.reload()
                                })
                              }
                            }}
                            disabled={isPending}
                            className="h-7 rounded border px-2 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
                          >
                            삭제
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
              {stories.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                    스토리가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t px-4 py-3">
          <span className="text-sm text-muted-foreground">총 {total}건</span>
          <div className="flex gap-1">
            <button
              disabled={page <= 1}
              onClick={() => navigate({ page: String(page - 1) })}
              className="h-8 rounded border px-3 text-sm disabled:opacity-50"
            >
              이전
            </button>
            <button
              disabled={!hasNext}
              onClick={() => navigate({ page: String(page + 1) })}
              className="h-8 rounded border px-3 text-sm disabled:opacity-50"
            >
              다음
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
