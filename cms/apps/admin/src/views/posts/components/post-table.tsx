'use client'

import { Button } from '@letmein/ui'
import {
  Eye,
  EyeOff,
  Trash2,
  ArrowRightLeft,
  Pin,
  AlertTriangle,
  ExternalLink,
  Send,
} from 'lucide-react'
import { POST_STATUS } from '@/shared/lib/constants'
import { format } from 'date-fns'
import type { PostListItem } from '@letmein/types'

interface PostTableProps {
  posts: PostListItem[]
  onView: (id: string) => void
  onBlind: (id: string) => void
  onDelete: (id: string) => void
  onMove: (id: string) => void
  onPublish?: (id: string) => void
  isBlinding?: boolean
  isDeleting?: boolean
  isPublishing?: boolean
}

function getStatusBadge(status: string) {
  const label = POST_STATUS[status as keyof typeof POST_STATUS] ?? status
  const colorMap: Record<string, string> = {
    published: 'bg-green-100 text-green-700',
    draft: 'bg-gray-100 text-gray-700',
    blind: 'bg-red-100 text-red-700',
    deleted: 'bg-gray-200 text-gray-500',
    scheduled: 'bg-blue-100 text-blue-700',
  }
  return (
    <span className={`whitespace-nowrap inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colorMap[status] ?? 'bg-gray-100 text-gray-700'}`}>
      {label}
    </span>
  )
}

export function PostTable({
  posts,
  onView,
  onBlind,
  onDelete,
  onMove,
  onPublish,
  isBlinding,
  isDeleting,
  isPublishing,
}: PostTableProps) {
  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <p>게시물이 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm table-fixed">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="w-[50px] whitespace-nowrap px-3 py-3 text-left font-medium">ID</th>
            <th className="w-[80px] whitespace-nowrap px-3 py-3 text-left font-medium">게시판</th>
            <th className="px-3 py-3 text-left font-medium">제목</th>
            <th className="w-[100px] whitespace-nowrap px-3 py-3 text-left font-medium">작성자</th>
            <th className="w-[70px] whitespace-nowrap px-3 py-3 text-center font-medium">상태</th>
            <th className="w-[110px] whitespace-nowrap px-3 py-3 text-center font-medium">타입</th>
            <th className="w-[90px] whitespace-nowrap px-3 py-3 text-center font-medium">점수</th>
            <th className="w-[140px] whitespace-nowrap px-3 py-3 text-center font-medium">반응</th>
            <th className="w-[70px] whitespace-nowrap px-3 py-3 text-left font-medium">작성일</th>
            <th className="w-[120px] whitespace-nowrap px-3 py-3 text-center font-medium">관리</th>
          </tr>
        </thead>
        <tbody>
          {posts.map((post) => (
            <tr key={post.id} className="border-b transition-colors hover:bg-muted/30">
              <td className="whitespace-nowrap px-3 py-2.5 text-muted-foreground">{post.id}</td>
              <td className="whitespace-nowrap px-3 py-2.5">
                <span className="inline-flex items-center rounded bg-muted px-1.5 py-0.5 text-xs">
                  {post.boardName}
                </span>
              </td>
              <td className="px-3 py-2.5 overflow-hidden">
                <button
                  type="button"
                  className="flex items-center gap-1.5 text-left hover:text-primary w-full min-w-0"
                  onClick={() => onView(post.id)}
                >
                  {post.thumbnailId && (
                    <img
                      src={`/api/media/${post.thumbnailId}`}
                      alt=""
                      className="h-8 w-14 shrink-0 rounded object-cover"
                    />
                  )}
                  {post.isNotice && <Pin className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
                  <span className="truncate">{post.title}</span>
                </button>
              </td>
              <td className="px-3 py-2.5 text-muted-foreground overflow-hidden">
                <span className="block truncate" title={post.userNickname ?? '(탈퇴)'}>
                  {post.userNickname ?? '(탈퇴)'}
                </span>
              </td>
              <td className="whitespace-nowrap px-3 py-2.5 text-center">{getStatusBadge(post.status)}</td>
              <td className="whitespace-nowrap px-3 py-2.5 text-center">
                <div className="inline-flex items-center gap-1">
                  {post.postType && (
                    <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[11px] font-medium leading-none ${post.postType === 'TREND' ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {post.postType === 'TREND' ? '트렌드' : '에버그린'}
                    </span>
                  )}
                  <span className={`inline-flex items-center rounded px-1 py-0.5 text-[11px] font-medium leading-none ${post.language === 'JA' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                    {post.language}
                  </span>
                  {post.aiGenerated && (
                    <span className="inline-flex items-center rounded px-1 py-0.5 text-[11px] leading-none bg-purple-100 text-purple-700">AI</span>
                  )}
                </div>
              </td>
              <td className="whitespace-nowrap px-3 py-2.5 text-center">
                {post.seoScore !== null ? (
                  <span className="text-xs text-muted-foreground">
                    {post.seoScore}/{post.aeoScore}/{post.geoScore}
                  </span>
                ) : <span className="text-muted-foreground">-</span>}
              </td>
              <td className="whitespace-nowrap px-3 py-2.5 text-center">
                <span className="text-[11px] text-muted-foreground">
                  {post.viewCount.toLocaleString()}뷰 · {post.likeCount}좋아요 · {post.commentCount}댓글
                  {post.reportCount > 0 && (
                    <span className="text-destructive"> · <AlertTriangle className="inline h-3 w-3" />{post.reportCount}</span>
                  )}
                </span>
              </td>
              <td className="whitespace-nowrap px-3 py-2.5 text-muted-foreground text-xs">
                {format(new Date(post.createdAt), 'yy.MM.dd')}
              </td>
              <td className="whitespace-nowrap px-3 py-2.5">
                <div className="flex items-center justify-center gap-0.5">
                  {post.status !== 'published' && onPublish && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-green-600 hover:text-green-700"
                      title="발행"
                      onClick={() => onPublish(post.id)}
                      disabled={isPublishing}
                    >
                      <Send className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    title="상세 보기"
                    onClick={() => onView(post.id)}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    title={post.status === 'blind' ? '블라인드 해제' : '블라인드'}
                    onClick={() => onBlind(post.id)}
                    disabled={isBlinding}
                  >
                    {post.status === 'blind' ? (
                      <Eye className="h-3.5 w-3.5" />
                    ) : (
                      <EyeOff className="h-3.5 w-3.5" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    title="게시판 이동"
                    onClick={() => onMove(post.id)}
                  >
                    <ArrowRightLeft className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                    title="삭제"
                    onClick={() => onDelete(post.id)}
                    disabled={isDeleting}
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
  )
}
