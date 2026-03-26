import Link from 'next/link'
import { PenSquare, Home, ChevronRight, TrendingUp, ImageOff } from 'lucide-react'
import type { BoardSkinProps } from './types'
import { Pagination } from './pagination'
import { prisma } from '@letmein/db'

const CATEGORIES = [
  { slug: 'surgery-review',     name: '성형후기',   color: '#F0E8EA', text: '#6B2D3C' },
  { slug: 'hospital-recommend', name: '병원추천',   color: '#E8EEF8', text: '#2D4A8A' },
  { slug: 'eye-nose',           name: '눈·코·윤곽', color: '#E8F5F8', text: '#1A6B7A' },
  { slug: 'skin-laser',         name: '피부·레이저', color: '#F3EEFF', text: '#6B3D9A' },
  { slug: 'body-fat',           name: '지방·체형',  color: '#EDFAF3', text: '#1A7A4A' },
  { slug: 'consultation',       name: '상담·질문',  color: '#FEF3E8', text: '#8B4A1A' },
  { slug: 'free',               name: '자유게시판', color: '#FAFAE8', text: '#6B6200' },
]

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

export async function BoardAlbumSkin({ board, posts, pagination }: BoardSkinProps) {
  const popularPosts = await prisma.post.findMany({
    where: { deletedAt: null, status: 'published' },
    orderBy: { viewCount: 'desc' },
    take: 5,
    select: { id: true, title: true, board: { select: { slug: true } } },
  })

  return (
    <div className="w-full px-4 py-6 sm:px-6 md:px-[60px]">
      {/* 브레드크럼 */}
      <div className="mb-5 flex items-center gap-1.5 text-[12px] text-[#AAAAAA]">
        <Link href="/" className="hover:text-[#0A0A0A]"><Home className="h-3.5 w-3.5" /></Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-[#0A0A0A]">{board.nameKey}</span>
      </div>

      {/* 헤더 */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[20px] font-semibold text-[#0A0A0A] sm:text-[24px]">{board.nameKey}</h1>
          <p className="mt-1 text-[13px] text-[#999999]">
            총 <span className="font-medium text-[#6B2D3C]">{pagination.totalCount.toLocaleString()}</span>개의 게시글
          </p>
        </div>
        <Link
          href={`/write?board=${board.slug}`}
          className="flex shrink-0 items-center gap-1.5 rounded-sm bg-[#6B2D3C] px-3 py-2 text-[13px] font-medium text-white hover:bg-[#7D3548] sm:px-4 sm:py-2.5"
        >
          <PenSquare className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">글쓰기</span>
        </Link>
      </div>

      {/* 정렬 탭 */}
      <div className="mb-5 flex items-center border-b border-[#E8E8E8]">
        {['최신순', '추천순', '조회수순'].map((tab, i) => (
          <button
            key={tab}
            className={`px-3 py-2.5 text-[13px] font-medium transition-colors sm:px-4 ${
              i === 0
                ? 'border-b-2 border-[#6B2D3C] text-[#6B2D3C]'
                : 'text-[#999999] hover:text-[#0A0A0A]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        {/* 좌측: 앨범 그리드 — 2열(모바일) → 3열(sm) → 4열(lg) */}
        <div className="min-w-0 flex-1">
          {posts.length === 0 ? (
            <div className="flex h-[300px] items-center justify-center rounded-sm border border-[#E8E8E8] bg-white text-sm text-[#AAAAAA]">
              아직 게시물이 없습니다.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4">
              {posts.map((post) => (
                <Link
                  key={post.id}
                  href={`/${board.slug}/${post.id}`}
                  className="group overflow-hidden rounded-sm border border-[#E8E8E8] bg-white transition-shadow hover:shadow-md"
                >
                  {/* 정사각 썸네일 */}
                  <div className="relative aspect-square overflow-hidden bg-[#F5F5F5]">
                    {post.thumbnailUrl ? (
                      <img
                        src={post.thumbnailUrl}
                        alt={post.title}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[#CCCCCC]">
                        <ImageOff className="h-7 w-7" />
                      </div>
                    )}
                  </div>

                  {/* 제목/날짜 */}
                  <div className="p-2 sm:p-2.5">
                    <h3 className="line-clamp-1 text-[12px] font-medium text-[#0A0A0A] sm:text-[13px]">
                      {post.title}
                    </h3>
                    <div className="mt-1 flex items-center justify-between text-[10px] text-[#AAAAAA] sm:text-[11px]">
                      <span>{post.authorName || '익명'}</span>
                      <span>{formatDate(post.createdAt)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div className="mt-6">
            <Pagination slug={board.slug} page={pagination.page} totalPages={pagination.totalPages} />
          </div>
        </div>

        {/* 우측 사이드바 — 모바일 숨김, lg+ 표시 */}
        <div className="hidden w-[260px] shrink-0 space-y-6 lg:block">
          {/* 인기글 TOP5 */}
          <div className="rounded-sm border border-[#E8E8E8] bg-white p-4">
            <div className="mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[#6B2D3C]" />
              <h3 className="text-[13px] font-semibold text-[#0A0A0A]">인기글 TOP5</h3>
            </div>
            <div className="space-y-2.5">
              {popularPosts.length === 0 ? (
                <p className="text-[12px] text-[#CCCCCC]">아직 게시글이 없습니다.</p>
              ) : (
                popularPosts.map((post, i) => (
                  <Link
                    key={post.id.toString()}
                    href={`/${post.board?.slug || 'community'}/${post.id}`}
                    className="flex items-start gap-2.5 text-[12px] hover:text-[#6B2D3C]"
                  >
                    <span className="mt-0.5 w-4 shrink-0 font-bold text-[#6B2D3C]">{i + 1}</span>
                    <span className="line-clamp-2 text-[#444444]">{post.title}</span>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* 카테고리 */}
          <div className="rounded-sm border border-[#E8E8E8] bg-white p-4">
            <h3 className="mb-3 text-[13px] font-semibold text-[#0A0A0A]">카테고리</h3>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/${cat.slug}`}
                  className="rounded-sm px-3 py-1.5 text-[11px] font-medium transition-opacity hover:opacity-80"
                  style={{ backgroundColor: cat.color, color: cat.text }}
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
