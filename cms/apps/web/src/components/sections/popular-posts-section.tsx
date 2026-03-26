import Link from 'next/link'
import { prisma } from '@letmein/db'
import { TrendingUp, Eye, MessageSquare } from 'lucide-react'

interface PopularPostsSectionProps {
  title: string
  moreHref: string
  limit: number
  period: 'day' | 'week' | 'month' | 'all'
  skin: 'list' | 'card'
}

const periodLabel: Record<string, string> = {
  day: '오늘',
  week: '이번 주',
  month: '이번 달',
  all: '전체',
}

export async function PopularPostsSection({ title, moreHref, limit, period, skin }: PopularPostsSectionProps) {
  const now = new Date()
  const periodMap: Record<string, Date> = {
    day: new Date(now.getTime() - 24 * 60 * 60 * 1000),
    week: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
    month: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
  }

  const where: Record<string, unknown> = { deletedAt: null, status: 'published' }
  if (period !== 'all' && periodMap[period]) {
    where.createdAt = { gte: periodMap[period] }
  }

  const posts = await prisma.post.findMany({
    where,
    orderBy: { viewCount: 'desc' },
    select: {
      id: true,
      title: true,
      contentPlain: true,
      createdAt: true,
      viewCount: true,
      commentCount: true,
      thumbnailId: true,
      board: { select: { nameKey: true, slug: true } },
      user: { select: { nickname: true } },
    },
    take: limit,
  })

  if (posts.length === 0) return null

  return (
    <section className="mx-auto max-w-[1200px] px-6 py-10 lg:px-10">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FFF3E0]">
            <TrendingUp className="h-4 w-4 text-[#E65100]" />
          </div>
          <h2 className="text-xl font-bold text-[#1A1918]">{title}</h2>
          <span className="rounded-full bg-[#F5F4F1] px-2.5 py-0.5 text-[11px] font-medium text-[#6D6C6A]">
            {periodLabel[period] ?? ''}
          </span>
        </div>
        <Link href={moreHref} className="text-[13px] font-semibold text-[#3D8A5A] hover:underline">
          더보기 →
        </Link>
      </div>

      {skin === 'card' ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {posts.map((post, i) => (
            <Link
              key={String(post.id)}
              href={`/${post.board?.slug ?? ''}/${post.id}`}
              className="group relative overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="relative h-[140px] overflow-hidden">
                {post.thumbnailId ? (
                  <img
                    src={`/api/media/${post.thumbnailId}`}
                    alt={post.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#FFF3E0] to-[#FFE0B2]">
                    <TrendingUp className="h-8 w-8 text-[#E65100]/20" />
                  </div>
                )}
                <span className="absolute left-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-xs font-bold text-[#E65100] shadow-sm backdrop-blur-sm">
                  {i + 1}
                </span>
              </div>
              <div className="flex flex-col gap-1.5 p-4">
                {post.board?.nameKey && (
                  <span className="text-[11px] font-semibold text-[#3D8A5A]">{post.board.nameKey}</span>
                )}
                <h3 className="line-clamp-2 text-[14px] font-bold leading-snug text-[#1A1918] transition-colors group-hover:text-[#3D8A5A]">
                  {post.title}
                </h3>
                <div className="mt-1 flex items-center gap-3 text-[11px] text-[#9E9D9B]">
                  <span className="flex items-center gap-0.5">
                    <Eye className="h-3 w-3" />
                    {post.viewCount.toLocaleString()}
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
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
          {posts.map((post, i) => (
            <Link
              key={String(post.id)}
              href={`/${post.board?.slug ?? ''}/${post.id}`}
              className={`flex items-center gap-4 px-5 py-4 transition-colors hover:bg-[#F5F4F1] ${i < posts.length - 1 ? 'border-b border-[#F0F0EE]' : ''}`}
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#FFF3E0] text-xs font-bold text-[#E65100]">
                {i + 1}
              </span>
              {post.thumbnailId && (
                <div className="h-10 w-14 shrink-0 overflow-hidden rounded-lg">
                  <img src={`/api/media/${post.thumbnailId}`} alt="" className="h-full w-full object-cover" />
                </div>
              )}
              <div className="flex flex-1 items-center gap-3">
                <span className="shrink-0 rounded-md bg-[#e8f5e9] px-2 py-0.5 text-[11px] font-semibold text-[#3D8A5A]">
                  {post.board?.nameKey ?? ''}
                </span>
                <span className="line-clamp-1 text-sm font-medium text-[#1A1918]">{post.title}</span>
              </div>
              <div className="flex shrink-0 items-center gap-3 text-xs text-[#9E9D9B]">
                <span className="flex items-center gap-0.5">
                  <Eye className="h-3 w-3" />
                  {post.viewCount.toLocaleString()}
                </span>
                <span>{new Date(post.createdAt).toLocaleDateString('ko-KR')}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}
