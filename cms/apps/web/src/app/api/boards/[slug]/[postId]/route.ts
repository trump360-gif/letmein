import { NextResponse } from 'next/server'
import { prisma } from '@letmein/db'

// GET /api/boards/[slug]/[postId] - 게시물 상세
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string; postId: string }> },
) {
  try {
    const { slug, postId } = await params

    const board = await prisma.board.findUnique({
      where: { slug, deletedAt: null },
    })

    if (!board || !board.isVisible) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '게시판을 찾을 수 없습니다.' } },
        { status: 404 },
      )
    }

    const post = await prisma.post.findFirst({
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
    })

    if (!post) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '게시물을 찾을 수 없습니다.' } },
        { status: 404 },
      )
    }

    // 조회수 증가
    await prisma.post.update({
      where: { id: post.id },
      data: { viewCount: { increment: 1 } },
    })

    // 이전/다음 글
    const [prevPost, nextPost] = await Promise.all([
      prisma.post.findFirst({
        where: { boardId: board.id, deletedAt: null, status: 'published', createdAt: { lt: post.createdAt } },
        orderBy: { createdAt: 'desc' },
        select: { id: true, title: true },
      }),
      prisma.post.findFirst({
        where: { boardId: board.id, deletedAt: null, status: 'published', createdAt: { gt: post.createdAt } },
        orderBy: { createdAt: 'asc' },
        select: { id: true, title: true },
      }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        post: {
          id: String(post.id),
          title: post.title,
          content: post.content,
          authorName: post.isAnonymous ? '익명' : (post.user?.nickname || '알 수 없음'),
          createdAt: post.createdAt.toISOString(),
          viewCount: post.viewCount + 1,
          likeCount: post.likeCount,
          commentCount: post.commentCount,
          comments: post.comments.map((c) => ({
            id: String(c.id),
            content: c.content,
            authorName: c.isAnonymous ? '익명' : (c.user?.nickname || '알 수 없음'),
            createdAt: c.createdAt.toISOString(),
            parentId: c.parentId ? String(c.parentId) : null,
            likeCount: c.likeCount,
          })),
        },
        prevPost: prevPost ? { id: String(prevPost.id), title: prevPost.title } : null,
        nextPost: nextPost ? { id: String(nextPost.id), title: nextPost.title } : null,
        board: {
          nameKey: board.nameKey,
          slug: board.slug,
          skin: board.skin,
          type: board.type,
          useComment: board.useComment,
          useLike: board.useLike,
          useShare: board.useShare,
        },
      },
    })
  } catch (error) {
    console.error('GET /api/boards/[slug]/[postId] error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '게시물 조회에 실패했습니다.' } },
      { status: 500 },
    )
  }
}
