import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@letmein/db'

// GET /api/bot/posts/[postId]/comments
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ postId: string }> },
) {
  const { postId } = await params
  if (isNaN(Number(postId))) {
    return NextResponse.json({ success: true, data: { comments: [] } })
  }
  try {
    const comments = await prisma.comment.findMany({
      where: { postId: BigInt(postId), deletedAt: null },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        content: true,
        createdAt: true,
        parentId: true,
        isAnonymous: true,
        botAuthorName: true,
        botPersonaId: true,
        user: { select: { nickname: true } },
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        comments: comments.map((c) => ({
          comment_id: String(c.id),
          post_id: postId,
          content: c.content,
          author: c.botAuthorName || (c.isAnonymous ? '익명' : (c.user?.nickname || '알 수 없음')),
          persona_id: c.botPersonaId || null,
          parent_comment_id: c.parentId ? String(c.parentId) : null,
          created_at: c.createdAt.toISOString(),
        })),
      },
    })
  } catch {
    return NextResponse.json({ success: true, data: { comments: [] } })
  }
}

// POST /api/bot/posts/[postId]/comments
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> },
) {
  const { postId } = await params
  if (isNaN(Number(postId))) {
    return NextResponse.json({ success: false, error: 'not found' }, { status: 404 })
  }
  try {
    const body = await request.json()
    const { content, parent_comment_id, persona_id, persona_name } = body

    if (!content) {
      return NextResponse.json({ success: false, error: 'content required' }, { status: 400 })
    }

    const postIdBig = BigInt(postId)
    const post = await prisma.post.findUnique({ where: { id: postIdBig, deletedAt: null } })
    if (!post) {
      return NextResponse.json({ success: false, error: 'post not found' }, { status: 404 })
    }

    const comment = await prisma.comment.create({
      data: {
        postId: postIdBig,
        content,
        isAnonymous: false,
        parentId: parent_comment_id ? BigInt(parent_comment_id) : null,
        botAuthorName: persona_name || null,
        botPersonaId: persona_id || null,
      },
    })

    // 댓글 수 +1
    await prisma.post.update({
      where: { id: postIdBig },
      data: { commentCount: { increment: 1 } },
    })

    return NextResponse.json({
      success: true,
      data: { comment_id: String(comment.id) },
    }, { status: 201 })
  } catch (e) {
    console.error('[bot/comments POST]', e)
    return NextResponse.json({ success: false, error: 'internal error' }, { status: 500 })
  }
}
