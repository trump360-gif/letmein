import Link from 'next/link'
import { prisma } from '@letmein/db'
import { Clock, Eye, MessageSquare } from 'lucide-react'

interface LatestPostsSectionProps {
  title: string
  moreHref: string
  boardId?: string
  limit: number
  skin: 'list' | 'card'
}

function PostThumbnail({ thumbnailId, title }: { thumbnailId: bigint | null; title: string }) {
  if (thumbnailId) {
    return (
      <img
        src={`/api/media/${thumbnailId}`}
        alt={title}
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
    )
  }
  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#e8f5e9] to-[#c8e6c9]">
      <svg className="h-8 w-8 text-[#3D8A5A]/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    </div>
  )
}

export async function LatestPostsSection({ title, moreHref, boardId, limit, skin }: LatestPostsSectionProps) {
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

  if (posts.length === 0) return null

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

      {skin === 'card' ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Link
              key={String(post.id)}
              href={`/${post.board?.slug ?? ''}/${post.id}`}
              className="group overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="relative h-[160px] overflow-hidden">
                <PostThumbnail thumbnailId={post.thumbnailId} title={post.title} />
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
                <div className="mt-auto flex items-center gap-3 pt-2 text-xs text-[#9E9D9B]">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(post.createdAt).toLocaleDateString('ko-KR')}
                  </span>
                  <span>{post.user?.nickname ?? '익명'}</span>
                  {post.viewCount > 0 && (
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {post.viewCount}
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
              {post.thumbnailId && (
                <div className="h-12 w-16 shrink-0 overflow-hidden rounded-lg">
                  <img src={`/api/media/${post.thumbnailId}`} alt="" className="h-full w-full object-cover" />
                </div>
              )}
              <div className="flex flex-1 items-center gap-3">
                <span className="shrink-0 rounded-md bg-[#e8f5e9] px-2 py-0.5 text-[11px] font-semibold text-[#3D8A5A]">
                  {post.board?.nameKey ?? ''}
                </span>
                <span className="line-clamp-1 text-sm font-medium text-[#1A1918]">{post.title}</span>
                {post.commentCount > 0 && (
                  <span className="flex items-center gap-0.5 text-xs text-[#3D8A5A]">
                    <MessageSquare className="h-3 w-3" />
                    {post.commentCount}
                  </span>
                )}
              </div>
              <span className="shrink-0 text-xs text-[#9E9D9B]">
                {new Date(post.createdAt).toLocaleDateString('ko-KR')}
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}
