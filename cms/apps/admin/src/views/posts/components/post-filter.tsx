'use client'

import { Input, Button } from '@letmein/ui'
import { Search, X } from 'lucide-react'
import { POST_STATUS } from '@/shared/lib/constants'
import { cn } from '@letmein/utils'

interface PostFilterProps {
  search: string
  onSearchChange: (v: string) => void
  status: string
  onStatusChange: (v: string) => void
  boardId: string
  onBoardIdChange: (v: string) => void
  postType: string
  onPostTypeChange: (v: string) => void
  language: string
  onLanguageChange: (v: string) => void
  aiGenerated: string
  onAiGeneratedChange: (v: string) => void
  onReset: () => void
}

export function PostFilter({
  search, onSearchChange,
  status, onStatusChange,
  boardId, onBoardIdChange,
  postType, onPostTypeChange,
  language, onLanguageChange,
  aiGenerated, onAiGeneratedChange,
  onReset,
}: PostFilterProps) {
  const hasFilter = search || status || boardId || postType || language || aiGenerated

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="제목 또는 내용 검색..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-9 w-64 pl-8"
        />
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground shrink-0">상태</span>
        <div className="flex flex-wrap gap-1">
          <button
            type="button"
            onClick={() => onStatusChange('')}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              status === ''
                ? 'bg-foreground text-background'
                : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
            }`}
          >
            전체
          </button>
          {Object.entries(POST_STATUS).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => onStatusChange(key)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                status === key
                  ? 'bg-foreground text-background'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <Input
        placeholder="게시판 ID"
        value={boardId}
        onChange={(e) => onBoardIdChange(e.target.value)}
        className="h-9 w-32"
      />

      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground shrink-0">타입</span>
        <div className="flex gap-1">
          {([['', '전체'], ['TREND', '트렌드'], ['EVERGREEN', '에버그린']] as [string, string][]).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => onPostTypeChange(value)}
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                postType === value
                  ? 'bg-foreground text-background border-foreground'
                  : 'border-border text-muted-foreground hover:border-primary/50',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground shrink-0">언어</span>
        <div className="flex gap-1">
          {([['', '전체'], ['KO', '한국어'], ['JA', '일본어']] as [string, string][]).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => onLanguageChange(value)}
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                language === value
                  ? 'bg-foreground text-background border-foreground'
                  : 'border-border text-muted-foreground hover:border-primary/50',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground shrink-0">AI 생성</span>
        <div className="flex gap-1">
          {([['', '전체'], ['true', 'AI 생성'], ['false', '직접 작성']] as [string, string][]).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => onAiGeneratedChange(value)}
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                aiGenerated === value
                  ? 'bg-foreground text-background border-foreground'
                  : 'border-border text-muted-foreground hover:border-primary/50',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {hasFilter && (
        <Button variant="ghost" size="sm" onClick={onReset}>
          <X className="mr-1 h-4 w-4" />
          초기화
        </Button>
      )}
    </div>
  )
}
