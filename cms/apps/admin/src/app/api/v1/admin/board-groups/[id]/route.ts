import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@letmein/db'

// PATCH /api/v1/admin/board-groups/:id
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const id = BigInt(params.id)
    const body = await request.json()

    const existing = await prisma.boardGroup.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '대분류를 찾을 수 없습니다.' } },
        { status: 404 },
      )
    }

    const updateData: Record<string, unknown> = {}
    if (body.nameKey !== undefined) updateData.nameKey = body.nameKey.trim()
    if (body.sortOrder !== undefined) updateData.sortOrder = body.sortOrder
    if (body.isVisible !== undefined) updateData.isVisible = body.isVisible

    const group = await prisma.boardGroup.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      data: {
        id: String(group.id),
        nameKey: group.nameKey,
        sortOrder: group.sortOrder,
        isVisible: group.isVisible,
        createdAt: group.createdAt.toISOString(),
        updatedAt: group.updatedAt.toISOString(),
      },
    })
  } catch (error) {
    console.error('PATCH /board-groups/:id error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '대분류 수정에 실패했습니다.' } },
      { status: 500 },
    )
  }
}

// DELETE /api/v1/admin/board-groups/:id
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const id = BigInt(params.id)

    const existing = await prisma.boardGroup.findUnique({
      where: { id },
      include: { _count: { select: { boards: true } } },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '대분류를 찾을 수 없습니다.' } },
        { status: 404 },
      )
    }

    if (existing._count.boards > 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'HAS_BOARDS',
            message: `이 대분류에 ${existing._count.boards}개의 게시판이 있습니다. 게시판을 먼저 이동하거나 삭제해주세요.`,
          },
        },
        { status: 400 },
      )
    }

    await prisma.boardGroup.delete({ where: { id } })

    return NextResponse.json({ success: true, data: { id: String(id) } })
  } catch (error) {
    console.error('DELETE /board-groups/:id error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '대분류 삭제에 실패했습니다.' } },
      { status: 500 },
    )
  }
}
