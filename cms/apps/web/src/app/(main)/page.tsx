export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { prisma } from '@letmein/db'
import { Eye, ThumbsUp, TrendingUp, MessageSquare } from 'lucide-react'

interface PageProps {
  searchParams: Promise<{ period?: string; board?: string }>
}

function formatDate(dateStr: Date) {
  const d = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  if (hours < 1) return '방금 전'
  if (hours < 24) return `${hours}시간 전`
  return `${d.getMonth() + 1}.${d.getDate()}`
}

const PERIOD_LABELS = { daily: '일간', weekly: '주간', monthly: '월간' } as const
type Period = keyof typeof PERIOD_LABELS

function getPeriodStart(period: Period): Date {
  const now = new Date()
  if (period === 'daily')  return new Date(now.getTime() - 1000 * 60 * 60 * 24)
  if (period === 'weekly') return new Date(now.getTime() - 1000 * 60 * 60 * 24 * 7)
  return new Date(now.getTime() - 1000 * 60 * 60 * 24 * 30)
}

const BOARD_TABS = [
  { slug: 'all',              name: '전체' },
  { slug: 'surgery-review',   name: '성형후기' },
  { slug: 'hospital-recommend', name: '병원추천' },
  { slug: 'consultation',     name: '상담질문' },
  { slug: 'eye-nose',         name: '눈코윤곽' },
  { slug: 'skin-laser',       name: '피부레이저' },
  { slug: 'body-fat',         name: '지방체형' },
  { slug: 'free',             name: '자유' },
]

const CATEGORIES = [
  { slug: 'surgery-review',     name: '성형후기',   color: '#F0E8EA', text: '#6B2D3C' },
  { slug: 'hospital-recommend', name: '병원추천',   color: '#E8EEF8', text: '#2D4A8A' },
  { slug: 'eye-nose',           name: '눈·코·윤곽', color: '#E8F5F8', text: '#1A6B7A' },
  { slug: 'skin-laser',         name: '피부·레이저', color: '#F3EEFF', text: '#6B3D9A' },
  { slug: 'body-fat',           name: '지방·체형',  color: '#EDFAF3', text: '#1A7A4A' },
  { slug: 'consultation',       name: '상담·질문',  color: '#FEF3E8', text: '#8B4A1A' },
  { slug: 'free',               name: '자유게시판', color: '#FAFAE8', text: '#6B6200' },
]

const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.slug, c]))
function BoardBadge({ slug, nameKey }: { slug: string; nameKey: string }) {
  const cat = CATEGORY_MAP[slug]
  if (cat) {
    return (
      <span
        className="shrink-0 whitespace-nowrap rounded-sm px-2 py-0.5 text-[11px] font-medium"
        style={{ backgroundColor: cat.color, color: cat.text }}
      >
        {cat.name}
      </span>
    )
  }
  return (
    <span className="shrink-0 whitespace-nowrap rounded-sm bg-[#F5F5F5] px-2 py-0.5 text-[11px] text-[#888888]">
      {nameKey}
    </span>
  )
}

const CARD_BADGE: Record<number, string> = {
  1: 'bg-[#0A0A0A] text-white',
  2: 'bg-[#3D3D3D] text-white',
  3: 'bg-[#6B2D3C] text-white',
}
const LIST_BADGE = (rank: number) =>
  rank <= 5 ? 'bg-[#F0E8EA] text-[#6B2D3C]' : 'bg-[#F5F5F5] text-[#888888]'

