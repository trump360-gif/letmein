'use client'

import { useState, useCallback } from 'react'
import { Button, Input } from '@letmein/ui'
import {
  Search,
  X,
  Eye,
  EyeOff,
  Trash2,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react'
import { useCommentList, useBlindComment, useDeleteComment } from '@/features/comment-manage'
import { useDebounce } from '@/shared/hooks/use-debounce'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation'

export function CommentsPage() {
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const debouncedSearch = useDebounce(search, 300)

  const { data, isLoading } = useCommentList({
    page,
    limit: 20,
    search: debouncedSearch || undefined,
    status: status || undefined,
  })

  const blindMutation = useBlindComment()
  const deleteMutation = useDeleteComment()

  const comments = data?.success ? data.data : []
  const meta = data?.meta

  const handleBlind = useCallback(
    async (id: string) => {
      if (!confirm('블라인드 상태를 변경하시겠습니까?')) return
      await blindMutation.mutateAsync(id)
    },
    [blindMutation],
  )

  const handleDelete = useCallback(
    async (id: string) => {
      if (!confirm('이 댓글을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return
      await deleteMutation.mutateAsync(id)
    },
    [deleteMutation],
  )

  return (
    <div className="space-y-6">
      {meta && (
        <span className="text-sm text-muted-foreground">
          총 {meta.total.toLocaleString()}개
        </span>
      )}

      <div className="rounded-lg border bg-card">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 border-b p-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="댓글 내용 검색..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="h-9 w-64 pl-8"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground shrink-0">상태</span>
            <div className="flex flex-wrap gap-1">
              {[
                { value: '', label: '전체' },
                { value: 'active', label: '활성' },
                { value: 'blind', label: '블라인드' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setStatus(opt.value)
                    setPage(1)
                  }}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    status === opt.value
                      ? 'bg-foreground text-background'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          {(search || status) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch('')
                setStatus('')
                setPage(1)
              }}
            >
              <X className="mr-1 h-4 w-4" />
              초기화
            </Button>
          )}
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <p>댓글이 없습니다.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">ID</th>
                  <th className="px-4 py-3 text-left font-medium">게시판</th>
                  <th className="px-4 py-3 text-left font-medium">게시글</th>
                  <th className="px-4 py-3 text-left font-medium">작성자</th>
                  <th className="px-4 py-3 text-left font-medium">내용</th>
                  <th className="px-4 py-3 text-center font-medium">상태</th>
                  <th className="px-4 py-3 text-center font-medium">신고</th>
                  <th className="px-4 py-3 text-left font-medium">작성일</th>
                  <th className="px-4 py-3 text-center font-medium">관리</th>
                </tr>
              </thead>
              <tbody>
                {comments.map((comment) => (
                  <tr key={comment.id} className="border-b transition-colors hover:bg-muted/30">
                    <td className="px-4 py-3 text-muted-foreground">{comment.id}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded bg-muted px-1.5 py-0.5 text-xs">
                        {comment.boardName}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        className="flex items-center gap-1 hover:text-primary"
                        onClick={() => router.push(`/contents/posts/${comment.postId}`)}
                      >
                        <span className="truncate max-w-[200px]">{comment.postTitle}</span>
                        <ExternalLink className="h-3 w-3 shrink-0" />
                      </button>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {comment.userNickname ?? '(탈퇴)'}
                      {comment.isAnonymous && ' (익명)'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="truncate max-w-[300px] block">
                        {comment.content.length > 100
                          ? comment.content.slice(0, 100) + '...'
                          : comment.content}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          comment.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : comment.status === 'blind'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {comment.status === 'active' ? '활성' : comment.status === 'blind' ? '블라인드' : comment.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {comment.reportCount > 0 ? (
                        <span className="inline-flex items-center gap-0.5 text-destructive">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          {comment.reportCount}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {format(new Date(comment.createdAt), 'yyyy-MM-dd HH:mm')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          title={comment.status === 'blind' ? '블라인드 해제' : '블라인드'}
                          onClick={() => handleBlind(comment.id)}
                          disabled={blindMutation.isPending}
                        >
                          {comment.status === 'blind' ? (
                            <Eye className="h-3.5 w-3.5" />
                          ) : (
                            <EyeOff className="h-3.5 w-3.5" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                          title="삭제"
                          onClick={() => handleDelete(comment.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
    </div>
  )
}
