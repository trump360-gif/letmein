import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@letmein/db'

// PATCH /api/v1/admin/boards/reorder
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { items } = body

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: '순서 변경할 항목이 필요합니다.' } },
        { status: 400 },
      )
    }

    // 트랜잭션으로 일괄 업데이트
    await prisma.$transaction(
      items.map((item: { id: string; sortOrder: number; groupId?: string | null; parentId?: string | null }) =>
        prisma.board.update({
          where: { id: BigInt(item.id) },
          data: {
            sortOrder: item.sortOrder,
            ...(item.groupId !== undefined && {
              groupId: item.groupId ? BigInt(item.groupId) : null,
            }),
            ...(item.parentId !== undefined && {
              parentId: item.parentId ? BigInt(item.parentId) : null,
            }),
          },
        }),
      ),
    )

    return NextResponse.json({ success: true, data: { updated: items.length } })
  } catch (error) {
    console.error('PATCH /boards/reorder error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '순서 변경에 실패했습니다.' } },
      { status: 500 },
    )
  }
}
