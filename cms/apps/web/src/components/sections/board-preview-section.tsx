import Link from 'next/link'
import { prisma } from '@letmein/db'
import { MessageSquare } from 'lucide-react'

interface BoardPreviewSectionProps {
  title: string
  boards: { boardId: string; limit: number }[]
  columns: number
}

export async function BoardPreviewSection({ title, boards, columns }: BoardPreviewSectionProps) {
  if (!boards || boards.length === 0) return null

  const boardData = await Promise.all(
    boards.map(async ({ boardId, limit }) => {
      const board = await prisma.board.findUnique({
        where: { id: BigInt(boardId) },
        select: { id: true, nameKey: true, slug: true },
      })
      if (!board) return null

      const posts = await prisma.post.findMany({
        where: { boardId: BigInt(boardId), deletedAt: null, status: 'published' },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          createdAt: true,
          commentCount: true,
        },
        take: limit,
      })

      return { board, posts }
    }),
  )

  const validBoards = boardData.filter(Boolean)
  if (validBoards.length === 0) return null

  return (
    <section className="mx-auto max-w-[1200px] px-6 py-10 lg:px-10">
      <div className="mb-6 flex items-center gap-3">
        <div className="h-6 w-1 rounded-full bg-[#3D8A5A]" />
        <h2 className="text-xl font-bold text-[#1A1918]">{title}</h2>
      </div>
      <div
        className="grid gap-5"
        style={{ gridTemplateColumns: `repeat(${Math.min(columns, 3)}, 1fr)` }}
      >
        {validBoards.map((data) => {
          if (!data) return null
          const { board, posts } = data
          return (
            <div key={String(board.id)} className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
              <div className="flex items-center justify-between border-b border-[#F0F0EE] px-5 py-3.5">
                <h3 className="text-sm font-bold text-[#1A1918]">{board.nameKey}</h3>
                <Link
                  href={`/${board.slug}`}
                  className="text-xs font-semibold text-[#3D8A5A] hover:underline"
                >
                  더보기 →
                </Link>
              </div>
              {posts.length > 0 ? (
                posts.map((post, i) => (
                  <Link
                    key={String(post.id)}
                    href={`/${board.slug}/${post.id}`}
                    className={`flex items-center justify-between px-5 py-3 transition-colors hover:bg-[#F5F4F1] ${i < posts.length - 1 ? 'border-b border-[#F0F0EE]' : ''}`}
                  >
                    <span className="line-clamp-1 text-sm text-[#3F3F46]">
                      {post.title}
                      {post.commentCount > 0 && (
                        <span className="ml-1.5 inline-flex items-center gap-0.5 text-[11px] text-[#3D8A5A]">
                          <MessageSquare className="inline h-3 w-3" />
                          {post.commentCount}
                        </span>
                      )}
                    </span>
                    <span className="shrink-0 pl-3 text-xs text-[#9E9D9B]">
                      {new Date(post.createdAt).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })}
                    </span>
                  </Link>
                ))
              ) : (
                <div className="py-8 text-center text-sm text-[#9E9D9B]">
                  게시글이 없습니다.
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
