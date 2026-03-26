'use client'

import { useState, useTransition } from 'react'
import { createEpisode } from '@/app/(dashboard)/episodes/actions'

interface EpisodeCreateDialogProps {
  onClose: () => void
}

export function EpisodeCreateDialog({ onClose }: EpisodeCreateDialogProps) {
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [title, setTitle] = useState('')
  const [airDate, setAirDate] = useState('')
  const [isHero, setIsHero] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      await createEpisode({
        youtubeUrl,
        title,
        airDate: airDate || undefined,
        isHero,
      })
      onClose()
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-lg bg-background p-6 shadow-xl" data-testid="episode-create-dialog">
        <h3 className="text-lg font-semibold">에피소드 추가</h3>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="text-sm font-medium">YouTube URL *</label>
            <input
              type="url"
              required
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              data-testid="episode-youtube-url"
              className="mt-1 h-9 w-full rounded-md border px-3 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium">제목 *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              data-testid="episode-title"
              className="mt-1 h-9 w-full rounded-md border px-3 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium">방영일</label>
            <input
              type="date"
              value={airDate}
              onChange={(e) => setAirDate(e.target.value)}
              data-testid="episode-air-date"
              className="mt-1 h-9 w-full rounded-md border px-3 text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isHero"
              checked={isHero}
              onChange={(e) => setIsHero(e.target.checked)}
              data-testid="episode-is-hero"
              className="h-4 w-4 rounded border"
            />
            <label htmlFor="isHero" className="text-sm font-medium">
              히어로 에피소드
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="h-9 rounded-md border px-4 text-sm hover:bg-accent"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isPending}
              data-testid="episode-create-submit"
              className="h-9 rounded-md bg-primary px-4 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {isPending ? '생성 중...' : '추가'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
