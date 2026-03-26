import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@letmein/db'

// GET /api/v1/admin/board-groups
export async function GET() {
  try {
    const groups = await prisma.boardGroup.findMany({
      orderBy: { sort_order: 'asc' },
      include: {
        _count: {
          select: { boards: true },
        },
      },
    })

    const data = groups.map((g) => ({
      id: String(g.id),
      nameKey: g.name_key,
      sortOrder: g.sort_order,
      isVisible: g.is_visible,
      createdAt: g.created_at?.toISOString() ?? null,
      _count: g._count,
    }))

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('GET /board-groups error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '대분류 목록 조회에 실패했습니다.' } },
      { status: 500 },
    )
  }
}

// POST /api/v1/admin/board-groups
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nameKey, sortOrder = 0, isVisible = true } = body

    if (!nameKey || typeof nameKey !== 'string' || nameKey.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: '대분류 이름은 필수입니다.', field: 'nameKey' } },
        { status: 400 },
      )
    }

    // sortOrder: 기본값은 현재 최대 + 1
    let finalSortOrder = sortOrder
    if (sortOrder === 0) {
      const maxSort = await prisma.boardGroup.aggregate({ _max: { sort_order: true } })
      finalSortOrder = (maxSort._max.sort_order ?? 0) + 1
    }

    const group = await prisma.boardGroup.create({
      data: {
        name_key: nameKey.trim(),
        sort_order: finalSortOrder,
        is_visible: isVisible,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        id: String(group.id),
        nameKey: group.name_key,
        sortOrder: group.sort_order,
        isVisible: group.is_visible,
        createdAt: group.created_at?.toISOString() ?? null,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('POST /board-groups error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '대분류 생성에 실패했습니다.' } },
      { status: 500 },
    )
  }
}