export default async function HomePage({ searchParams }: PageProps) {
  const { period: periodParam, board: boardParam } = await searchParams
  const period: Period = (periodParam as Period) || 'daily'
  const board = boardParam || 'all'
  const periodStart = getPeriodStart(period)

  const boardWhere = board !== 'all' ? { board: { slug: board } } : {}

  const [bestPosts, sidebarPosts, stats] = await Promise.all([
    prisma.post.findMany({
      where: {
        deletedAt: null,
        status: 'published',
        createdAt: { gte: periodStart },
        ...boardWhere,
      },
      orderBy: [{ viewCount: 'desc' }, { likeCount: 'desc' }],
      take: 10,
      select: {
        id: true,
        title: true,
        contentPlain: true,
        createdAt: true,
        viewCount: true,
        likeCount: true,
        commentCount: true,
        isAnonymous: true,
        thumbnailId: true,
        user: { select: { nickname: true } },
        board: { select: { slug: true, nameKey: true } },
      },
    }),
    prisma.post.findMany({
      where: { deletedAt: null, status: 'published' },
      orderBy: [{ viewCount: 'desc' }, { likeCount: 'desc' }],
      take: 5,
      select: { id: true, title: true, viewCount: true, likeCount: true, board: { select: { slug: true } } },
    }),
    prisma.post.count({ where: { deletedAt: null, status: 'published' } }),
  ])

  const topCards = bestPosts.slice(0, 3)
  const topList  = bestPosts.slice(3)

  function buildHref(p: string, b: string) {
    return `/?period=${p}&board=${b}`
  }

  return (
    <div className="bg-white">
      {/* 히어로 */}
      <div className="bg-[#0A0A0A] px-4 py-10 sm:px-8 md:px-[60px] md:py-14">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h1
              className="text-[28px] font-light leading-tight text-white sm:text-[34px] md:text-[38px]"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              진짜 후기로 만드는<br />
              <span className="font-semibold">나만의 뷰티 선택</span>
            </h1>
            <p className="mt-3 text-[13px] text-white/50">
              실제 경험자들의 솔직한 성형·뷰티 후기를 확인하고 최선의 선택을 하세요.
            </p>
            <div className="mt-6 flex gap-3">
              <Link href="/surgery-review" className="rounded-sm bg-[#6B2D3C] px-5 py-2.5 text-[13px] font-medium text-white">
                후기 올리기
              </Link>
              <Link href="/free" className="rounded-sm border border-white/20 px-5 py-2.5 text-[13px] text-white/70 hover:border-white/40">
                둘러보기
              </Link>
            </div>
          </div>
          {/* Stats — row on mobile, side on desktop */}
          <div className="flex gap-6 text-center sm:gap-10 md:shrink-0">
            {[
              { value: stats.toLocaleString(), label: '등록 게시글' },
              { value: '4,812', label: '등록병원' },
              { value: '38,200', label: '상담완료' },
            ].map((stat) => (
              <div key={stat.label}>
                <div
                  className="text-[22px] font-semibold text-white sm:text-[28px]"
                  style={{ fontFamily: "'Cormorant Garamond', serif" }}
                >
                  {stat.value}
                </div>
                <div className="mt-1 text-[11px] text-white/40">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="flex flex-col gap-8 px-4 py-8 sm:px-8 md:px-[60px] md:py-10 lg:flex-row">

        {/* 좌측: 베스트 랭킹 */}
        <div className="min-w-0 flex-1">

          {/* 헤더: 제목 + 필터 */}
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="text-[15px] font-semibold text-[#0A0A0A]">베스트 TOP 10</h2>
            {/* 일간/주간/월간 */}
            <div className="flex gap-0 overflow-hidden rounded-sm border border-[#E8E8E8] text-[12px]">
              {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
                <Link
                  key={p}
                  href={buildHref(p, board)}
                  className={`px-3 py-1.5 transition-colors sm:px-4 ${
                    period === p
                      ? 'bg-[#0A0A0A] font-medium text-white'
                      : 'text-[#999999] hover:bg-[#F5F5F5] hover:text-[#0A0A0A]'
                  }`}
                >
                  {PERIOD_LABELS[p]}
                </Link>
              ))}
            </div>
          </div>

          {/* 게시판 필터 탭 */}
          <div className="mb-5 flex flex-wrap gap-1.5">
            {BOARD_TABS.map((tab) => (
              <Link
                key={tab.slug}
                href={buildHref(period, tab.slug)}
                className={`rounded-full px-3 py-1 text-[11px] font-medium transition-colors ${
                  board === tab.slug
                    ? 'bg-[#0A0A0A] text-white'
                    : 'bg-[#F5F5F5] text-[#666666] hover:bg-[#EBEBEB]'
                }`}
              >
                {tab.name}
              </Link>
            ))}
          </div>

          {bestPosts.length === 0 ? (
            <div className="flex h-[200px] items-center justify-center rounded-sm border border-[#E8E8E8] text-sm text-[#AAAAAA]">
              {PERIOD_LABELS[period]} 기간에 게시글이 없습니다.
            </div>
          ) : (
            <>
              {/* TOP 1~3 카드 — 1열(모바일) → 2열(sm) → 3열(md+) */}
              {topCards.length > 0 && (
                <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
                  {topCards.map((post, index) => {
                    const rank = index + 1
                    const authorName = post.isAnonymous ? '익명' : (post.user?.nickname || '익명')
                    const excerpt = post.contentPlain ? post.contentPlain.slice(0, 80) : ''
                    return (
                      <Link
                        key={post.id.toString()}
                        href={`/${post.board?.slug || 'free'}/${post.id}`}
                        className="group flex flex-col gap-3 rounded-sm border border-[#E8E8E8] bg-white p-4 transition-shadow hover:border-[#D0D0D0] hover:shadow-sm"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className={`shrink-0 rounded-sm px-2 py-0.5 text-[10px] font-bold ${CARD_BADGE[rank]}`}>
                            TOP {rank}
                          </span>
                          {post.board && (
                            <BoardBadge slug={post.board.slug} nameKey={post.board.nameKey} />
                          )}
                        </div>
                        <p className="line-clamp-2 text-[13px] font-semibold leading-snug text-[#1A1A1A] group-hover:text-[#6B2D3C]">
                          {post.title}
                        </p>
                        {excerpt && (
                          <p className="line-clamp-2 text-[11px] leading-relaxed text-[#999999]">
                            {excerpt}
                          </p>
                        )}
                        <div className="mt-auto flex items-center justify-between text-[10px] text-[#BBBBBB]">
                          <span>{authorName} · {formatDate(post.createdAt)}</span>
                          <div className="flex items-center gap-2">
                            <span className="flex items-center gap-0.5">
                              <Eye className="h-3 w-3" />
                              {post.viewCount.toLocaleString()}
                            </span>
                            <span className="flex items-center gap-0.5">
                              <ThumbsUp className="h-3 w-3" />
                              {post.likeCount}
                            </span>
                            {post.commentCount > 0 && (
                              <span className="flex items-center gap-0.5">
                                <MessageSquare className="h-3 w-3" />
                                {post.commentCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}

              {/* TOP 4~10 리스트 — 모바일에서 일부 컬럼 숨김 */}
              {topList.length > 0 && (
                <div className="overflow-hidden rounded-sm border border-[#E8E8E8]">
                  {topList.map((post, index) => {
                    const rank = index + 4
                    return (
                      <Link
                        key={post.id.toString()}
                        href={`/${post.board?.slug || 'free'}/${post.id}`}
                        className="flex items-center gap-2 border-b border-[#F0F0F0] px-3 py-3 text-[13px] last:border-b-0 hover:bg-[#FAFAFA] sm:gap-3 sm:px-4"
                      >
                        <span className={`w-[40px] shrink-0 rounded-sm px-1.5 py-0.5 text-center text-[10px] font-bold sm:w-[44px] ${LIST_BADGE(rank)}`}>
                          TOP {rank}
                        </span>
                        {post.board && (
                          <BoardBadge slug={post.board.slug} nameKey={post.board.nameKey} />
                        )}
                        <span className="flex-1 truncate font-medium text-[#1A1A1A]">{post.title}</span>
                        <span className="hidden shrink-0 text-[11px] text-[#BBBBBB] sm:inline">
                          {post.isAnonymous ? '익명' : (post.user?.nickname || '익명')}
                        </span>
                        <span className="flex w-[36px] shrink-0 items-center justify-end gap-0.5 text-[11px] text-[#CCCCCC]">
                          <Eye className="h-3 w-3" />
                          {post.viewCount.toLocaleString()}
                        </span>
                        <span className="hidden w-[32px] shrink-0 items-center justify-end gap-0.5 text-[11px] text-[#CCCCCC] sm:flex">
                          <ThumbsUp className="h-3 w-3" />
                          {post.likeCount}
                        </span>
                      </Link>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* 우측 사이드바 — 모바일에서 숨김, lg+ 에서 표시 */}
        <div className="hidden w-[260px] shrink-0 space-y-6 lg:block">

          {/* 인기글 TOP5 */}
          <div className="rounded-sm border border-[#E8E8E8] bg-white p-4">
            <div className="mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[#6B2D3C]" />
              <h3 className="text-[13px] font-semibold text-[#0A0A0A]">누적 인기글 TOP5</h3>
            </div>
            <div className="space-y-0">
              {sidebarPosts.map((post, i) => (
                <Link
                  key={post.id.toString()}
                  href={`/${post.board?.slug || 'free'}/${post.id}`}
                  className="flex items-start gap-2.5 border-b border-[#F5F5F5] py-2.5 text-[12px] last:border-b-0 hover:text-[#6B2D3C]"
                >
                  <span className={`mt-0.5 w-4 shrink-0 font-bold ${i < 3 ? 'text-[#6B2D3C]' : 'text-[#BBBBBB]'}`}>
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-[#333333]">{post.title}</p>
                    <div className="mt-1 flex items-center gap-2 text-[10px] text-[#CCCCCC]">
                      <span className="flex items-center gap-0.5"><Eye className="h-2.5 w-2.5" />{post.viewCount.toLocaleString()}</span>
                      <span className="flex items-center gap-0.5"><ThumbsUp className="h-2.5 w-2.5" />{post.likeCount}</span>
                    </div>
                  </div>
                </Link>
              ))}
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
