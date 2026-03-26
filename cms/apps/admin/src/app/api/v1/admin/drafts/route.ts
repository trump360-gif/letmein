import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@letmein/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const boardId = searchParams.get('boardId')
    const page = Math.max(1, Number(searchParams.get('page') || '1'))
    const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') || '20')))

    const where: Record<string, unknown> = {}
    if (userId) where.userId = BigInt(userId)
    if (boardId) where.boardId = BigInt(boardId)

    const [drafts, total] = await Promise.all([
      prisma.draft.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.draft.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: drafts.map((d) => ({
        id: d.id.toString(),
        userId: d.userId.toString(),
        boardId: d.boardId?.toString() ?? null,
        postId: d.postId?.toString() ?? null,
        title: d.title,
        content: d.content,
        createdAt: d.createdAt.toISOString(),
        updatedAt: d.updatedAt.toISOString(),
      })),
      meta: { total, page, limit, hasNext: page * limit < total },
    })
  } catch (error) {
    console.error('Failed to fetch drafts:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '임시저장 목록을 불러오는데 실패했습니다.' } },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, boardId, postId, title, content } = body as {
      userId: string
      boardId?: string
      postId?: string
      title?: string
      content?: string
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_BODY', message: '사용자 ID가 필요합니다.' } },
        { status: 400 },
      )
    }

    const draft = await prisma.draft.upsert({
      where: postId
        ? {
            id: BigInt(postId),
          }
        : { id: BigInt(0) }, // Will create new if not found
      update: {
        title,
        content,
      },
      create: {
        userId: BigInt(userId),
        boardId: boardId ? BigInt(boardId) : null,
        postId: postId ? BigInt(postId) : null,
        title,
        content,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        id: draft.id.toString(),
        userId: draft.userId.toString(),
        title: draft.title,
        content: draft.content,
        createdAt: draft.createdAt.toISOString(),
        updatedAt: draft.updatedAt.toISOString(),
      },
    })
  } catch (error) {
    console.error('Failed to save draft:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '임시저장에 실패했습니다.' } },
      { status: 500 },
    )
  }
}
