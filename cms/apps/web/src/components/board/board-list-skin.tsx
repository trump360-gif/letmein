import Link from 'next/link'
import { Pin, MessageSquare, Eye, ThumbsUp } from 'lucide-react'
import type { BoardSkinProps } from './types'
import { BoardHeader } from './board-header'
import { Pagination } from './pagination'

function formatSmartDate(dateStr: string) {
  const d = new Date(dateStr)
  const now = new Date()
  const isToday =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  if (isToday) {
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }
  return `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

export function BoardListSkin({ board, posts, pagination }: BoardSkinProps) {
  return (
    <div className="mx-auto max-w-[960px] space-y-5 px-4 py-8 sm:px-6 sm:py-10">
      <BoardHeader nameKey={board.nameKey} description={board.description} />

      {/* 게시물 목록 */}
      <div className="overflow-hidden rounded-xl border border-[#E5E4E1] bg-white">
        {/* 테이블 헤더 — 데스크탑에서만 표시 */}
        <div className="hidden items-center gap-3 border-b border-[#E5E4E1] bg-[#F5F4F1] px-5 py-3 text-xs font-medium text-[#6D6C6A] sm:flex">
          <span className="w-[60px] text-center">번호</span>
          <span className="flex-1">제목</span>
          <span className="w-[80px] text-center">작성자</span>
          <span className="w-[90px] text-center">작성일</span>
          {board.useViewCount && <span className="w-[60px] text-center">조회</span>}
          {board.useLike && <span className="w-[60px] text-center">좋아요</span>}
        </div>

        {/* 게시물 목록 */}
        {posts.length === 0 ? (
          <div className="flex h-[200px] items-center justify-center text-sm text-[#9E9D9B]">
            아직 게시물이 없습니다.
          </div>
        ) : (
          posts.map((post, index) => (
            <Link
              key={post.id}
              href={`/${board.slug}/${post.id}`}
              className="group block border-b border-[#E5E4E1] transition-colors last:border-b-0 hover:bg-[#FAFAF9]"
            >
              {/* 모바일 레이아웃 */}
              <div className="flex flex-col gap-1.5 px-4 py-3 sm:hidden">
                <div className="flex items-start gap-2">
                  {post.isPinned && <Pin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#3D8A5A]" />}
                  <span className="font-medium text-[#1A1918] leading-snug">{post.title}</span>
                  {post.commentCount > 0 && (
                    <span className="ml-1 shrink-0 flex items-center gap-0.5 text-xs text-[#3D8A5A]">
                      <MessageSquare className="h-3 w-3" />{post.commentCount}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-[11px] text-[#9E9D9B]">
                  <span>{post.authorName || '익명'}</span>
                  <span>·</span>
                  <span>{formatSmartDate(post.createdAt)}</span>
                  {board.useViewCount && (
                    <>
                      <span>·</span>
                      <span className="flex items-center gap-0.5"><Eye className="h-3 w-3" />{post.viewCount.toLocaleString()}</span>
                    </>
                  )}
                  {board.useLike && (
                    <>
                      <span>·</span>
                      <span className="flex items-center gap-0.5"><ThumbsUp className="h-3 w-3" />{post.likeCount}</span>
                    </>
                  )}
                </div>
              </div>

              {/* 데스크탑 레이아웃 */}
              <div className="hidden items-center gap-3 px-5 py-3 text-sm sm:flex">
                <span className="w-[60px] text-center text-xs text-[#9E9D9B]">
                  {post.isPinned ? (
                    <span className="inline-flex items-center rounded bg-[#3D8A5A] px-1.5 py-0.5 text-[10px] font-medium text-white">
                      공지
                    </span>
                  ) : (
                    pagination.totalCount - ((pagination.page - 1) * pagination.perPage + index)
                  )}
                </span>
                <span className="flex flex-1 items-center gap-3">
                  {post.thumbnailUrl && (
                    <img
                      src={post.thumbnailUrl}
                      alt=""
                      className="h-10 w-16 shrink-0 rounded object-cover"
                    />
                  )}
                  {post.isPinned && <Pin className="h-3.5 w-3.5 shrink-0 text-[#3D8A5A]" />}
                  <span className="font-medium text-[#1A1918]">{post.title}</span>
                  {post.commentCount > 0 && (
                    <span className="flex items-center gap-0.5 text-xs text-[#3D8A5A]">
                      <MessageSquare className="h-3 w-3" />
                      {post.commentCount}
                    </span>
                  )}
                </span>
                <span className="w-[80px] text-center text-xs text-[#6D6C6A]">
                  {post.authorName || '익명'}
                </span>
                <span className="w-[90px] text-center text-xs text-[#9E9D9B]">
                  {formatSmartDate(post.createdAt)}
                </span>
                {board.useViewCount && (
                  <span className="flex w-[60px] items-center justify-center gap-1 text-xs text-[#9E9D9B]">
                    <Eye className="h-3 w-3" />
                    {post.viewCount.toLocaleString()}
                  </span>
                )}
                {board.useLike && (
                  <span className="flex w-[60px] items-center justify-center gap-1 text-xs text-[#9E9D9B]">
                    <ThumbsUp className="h-3 w-3" />
                    {post.likeCount}
                  </span>
                )}
              </div>
            </Link>
          ))
        )}
      </div>

      <Pagination slug={board.slug} page={pagination.page} totalPages={pagination.totalPages} />
    </div>
  )
}
