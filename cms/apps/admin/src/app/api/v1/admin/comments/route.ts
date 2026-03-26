import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@letmein/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, Number(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || '20')))
    const postId = searchParams.get('postId')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    const where: Record<string, unknown> = { deletedAt: null }
    if (postId) where.postId = BigInt(postId)
    if (status) where.status = status
    if (search) {
      where.content = { contains: search, mode: 'insensitive' }
    }

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where,
        include: {
          post: {
            select: {
              id: true,
              title: true,
              board: { select: { nameKey: true } },
            },
          },
          user: { select: { id: true, nickname: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.comment.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: comments.map((c) => ({
        id: c.id.toString(),
        postId: c.postId.toString(),
        postTitle: c.post.title,
        boardName: c.post.board.nameKey,
        parentId: c.parentId?.toString() ?? null,
        userId: c.userId?.toString() ?? null,
        userNickname: c.user?.nickname ?? null,
        content: c.content,
        isAnonymous: c.isAnonymous,
        isSecret: c.isSecret,
        likeCount: c.likeCount,
        reportCount: c.reportCount,
        status: c.status,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
        deletedAt: c.deletedAt?.toISOString() ?? null,
      })),
      meta: {
        total,
        page,
        limit,
        hasNext: page * limit < total,
      },
    })
  } catch (error) {
    console.error('Failed to fetch comments:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '댓글 목록을 불러오는데 실패했습니다.' } },
      { status: 500 },
    )
  }
}
