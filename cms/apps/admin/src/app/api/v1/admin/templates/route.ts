import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@letmein/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, Number(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || '20')))
    const boardId = searchParams.get('boardId')
    const search = searchParams.get('search')

    const where: Record<string, unknown> = {}
    if (boardId) where.boardId = BigInt(boardId)
    if (search) {
      where.name = { contains: search, mode: 'insensitive' }
    }

    const [templates, total] = await Promise.all([
      prisma.template.findMany({
        where,
        include: {
          user: { select: { id: true, nickname: true } },
          board: { select: { id: true, nameKey: true } },
        },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.template.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: templates.map((t) => ({
        id: t.id.toString(),
        userId: t.userId.toString(),
        boardId: t.boardId?.toString() ?? null,
        boardName: t.board?.nameKey ?? null,
        name: t.name,
        content: t.content,
        isPublic: t.isPublic,
        isSystem: t.isSystem,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
      })),
      meta: {
        total,
        page,
        limit,
        hasNext: page * limit < total,
      },
    })
  } catch (error) {
    console.error('Failed to fetch templates:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '템플릿 목록을 불러오는데 실패했습니다.' } },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, content, boardId, isPublic, isSystem, userId } = body as {
      name: string
      content: string
      boardId?: string
      isPublic?: boolean
      isSystem?: boolean
      userId: string
    }

    if (!name || !content || !userId) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_BODY', message: '필수 필드를 입력해주세요.' } },
        { status: 400 },
      )
    }

    const template = await prisma.template.create({
      data: {
        name,
        content,
        userId: BigInt(userId),
        boardId: boardId ? BigInt(boardId) : null,
        isPublic: isPublic ?? false,
        isSystem: isSystem ?? false,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        id: template.id.toString(),
        name: template.name,
        content: template.content,
        isPublic: template.isPublic,
        isSystem: template.isSystem,
        createdAt: template.createdAt.toISOString(),
        updatedAt: template.updatedAt.toISOString(),
      },
    })
  } catch (error) {
    console.error('Failed to create template:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '템플릿 생성에 실패했습니다.' } },
      { status: 500 },
    )
  }
}
