'use client'

import { useState } from 'react'
import { Button } from '@letmein/ui'
import { Loader2, BarChart3 } from 'lucide-react'
import { api } from '@/shared/api/client'

interface SeoScores {
  seoScore: number
  aeoScore: number
  geoScore: number
  feedback: string
}

interface SeoPanelProps {
  getTitle: () => string
  getContent: () => string
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  const color =
    score >= 70 ? 'bg-green-500' : score >= 50 ? 'bg-amber-500' : 'bg-red-500'
  const textColor =
    score >= 70 ? 'text-green-600' : score >= 50 ? 'text-amber-600' : 'text-red-600'

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className={`font-bold ${textColor}`}>{score}</span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted">
        <div
          className={`h-2 rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  )
}

export function SeoPanel({ getTitle, getContent }: SeoPanelProps) {
  const [scores, setScores] = useState<SeoScores | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const analyze = async () => {
    const title = getTitle()
    const content = getContent()

    if (!title.trim() || !content.trim()) {
      setError('제목과 내용을 먼저 입력해주세요.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await api
        .post('admin/posts/score', { json: { title, content } })
        .json<{ success: boolean; data: SeoScores }>()
      setScores(res.data)
    } catch {
      setError('점수 계산에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-lg border bg-card p-4 space-y-4">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-semibold">SEO / AEO / GEO 점수</span>
      </div>

      <Button
        onClick={analyze}
        disabled={loading}
        size="sm"
        className="w-full"
        variant="outline"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
            분석 중...
          </>
        ) : (
          'AI 점수 분석'
        )}
      </Button>

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}

      {scores && (
        <div className="space-y-3">
          <ScoreBar label="SEO" score={scores.seoScore} />
          <ScoreBar label="AEO" score={scores.aeoScore} />
          <ScoreBar label="GEO" score={scores.geoScore} />
          {scores.feedback && (
            <div className="rounded-md bg-muted p-3">
              <p className="text-xs leading-relaxed text-muted-foreground">{scores.feedback}</p>
            </div>
          )}
        </div>
      )}

      {!scores && !loading && !error && (
        <p className="text-xs text-muted-foreground text-center py-2">
          버튼을 눌러 현재 글의 SEO 점수를 분석하세요
        </p>
      )}
    </div>
  )
}
