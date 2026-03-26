import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@letmein/db'

// GET /api/bot/posts/[postId]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ postId: string }> },
) {
  const { postId } = await params
  // 구버전 MockCRM ID (bot_kr_xxx) 형식은 not found 처리
  if (isNaN(Number(postId))) {
    return NextResponse.json({ success: false, error: 'not found' }, { status: 404 })
  }
  try {
    const post = await prisma.post.findUnique({
      where: { id: BigInt(postId), deletedAt: null },
      select: {
        id: true,
        title: true,
        content: true,
        contentPlain: true,
        createdAt: true,
        viewCount: true,
        likeCount: true,
        commentCount: true,
        isAnonymous: true,
        botAuthorName: true,
        botPersonaId: true,
        user: { select: { nickname: true } },
        board: { select: { slug: true } },
      },
    })

    if (!post) {
      return NextResponse.json({ success: false, error: 'not found' }, { status: 404 })
    }

    // 봇이 게시글을 읽을 때 조회수 +1 (fire-and-forget)
    prisma.post.update({
      where: { id: post.id },
      data: { viewCount: { increment: 1 } },
    }).catch(() => {})

    return NextResponse.json({
      success: true,
      data: {
        post_id: String(post.id),
        title: post.title,
        content: post.content,
        category: post.board?.slug || 'free',
        author: post.botAuthorName || (post.isAnonymous ? '익명' : (post.user?.nickname || '알 수 없음')),
        persona_id: post.botPersonaId || null,
        created_at: post.createdAt.toISOString(),
        view_count: post.viewCount + 1,
        like_count: post.likeCount,
        comment_count: post.commentCount,
      },
    })
  } catch {
    return NextResponse.json({ success: false, error: 'not found' }, { status: 404 })
  }
}

// POST /api/bot/posts/[postId] — 좋아요
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ postId: string }> },
) {
  const { postId } = await params
  if (isNaN(Number(postId))) {
    return NextResponse.json({ success: false, error: 'not found' }, { status: 404 })
  }
  try {
    const post = await prisma.post.update({
      where: { id: BigInt(postId), deletedAt: null },
      data: { likeCount: { increment: 1 } },
      select: { likeCount: true },
    })
    return NextResponse.json({ success: true, like_count: post.likeCount })
  } catch {
    return NextResponse.json({ success: false, error: 'not found' }, { status: 404 })
  }
}
