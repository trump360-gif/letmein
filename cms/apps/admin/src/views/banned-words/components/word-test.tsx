'use client'

import { useState } from 'react'
import { FlaskConical } from 'lucide-react'
import { Button, Input, Label, Badge } from '@letmein/ui'
import { useTestBannedWords } from '@/features/report-handle'
import { BANNED_WORD_PATTERN_TYPES, BANNED_WORD_ACTIONS } from '@/shared/lib/constants'
import type { BannedWordTestResult } from '@letmein/types'

export function WordTest() {
  const [text, setText] = useState('')
  const [boardId, setBoardId] = useState('')
  const [result, setResult] = useState<BannedWordTestResult | null>(null)

  const testMutation = useTestBannedWords()

  const handleTest = async () => {
    if (!text.trim()) return
    const response = await testMutation.mutateAsync({
      text,
      boardId: boardId ? Number(boardId) : undefined,
    })
    if (response.success) {
      setResult(response.data)
    }
  }

  return (
    <div className="rounded-lg border bg-card p-5 space-y-4">
      <div className="flex items-center gap-2">
        <FlaskConical className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-lg">금칙어 테스트</h3>
      </div>

      <div className="space-y-3">
        <div className="space-y-2">
          <Label>테스트 텍스트</Label>
          <div className="flex gap-2">
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="금칙어가 포함된 텍스트를 입력하세요..."
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleTest()
              }}
            />
            <Input
              type="number"
              value={boardId}
              onChange={(e) => setBoardId(e.target.value)}
              placeholder="게시판 ID (선택)"
              className="w-36"
            />
            <Button onClick={handleTest} disabled={!text.trim() || testMutation.isPending}>
              {testMutation.isPending ? '검사 중...' : '검사'}
            </Button>
          </div>
        </div>

        {result && (
          <div className="space-y-3">
            {/* Result summary */}
            <div
              className={`rounded-md p-3 text-sm font-medium ${
                result.matched
                  ? 'bg-red-50 text-red-800 border border-red-200'
                  : 'bg-green-50 text-green-800 border border-green-200'
              }`}
            >
              {result.matched
                ? `${result.matches.length}개의 금칙어가 감지되었습니다.`
                : '금칙어가 감지되지 않았습니다.'}
            </div>

            {/* Filtered text preview */}
            {result.matched && (
              <div className="space-y-2">
                <Label>필터링 결과</Label>
                <div className="rounded-md bg-muted/50 p-3 text-sm font-mono">
                  {result.filteredText}
                </div>
              </div>
            )}

            {/* Match details */}
            {result.matches.length > 0 && (
              <div className="space-y-2">
                <Label>감지 상세</Label>
                <div className="space-y-2">
                  {result.matches.map((match, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 rounded-md border p-2 text-sm"
                    >
                      <Badge variant="outline" className="shrink-0">
                        {BANNED_WORD_PATTERN_TYPES[match.patternType as keyof typeof BANNED_WORD_PATTERN_TYPES]}
                      </Badge>
                      <span className="font-mono font-medium text-red-600">{match.word}</span>
                      <span className="text-muted-foreground">→</span>
                      <Badge variant="secondary" className="shrink-0">
                        {BANNED_WORD_ACTIONS[match.action as keyof typeof BANNED_WORD_ACTIONS]}
                      </Badge>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {match.positions.length}회 감지
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
