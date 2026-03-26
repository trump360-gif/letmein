import { prisma } from '@letmein/db'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getBoard, getBoardMeta } from '@/shared/lib/db-cache'
import { BoardListSkin } from '@/components/board/board-list-skin'
import { BoardCardSkin } from '@/components/board/board-card-skin'
import { BoardAlbumSkin } from '@/components/board/board-album-skin'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page?: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const board = await getBoardMeta(slug)

  if (!board) return { title: '게시판을 찾을 수 없습니다' }

  return {
    title: board.nameKey,
    description: board.description || `${board.nameKey} 게시판`,
  }
}

export default async function BoardPage({ params, searchParams }: PageProps) {
  const { slug } = await params
  const { page: pageStr } = await searchParams
  const page = Math.max(1, Number(pageStr) || 1)

  const board = await getBoard(slug)

  if (!board || !board.isVisible) notFound()

  const perPage = board.perPage
  const skip = (page - 1) * perPage

  const [posts, totalCount] = await Promise.all([
    prisma.post.findMany({
      where: { boardId: board.id, deletedAt: null, status: 'published' },
      orderBy: [{ isNotice: 'desc' }, { createdAt: 'desc' }],
      skip,
      take: perPage,
      select: {
        id: true,
        title: true,
        contentPlain: true,
        createdAt: true,
        viewCount: true,
        likeCount: true,
        commentCount: true,
        isNotice: true,
        isAnonymous: true,
        thumbnailId: true,
        botAuthorName: true,
        user: { select: { nickname: true } },
      },
    }),
    prisma.post.count({
      where: { boardId: board.id, deletedAt: null, status: 'published' },
    }),
  ])

  const serializedPosts = posts.map((post) => ({
    id: String(post.id),
    title: post.title,
    authorName: post.isAnonymous ? '익명' : (post.botAuthorName || post.user?.nickname || '알 수 없음'),
    createdAt: post.createdAt.toISOString(),
    viewCount: post.viewCount,
    likeCount: post.likeCount,
    commentCount: post.commentCount,
    isPinned: post.isNotice,
    thumbnailUrl: post.thumbnailId ? `/api/media/${post.thumbnailId}` : null,
    excerpt: post.contentPlain ? post.contentPlain.slice(0, 150) : null,
  }))

  const boardData = {
    nameKey: board.nameKey,
    slug: board.slug,
    description: board.description,
    skin: board.skin as 'list' | 'card' | 'album',
    type: board.type,
    useComment: board.useComment,
    useLike: board.useLike,
    useViewCount: board.useViewCount,
  }

  const pagination = {
    page,
    perPage,
    totalCount,
    totalPages: Math.ceil(totalCount / perPage),
  }

  const skinProps = { board: boardData, posts: serializedPosts, pagination }

  switch (board.skin) {
    case 'card':
      return <BoardCardSkin {...skinProps} />
    case 'album':
      return <BoardAlbumSkin {...skinProps} />
    default:
      return <BoardListSkin {...skinProps} />
  }
}
