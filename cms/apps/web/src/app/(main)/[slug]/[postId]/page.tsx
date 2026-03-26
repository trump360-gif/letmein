import { prisma } from '@letmein/db'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getBoard, getBoardMeta } from '@/shared/lib/db-cache'
import { getSession } from '@/lib/auth'
import { PostDetail } from '@/components/board/post-detail'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ slug: string; postId: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, postId } = await params

  const board = await getBoardMeta(slug)
  if (!board) return { title: '게시물을 찾을 수 없습니다' }

  const post = await prisma.post.findFirst({
    where: { id: BigInt(postId), boardId: board.id, deletedAt: null },
    select: { title: true, contentPlain: true },
  })

  if (!post) return { title: '게시물을 찾을 수 없습니다' }

  return {
    title: `${post.title} - ${board.nameKey}`,
    description: post.contentPlain?.slice(0, 160) || post.title,
  }
}

/** 봇이 작성한 plain-text content를 HTML 단락으로 변환 */
function formatContent(raw: string): string {
  // 이미 블록 태그가 있으면 그대로 사용
  if (/<(p|div|h[1-6]|ul|ol|blockquote)\b/i.test(raw)) return raw
  // 이중 개행 → 단락, 단일 개행 → <br>
  return raw
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
    .map((p) => `<p>${p.replace(/\n/g, '<br>')}</p>`)
    .join('')
}

export default async function PostPage({ params }: PageProps) {
  const { slug, postId } = await params

  const [board, session] = await Promise.all([getBoard(slug), getSession()])

  if (!board || !board.isVisible) notFound()

  // Parallel fetch: post + prev/next (async-parallel)
  const [post, prevPost, nextPost] = await Promise.all([
    prisma.post.findFirst({
      where: {
        id: BigInt(postId),
        boardId: board.id,
        deletedAt: null,
        status: 'published',
      },
      include: {
        user: { select: { nickname: true } },
        comments: {
          where: { deletedAt: null, status: 'active' },
          orderBy: { createdAt: 'asc' },
          include: {
            user: { select: { nickname: true } },
          },
        },
      },
    }),
    prisma.post.findFirst({
      where: { boardId: board.id, deletedAt: null, status: 'published', id: { lt: BigInt(postId) } },
      orderBy: { id: 'desc' },
      select: { id: true, title: true },
    }),
    prisma.post.findFirst({
      where: { boardId: board.id, deletedAt: null, status: 'published', id: { gt: BigInt(postId) } },
      orderBy: { id: 'asc' },
      select: { id: true, title: true },
    }),
  ])

  if (!post) notFound()

  // Non-blocking view count increment (fire-and-forget)
  prisma.post.update({
    where: { id: post.id },
    data: { viewCount: { increment: 1 } },
  }).catch(() => {})

  const postData = {
    id: String(post.id),
    title: post.title,
    content: formatContent(post.content),
    authorName: post.isAnonymous ? '익명' : (post.botAuthorName || post.user?.nickname || '알 수 없음'),
    createdAt: post.createdAt.toISOString(),
    viewCount: post.viewCount + 1,
    likeCount: post.likeCount,
    commentCount: post.commentCount,
    comments: post.comments.map((c) => ({
      id: String(c.id),
      content: c.content,
      authorName: c.isAnonymous ? '익명' : (c.botAuthorName || c.user?.nickname || '알 수 없음'),
      createdAt: c.createdAt.toISOString(),
      parentId: c.parentId ? String(c.parentId) : null,
      likeCount: c.likeCount,
    })),
  }

  const boardData = {
    nameKey: board.nameKey,
    slug: board.slug,
    useComment: board.useComment,
    useLike: board.useLike,
    useShare: board.useShare,
  }

  return (
    <PostDetail
      post={postData}
      board={boardData}
      prevPost={prevPost ? { id: String(prevPost.id), title: prevPost.title } : null}
      nextPost={nextPost ? { id: String(nextPost.id), title: nextPost.title } : null}
      isLoggedIn={!!session}
      currentUser={session ? { nickname: session.nickname } : null}
    />
  )
}
