'use client'

import { useState } from 'react'
import {
  Button,
  Label,
  Input,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@letmein/ui'
import type { BannedWordPatternType, BannedWordAction } from '@letmein/types'
import { useCreateBannedWord } from '@/features/report-handle'
import { BANNED_WORD_PATTERN_TYPES, BANNED_WORD_ACTIONS } from '@/shared/lib/constants'

interface WordFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultPatternType?: BannedWordPatternType
  onSuccess?: () => void
}

export function WordForm({
  open,
  onOpenChange,
  defaultPatternType = 'direct',
  onSuccess,
}: WordFormProps) {
  const [word, setWord] = useState('')
  const [patternType, setPatternType] = useState<BannedWordPatternType>(defaultPatternType)
  const [action, setAction] = useState<BannedWordAction>('replace')
  const [boardId, setBoardId] = useState('')
  const [error, setError] = useState('')

  const createBannedWord = useCreateBannedWord()

  const handleSubmit = async () => {
    setError('')

    if (!word.trim()) {
      setError('금칙어를 입력해주세요.')
      return
    }

    // Validate regex
    if (patternType === 'regex') {
      try {
        new RegExp(word)
      } catch {
        setError('유효하지 않은 정규식 패턴입니다.')
        return
      }
    }

    try {
      await createBannedWord.mutateAsync({
        word: word.trim(),
        patternType,
        action,
        boardId: boardId ? Number(boardId) : undefined,
      })

      setWord('')
      setAction('replace')
      setBoardId('')
      setError('')
      onOpenChange(false)
      onSuccess?.()
    } catch (e) {
      setError(e instanceof Error ? e.message : '금칙어 등록에 실패했습니다.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>금칙어 추가</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>패턴 유형</Label>
            <div className="flex gap-2">
              {(Object.entries(BANNED_WORD_PATTERN_TYPES) as [BannedWordPatternType, string][]).map(
                ([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setPatternType(value)}
                    className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                      patternType === value
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:bg-muted'
                    }`}
                  >
                    {label}
                  </button>
                ),
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>
              {patternType === 'direct'
                ? '금칙어'
                : patternType === 'regex'
                  ? '정규식 패턴'
                  : '초성 패턴'}
            </Label>
            <Input
              value={word}
              onChange={(e) => setWord(e.target.value)}
              placeholder={
                patternType === 'direct'
                  ? '예: 욕설단어'
                  : patternType === 'regex'
                    ? '예: 욕[\\s]*설'
                    : '예: ㅅㅂ'
              }
            />
            {patternType === 'regex' && (
              <p className="text-xs text-muted-foreground">
                자바스크립트 정규식 문법을 사용합니다. 변형 패턴을 잡을 때 유용합니다.
              </p>
            )}
            {patternType === 'chosung' && (
              <p className="text-xs text-muted-foreground">
                초성만 입력하면 해당 초성으로 시작하는 한글 음절을 모두 매칭합니다.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>처리 방법</Label>
            <div className="flex flex-wrap gap-1.5">
              {(Object.entries(BANNED_WORD_ACTIONS) as [BannedWordAction, string][]).map(
                ([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setAction(value)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                      action === value
                        ? 'bg-foreground text-background'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                    }`}
                  >
                    {label}
                  </button>
                ),
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>적용 게시판 (선택)</Label>
            <Input
              type="number"
              value={boardId}
              onChange={(e) => setBoardId(e.target.value)}
              placeholder="비워두면 전체 게시판에 적용"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button onClick={handleSubmit} disabled={createBannedWord.isPending}>
            {createBannedWord.isPending ? '등록 중...' : '등록'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
