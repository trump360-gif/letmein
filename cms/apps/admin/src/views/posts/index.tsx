'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Input } from '@letmein/ui'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@letmein/ui'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { usePostList, useBlindPost, useDeletePost, useMovePost, updatePost, postKeys } from '@/features/post-manage'
import { useQueryClient } from '@tanstack/react-query'
import { useDebounce } from '@/shared/hooks/use-debounce'
import { PostTable } from './components/post-table'
import { PostFilter } from './components/post-filter'

export function PostsPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [publishingId, setPublishingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [boardId, setBoardId] = useState('')
  const [postType, setPostType] = useState('')
  const [language, setLanguage] = useState('')
  const [aiGenerated, setAiGenerated] = useState('')
  const debouncedSearch = useDebounce(search, 300)

  // Move dialog state
  const [moveDialogOpen, setMoveDialogOpen] = useState(false)
  const [movePostId, setMovePostId] = useState<string | null>(null)
  const [targetBoardId, setTargetBoardId] = useState('')

  const { data, isLoading } = usePostList({
    page,
    limit: 20,
    search: debouncedSearch || undefined,
    status: status || undefined,
    boardId: boardId || undefined,
    postType: postType || undefined,
    language: language || undefined,
    aiGenerated: aiGenerated || undefined,
  })

  const blindMutation = useBlindPost()
  const deleteMutation = useDeletePost()
  const moveMutation = useMovePost()

  const posts = data?.success ? data.data : []
  const meta = data?.meta

  const handleView = useCallback(
    (id: string) => router.push(`/contents/posts/${id}`),
    [router],
  )

  const handleBlind = useCallback(
    async (id: string) => {
      if (!confirm('블라인드 상태를 변경하시겠습니까?')) return
      await blindMutation.mutateAsync(id)
    },
    [blindMutation],
  )

  const handleDelete = useCallback(
    async (id: string) => {
      if (!confirm('이 게시물을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return
      try {
        await deleteMutation.mutateAsync(id)
      } catch (err) {
        alert(`삭제 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`)
      }
    },
    [deleteMutation],
  )

  const handleOpenMove = useCallback((id: string) => {
    setMovePostId(id)
    setTargetBoardId('')
    setMoveDialogOpen(true)
  }, [])

  const handleMove = useCallback(async () => {
    if (!movePostId || !targetBoardId) return
    await moveMutation.mutateAsync({ id: movePostId, targetBoardId })
    setMoveDialogOpen(false)
    setMovePostId(null)
  }, [movePostId, targetBoardId, moveMutation])

  const handlePublish = useCallback(
    async (id: string) => {
      if (!confirm('이 게시물을 발행하시겠습니까?')) return
      setPublishingId(id)
      try {
        await updatePost(id, { status: 'published' })
        queryClient.invalidateQueries({ queryKey: postKeys.lists() })
      } catch (err) {
        alert(`발행 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`)
      } finally {
        setPublishingId(null)
      }
    },
    [queryClient],
  )

  const handleReset = useCallback(() => {
    setSearch('')
    setStatus('')
    setBoardId('')
    setPostType('')
    setLanguage('')
    setAiGenerated('')
    setPage(1)
  }, [])

  return (
    <div className="space-y-6">
      {meta && (
        <span className="text-sm text-muted-foreground">
          총 {meta.total.toLocaleString()}개
        </span>
      )}

      <div className="rounded-lg border bg-card">
        <div className="border-b p-4">
          <PostFilter
            search={search}
            onSearchChange={(v) => {
              setSearch(v)
              setPage(1)
            }}
            status={status}
            onStatusChange={(v) => {
              setStatus(v)
              setPage(1)
            }}
            boardId={boardId}
            onBoardIdChange={(v) => {
              setBoardId(v)
              setPage(1)
            }}
            postType={postType}
            onPostTypeChange={(v) => { setPostType(v); setPage(1) }}
            language={language}
            onLanguageChange={(v) => { setLanguage(v); setPage(1) }}
            aiGenerated={aiGenerated}
            onAiGeneratedChange={(v) => { setAiGenerated(v); setPage(1) }}
            onReset={handleReset}
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : (
          <PostTable
            posts={posts}
            onView={handleView}
            onBlind={handleBlind}
            onDelete={handleDelete}
            onMove={handleOpenMove}
            onPublish={handlePublish}
            isBlinding={blindMutation.isPending}
            isDeleting={deleteMutation.isPending}
            isPublishing={!!publishingId}
          />
        )}

        {/* Pagination */}
        {meta && meta.total > 0 && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <span className="text-sm text-muted-foreground">
              {(page - 1) * 20 + 1} - {Math.min(page * 20, meta.total)} / {meta.total}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="px-3 text-sm">{page}</span>
              <Button
                variant="outline"
                size="sm"
                disabled={!meta.hasNext}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Move Dialog */}
      <Dialog open={moveDialogOpen} onOpenChange={setMoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>게시물 이동</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">대상 게시판 ID</label>
              <Input
                value={targetBoardId}
                onChange={(e) => setTargetBoardId(e.target.value)}
                placeholder="이동할 게시판 ID를 입력하세요"
                className="mt-1.5"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMoveDialogOpen(false)}>
              취소
            </Button>
            <Button
              onClick={handleMove}
              disabled={!targetBoardId || moveMutation.isPending}
            >
              {moveMutation.isPending ? '이동 중...' : '이동'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
