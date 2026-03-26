import Link from 'next/link'
import { prisma } from '@letmein/db'
import { Eye, MessageSquare } from 'lucide-react'

interface BlogGridSectionProps {
  title: string
  moreHref: string
  boardId?: string
  limit: number
}

export async function BlogGridSection({ title, moreHref, boardId, limit }: BlogGridSectionProps) {
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
    take: limit,
  })

  if (posts.length === 0) {
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
        <div className="flex h-[200px] items-center justify-center rounded-2xl bg-white text-sm text-[#9E9D9B] shadow-sm ring-1 ring-black/5">
          아직 게시글이 없습니다.
        </div>
      </section>
    )
  }

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

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <Link
            key={String(post.id)}
            href={`/${post.board?.slug ?? ''}/${post.id}`}
            className="group overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="relative h-[180px] overflow-hidden">
              {post.thumbnailId ? (
                <img
                  src={`/api/media/${post.thumbnailId}`}
                  alt={post.title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#e8f5e9] to-[#c8e6c9]">
                  <svg className="h-10 w-10 text-[#3D8A5A]/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
              {post.board?.nameKey && (
                <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-[#3D8A5A] shadow-sm backdrop-blur-sm">
                  {post.board.nameKey}
                </span>
              )}
            </div>
            <div className="flex flex-col gap-2 p-5">
              <h3 className="line-clamp-2 text-[15px] font-bold leading-snug text-[#1A1918] transition-colors group-hover:text-[#3D8A5A]">
                {post.title}
              </h3>
              {post.contentPlain && (
                <p className="line-clamp-2 text-[13px] leading-relaxed text-[#6D6C6A]">
                  {post.contentPlain}
                </p>
              )}
              <div className="mt-auto flex items-center justify-between pt-2 text-xs text-[#9E9D9B]">
                <div className="flex items-center gap-2">
                  <span>{post.user?.nickname ?? '익명'}</span>
                  <span>·</span>
                  <span>{new Date(post.createdAt).toLocaleDateString('ko-KR')}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  {post.viewCount > 0 && (
                    <span className="flex items-center gap-0.5">
                      <Eye className="h-3 w-3" />
                      {post.viewCount.toLocaleString()}
                    </span>
                  )}
                  {post.commentCount > 0 && (
                    <span className="flex items-center gap-0.5">
                      <MessageSquare className="h-3 w-3" />
                      {post.commentCount}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
