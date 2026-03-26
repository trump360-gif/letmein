'use client'

import { useState } from 'react'
import { Search, Trash2 } from 'lucide-react'
import { Button, Input, Badge, Tabs, TabsContent, TabsList, TabsTrigger } from '@letmein/ui'
import { useBannedWords, useDeleteBannedWord } from '@/features/report-handle'
import { WordTest } from './components/word-test'
import {
  BANNED_WORD_PATTERN_TYPES,
  BANNED_WORD_ACTIONS,
  ITEMS_PER_PAGE,
} from '@/shared/lib/constants'
import { useDebounce } from '@/shared/hooks/use-debounce'

export function BannedWordsPage() {
  const [page, setPage] = useState(1)
  const [patternType, setPatternType] = useState<string>('')
  const [searchInput, setSearchInput] = useState('')
  const debouncedSearch = useDebounce(searchInput, 300)

  const { data, isLoading, refetch } = useBannedWords({
    page,
    limit: ITEMS_PER_PAGE,
    patternType: patternType || undefined,
    search: debouncedSearch || undefined,
  })

  const deleteBannedWord = useDeleteBannedWord()

  const words = data?.data ?? []
  const meta = data?.meta

  const handleDelete = async (id: string, word: string) => {
    if (!confirm(`"${word}" 금칙어를 삭제하시겠습니까?`)) return
    await deleteBannedWord.mutateAsync(id)
    refetch()
  }

  return (
    <div className="space-y-6">
      {meta && (
        <Badge variant="secondary">총 {meta.total}개</Badge>
      )}

      {/* Test area */}
      <WordTest />

      {/* Tabs for pattern type */}
      <Tabs
        value={patternType || 'all'}
        onValueChange={(v) => {
          setPatternType(v === 'all' ? '' : v)
          setPage(1)
        }}
      >
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="all">전체</TabsTrigger>
            <TabsTrigger value="direct">직접 매칭</TabsTrigger>
            <TabsTrigger value="regex">정규식(변형)</TabsTrigger>
            <TabsTrigger value="chosung">초성</TabsTrigger>
          </TabsList>

          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="금칙어 검색..."
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value)
                setPage(1)
              }}
              className="pl-9"
            />
          </div>
        </div>

        <TabsContent value={patternType || 'all'} className="mt-4">
          {isLoading ? (
            <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
              로딩 중...
            </div>
          ) : words.length === 0 ? (
            <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
              등록된 금칙어가 없습니다.
            </div>
          ) : (
            <div className="rounded-lg border bg-card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium">ID</th>
                    <th className="px-4 py-3 text-left font-medium">금칙어</th>
                    <th className="px-4 py-3 text-left font-medium">패턴</th>
                    <th className="px-4 py-3 text-left font-medium">처리 방법</th>
                    <th className="px-4 py-3 text-left font-medium">적용 게시판</th>
                    <th className="px-4 py-3 text-left font-medium">상태</th>
                    <th className="px-4 py-3 text-left font-medium">등록일</th>
                    <th className="px-4 py-3 text-left font-medium">작업</th>
                  </tr>
                </thead>
                <tbody>
                  {words.map((word) => (
                    <tr
                      key={word.id}
                      className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium">#{word.id}</td>
                      <td className="px-4 py-3">
                        <code className="rounded bg-muted px-1.5 py-0.5 text-sm font-mono text-red-600">
                          {word.word}
                        </code>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline">
                          {BANNED_WORD_PATTERN_TYPES[word.patternType as keyof typeof BANNED_WORD_PATTERN_TYPES]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="secondary"
                          className={
                            word.action === 'block'
                              ? 'bg-red-100 text-red-800'
                              : word.action === 'blind'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                          }
                        >
                          {BANNED_WORD_ACTIONS[word.action as keyof typeof BANNED_WORD_ACTIONS]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {word.boardName ?? '전체'}
                      </td>
                      <td className="px-4 py-3">
                        {word.isActive ? (
                          <Badge className="bg-green-100 text-green-800 text-xs">활성</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">비활성</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(word.createdAt).toLocaleDateString('ko-KR')}
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700"
                          onClick={() => handleDelete(word.id, word.word)}
                          disabled={deleteBannedWord.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Pagination */}
      {meta && meta.total > ITEMS_PER_PAGE && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {(page - 1) * ITEMS_PER_PAGE + 1} - {Math.min(page * ITEMS_PER_PAGE, meta.total)} / {meta.total}개
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              이전
            </Button>
            <Button variant="outline" size="sm" disabled={!meta.hasNext} onClick={() => setPage((p) => p + 1)}>
              다음
            </Button>
          </div>
        </div>
      )}

    </div>
  )
}
