import Link from 'next/link'
import { prisma } from '@letmein/db'
import { Eye, MessageSquare } from 'lucide-react'

interface BlogMagazineSectionProps {
  title: string
  moreHref: string
  boardId?: string
  limit: number
}

export async function BlogMagazineSection({ title, moreHref, boardId, limit }: BlogMagazineSectionProps) {
  const where: Record<string, unknown> = { deletedAt: null, status: 'published' }
  if (boardId) where.boardId = BigInt(boardId)

  const posts = await prisma.post.findMany({
    where,
    orderBy: { createdAt: 'desc' },
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
    take: Math.max(limit, 5),
  })

  if (posts.length === 0) {
    return (
      <section className="mx-auto max-w-[1200px] px-6 py-10 lg:px-10">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-6 w-1 rounded-full bg-[#3D8A5A]" />
            <h2 className="text-xl font-bold text-[#1A1918]">{title}</h2>
          </div>
        </div>
        <div className="flex h-[200px] items-center justify-center rounded-2xl bg-white text-sm text-[#9E9D9B] shadow-sm ring-1 ring-black/5">
          아직 게시글이 없습니다.
        </div>
      </section>
    )
  }

  const featured = posts[0]
  const rest = posts.slice(1)

  return (
    <section className="mx-auto max-w-[1200px] px-6 py-10 lg:px-10">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-6 w-1 rounded-full bg-[#3D8A5A]" />
          <h2 className="text-xl font-bold text-[#1A1918]">{title}</h2>
        </div>
        <Link href={moreHref} className="text-[13px] font-semibold text-[#3D8A5A] hover:underline">
          더보기 →
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Featured post */}
        <Link
          href={`/${featured.board?.slug ?? ''}/${featured.id}`}
          className="group overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5 transition-all duration-200 hover:shadow-lg"
        >
          <div className="relative h-[280px] overflow-hidden">
            {featured.thumbnailId ? (
              <img
                src={`/api/media/${featured.thumbnailId}`}
                alt={featured.title}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#e8f5e9] to-[#a5d6a7]">
                <svg className="h-12 w-12 text-[#3D8A5A]/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
            {featured.board?.nameKey && (
              <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-[#3D8A5A] shadow-sm backdrop-blur-sm">
                {featured.board.nameKey}
              </span>
            )}
          </div>
          <div className="flex flex-col gap-2 p-6">
            <h3 className="line-clamp-2 text-lg font-bold leading-snug text-[#1A1918] transition-colors group-hover:text-[#3D8A5A]">
              {featured.title}
            </h3>
            {featured.contentPlain && (
              <p className="line-clamp-3 text-sm leading-relaxed text-[#6D6C6A]">
                {featured.contentPlain}
              </p>
            )}
            <div className="mt-2 flex items-center gap-3 text-xs text-[#9E9D9B]">
              <span>{featured.user?.nickname ?? '익명'}</span>
              <span>·</span>
              <span>{new Date(featured.createdAt).toLocaleDateString('ko-KR')}</span>
              {featured.viewCount > 0 && (
                <span className="flex items-center gap-0.5">
                  <Eye className="h-3 w-3" />
                  {featured.viewCount.toLocaleString()}
                </span>
              )}
              {featured.commentCount > 0 && (
                <span className="flex items-center gap-0.5">
                  <MessageSquare className="h-3 w-3" />
                  {featured.commentCount}
                </span>
              )}
            </div>
          </div>
        </Link>

        {/* Side posts */}
        <div className="flex flex-col gap-4">
          {rest.map((post) => (
            <Link
              key={String(post.id)}
              href={`/${post.board?.slug ?? ''}/${post.id}`}
              className="group flex gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 transition-all duration-200 hover:shadow-md"
            >
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl">
                {post.thumbnailId ? (
                  <img
                    src={`/api/media/${post.thumbnailId}`}
                    alt={post.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#e8f5e9] to-[#c8e6c9]">
                    <svg className="h-6 w-6 text-[#3D8A5A]/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col justify-center gap-1.5">
                {post.board?.nameKey && (
                  <span className="text-[11px] font-semibold text-[#3D8A5A]">{post.board.nameKey}</span>
                )}
                <h4 className="line-clamp-2 text-sm font-bold text-[#1A1918] transition-colors group-hover:text-[#3D8A5A]">
                  {post.title}
                </h4>
                <div className="flex items-center gap-2 text-xs text-[#9E9D9B]">
                  <span>{post.user?.nickname ?? '익명'}</span>
                  <span>·</span>
                  <span>{new Date(post.createdAt).toLocaleDateString('ko-KR')}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
