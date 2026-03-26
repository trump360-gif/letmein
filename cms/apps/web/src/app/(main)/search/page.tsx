export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { prisma } from '@letmein/db'
import { Home, ChevronRight, Search, MessageSquare, Eye, ThumbsUp } from 'lucide-react'
import type { Metadata } from 'next'

interface PageProps {
  searchParams: Promise<{ q?: string; page?: string }>
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const { q } = await searchParams
  return { title: q ? `"${q}" 검색 결과 | BEAUTI` : '검색 | BEAUTI' }
}

function formatDate(date: Date) {
  const d = new Date(date)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

export default async function SearchPage({ searchParams }: PageProps) {
  const { q, page: pageStr } = await searchParams
  const query = q?.trim() || ''
  const page = Math.max(1, Number(pageStr) || 1)
  const perPage = 20
  const skip = (page - 1) * perPage

  const where = query
    ? {
        deletedAt: null,
        status: 'published' as const,
        OR: [
          { title: { contains: query, mode: 'insensitive' as const } },
          { contentPlain: { contains: query, mode: 'insensitive' as const } },
        ],
      }
    : null

  const [posts, totalCount] = where
    ? await Promise.all([
        prisma.post.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: perPage,
          select: {
            id: true,
            title: true,
            createdAt: true,
            viewCount: true,
            likeCount: true,
            commentCount: true,
            isAnonymous: true,
            user: { select: { nickname: true } },
            board: { select: { slug: true, nameKey: true } },
          },
        }),
        prisma.post.count({ where }),
      ])
    : [[], 0]

  const totalPages = Math.ceil(totalCount / perPage)

  return (
    <div className="mx-auto max-w-[960px] space-y-5 px-4 py-8 sm:px-6 sm:py-10">
      {/* 브레드크럼 */}
      <div className="flex items-center gap-1.5 text-[12px] text-[#AAAAAA]">
        <Link href="/" className="hover:text-[#0A0A0A]"><Home className="h-3.5 w-3.5" /></Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-[#0A0A0A]">검색</span>
        {query && (
          <>
            <ChevronRight className="h-3 w-3" />
            <span className="truncate text-[#0A0A0A]">&quot;{query}&quot;</span>
          </>
        )}
      </div>

      {/* 헤더 */}
      <div>
        <h1 className="text-[20px] font-semibold text-[#0A0A0A] sm:text-[22px]">
          {query ? `"${query}" 검색 결과` : '검색'}
        </h1>
        {query && totalCount > 0 && (
          <p className="mt-1 text-[13px] text-[#999999]">
            총 <span className="font-medium text-[#1A1918]">{totalCount.toLocaleString()}</span>개의 게시글
          </p>
        )}
      </div>

      {/* 검색창 */}
      <form action="/search" method="GET">
        <div className="flex items-center gap-3 rounded-sm border border-[#E5E4E1] bg-white px-4 py-3 focus-within:border-[#1A1918]">
          <Search className="h-4 w-4 shrink-0 text-[#AAAAAA]" />
          <input
            name="q"
            type="search"
            defaultValue={query}
            placeholder="검색어를 입력하세요"
            className="flex-1 text-[14px] text-[#1A1918] placeholder:text-[#AAAAAA] outline-none"
            autoComplete="off"
            autoFocus={!query}
          />
          <button
            type="submit"
            className="rounded-sm bg-[#1A1918] px-4 py-1.5 text-[12px] font-medium text-white hover:bg-[#333]"
          >
            검색
          </button>
        </div>
      </form>

      {/* 결과 영역 */}
      {!query ? (
        <div className="flex h-[300px] items-center justify-center rounded-xl border border-[#E5E4E1] bg-white text-sm text-[#AAAAAA]">
          <div className="flex flex-col items-center gap-3">
            <Search className="h-8 w-8 text-[#DDDDDD]" />
            <p>검색어를 입력해주세요.</p>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[#E5E4E1] bg-white">
          {/* 테이블 헤더 — 데스크탑만 */}
          <div className="hidden items-center gap-3 border-b border-[#E5E4E1] bg-[#F5F4F1] px-5 py-3 text-xs font-medium text-[#6D6C6A] sm:flex">
            <span className="w-[60px] text-center">번호</span>
            <span className="flex-1">제목</span>
            <span className="w-[80px] text-center">작성자</span>
            <span className="w-[90px] text-center">작성일</span>
            <span className="w-[60px] text-center">조회</span>
            <span className="w-[60px] text-center">좋아요</span>
          </div>

          {/* 결과 없음 */}
          {posts.length === 0 ? (
            <div className="flex h-[200px] items-center justify-center text-sm text-[#9E9D9B]">
              검색된 데이터가 없습니다.
            </div>
          ) : (
            posts.map((post, index) => {
              const authorName = post.isAnonymous ? '익명' : (post.user?.nickname || '알 수 없음')
              const rowNum = totalCount - (skip + index)
              return (
                <Link
                  key={String(post.id)}
                  href={`/${post.board?.slug || 'free'}/${post.id}`}
                  className="group block border-b border-[#E5E4E1] transition-colors last:border-b-0 hover:bg-[#FAFAF9]"
                >
                  {/* 모바일 레이아웃 */}
                  <div className="flex flex-col gap-1.5 px-4 py-3 sm:hidden">
                    <div className="flex items-start gap-2">
                      {post.board && (
                        <span className="shrink-0 rounded bg-[#F5F4F1] px-1.5 py-0.5 text-[10px] font-medium text-[#6D6C6A]">
                          {post.board.nameKey}
                        </span>
                      )}
                      <span className="font-medium text-[#1A1918] leading-snug">{post.title}</span>
                      {post.commentCount > 0 && (
                        <span className="shrink-0 flex items-center gap-0.5 text-xs text-[#3D8A5A]">
                          <MessageSquare className="h-3 w-3" />{post.commentCount}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-[#9E9D9B]">
                      <span>{authorName}</span>
                      <span>·</span>
                      <span>{formatDate(post.createdAt)}</span>
                      <span>·</span>
                      <span className="flex items-center gap-0.5"><Eye className="h-3 w-3" />{post.viewCount.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* 데스크탑 레이아웃 */}
                  <div className="hidden items-center gap-3 px-5 py-3 text-sm sm:flex">
                    <span className="w-[60px] text-center text-xs text-[#9E9D9B]">{rowNum}</span>
                    <span className="flex flex-1 items-center gap-2 min-w-0">
                      {post.board && (
                        <span className="shrink-0 rounded bg-[#F5F4F1] px-1.5 py-0.5 text-[10px] font-medium text-[#6D6C6A]">
                          {post.board.nameKey}
                        </span>
                      )}
                      <span className="font-medium text-[#1A1918] truncate">{post.title}</span>
                      {post.commentCount > 0 && (
                        <span className="shrink-0 flex items-center gap-0.5 text-xs text-[#3D8A5A]">
                          <MessageSquare className="h-3 w-3" />
                          {post.commentCount}
                        </span>
                      )}
                    </span>
                    <span className="w-[80px] text-center text-xs text-[#6D6C6A]">{authorName}</span>
                    <span className="w-[90px] text-center text-xs text-[#9E9D9B]">{formatDate(post.createdAt)}</span>
                    <span className="flex w-[60px] items-center justify-center gap-1 text-xs text-[#9E9D9B]">
                      <Eye className="h-3 w-3" />
                      {post.viewCount.toLocaleString()}
                    </span>
                    <span className="flex w-[60px] items-center justify-center gap-1 text-xs text-[#9E9D9B]">
                      <ThumbsUp className="h-3 w-3" />
                      {post.likeCount}
                    </span>
                  </div>
                </Link>
              )
            })
          )}
        </div>
      )}

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-1">
          {page > 1 && (
            <Link
              href={`/search?q=${encodeURIComponent(query)}&page=${page - 1}`}
              className="flex h-8 w-8 items-center justify-center rounded-sm border border-[#E5E4E1] text-[13px] text-[#666666] hover:border-[#1A1918] hover:text-[#1A1918]"
            >
              ‹
            </Link>
          )}
          {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/search?q=${encodeURIComponent(query)}&page=${p}`}
              className={`flex h-8 w-8 items-center justify-center rounded-sm text-[13px] ${
                p === page
                  ? 'bg-[#1A1918] text-white'
                  : 'border border-[#E5E4E1] text-[#666666] hover:border-[#1A1918] hover:text-[#1A1918]'
              }`}
            >
              {p}
            </Link>
          ))}
          {page < totalPages && (
            <Link
              href={`/search?q=${encodeURIComponent(query)}&page=${page + 1}`}
              className="flex h-8 w-8 items-center justify-center rounded-sm border border-[#E5E4E1] text-[13px] text-[#666666] hover:border-[#1A1918] hover:text-[#1A1918]"
            >
              ›
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
