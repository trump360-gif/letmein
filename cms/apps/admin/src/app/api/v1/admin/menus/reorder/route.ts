import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@letmein/db'

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { items } = body as {
      items: Array<{ id: string; sortOrder: number; parentId?: string | null }>
    }

    if (!items || !Array.isArray(items)) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_BODY', message: '잘못된 요청 형식입니다.' } },
        { status: 400 },
      )
    }

    await prisma.$transaction(
      items.map((item) =>
        prisma.menu.update({
          where: { id: BigInt(item.id) },
          data: {
            sortOrder: item.sortOrder,
            ...(item.parentId !== undefined
              ? { parentId: item.parentId ? BigInt(item.parentId) : null }
              : {}),
          },
        }),
      ),
    )

    return NextResponse.json({ success: true, data: { updated: items.length } })
  } catch (error) {
    console.error('Failed to reorder menus:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '메뉴 순서 변경에 실패했습니다.' } },
      { status: 500 },
    )
  }
}
