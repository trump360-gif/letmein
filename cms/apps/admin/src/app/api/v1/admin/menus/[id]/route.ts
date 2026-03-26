import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@letmein/db'

function serializeMenu(m: any) {
  return {
    id: m.id.toString(),
    parentId: m.parentId?.toString() ?? null,
    location: m.location,
    nameKey: m.nameKey,
    linkType: m.linkType,
    linkUrl: m.linkUrl,
    boardId: m.boardId?.toString() ?? null,
    openNewTab: m.openNewTab,
    icon: m.icon,
    minGrade: m.minGrade,
    maxGrade: m.maxGrade,
    badgeType: m.badgeType,
    badgeText: m.badgeText,
    badgeColor: m.badgeColor,
    badgeExpiresAt: m.badgeExpiresAt?.toISOString() ?? null,
    sortOrder: m.sortOrder,
    isVisible: m.isVisible,
    createdAt: m.createdAt.toISOString(),
    updatedAt: m.updatedAt.toISOString(),
    children: m.children?.map(serializeMenu) ?? [],
    board: m.board
      ? { id: m.board.id.toString(), nameKey: m.board.nameKey, slug: m.board.slug }
      : null,
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const id = BigInt(params.id)
    const body = await request.json()

    const existing = await prisma.menu.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '메뉴를 찾을 수 없습니다.' } },
        { status: 404 },
      )
    }

    const data: any = {}
    if (body.parentId !== undefined) data.parentId = body.parentId ? BigInt(body.parentId) : null
    if (body.location !== undefined) data.location = body.location
    if (body.nameKey !== undefined) data.nameKey = body.nameKey
    if (body.linkType !== undefined) data.linkType = body.linkType
    if (body.linkUrl !== undefined) data.linkUrl = body.linkUrl
    if (body.boardId !== undefined) data.boardId = body.boardId ? BigInt(body.boardId) : null
    if (body.openNewTab !== undefined) data.openNewTab = body.openNewTab
    if (body.icon !== undefined) data.icon = body.icon
    if (body.minGrade !== undefined) data.minGrade = body.minGrade
    if (body.maxGrade !== undefined) data.maxGrade = body.maxGrade
    if (body.badgeType !== undefined) data.badgeType = body.badgeType
    if (body.badgeText !== undefined) data.badgeText = body.badgeText
    if (body.badgeColor !== undefined) data.badgeColor = body.badgeColor
    if (body.badgeExpiresAt !== undefined) data.badgeExpiresAt = body.badgeExpiresAt ? new Date(body.badgeExpiresAt) : null
    if (body.sortOrder !== undefined) data.sortOrder = body.sortOrder
    if (body.isVisible !== undefined) data.isVisible = body.isVisible

    const menu = await prisma.menu.update({
      where: { id },
      data,
      include: {
        board: { select: { id: true, nameKey: true, slug: true } },
        children: {
          include: {
            board: { select: { id: true, nameKey: true, slug: true } },
            children: true,
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
    })

    return NextResponse.json({ success: true, data: serializeMenu(menu) })
  } catch (error) {
    console.error('Failed to update menu:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '메뉴 수정에 실패했습니다.' } },
      { status: 500 },
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const id = BigInt(params.id)

    const existing = await prisma.menu.findUnique({
      where: { id },
      include: { children: true },
    })
    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '메뉴를 찾을 수 없습니다.' } },
        { status: 404 },
      )
    }

    // 하위 메뉴가 있으면 먼저 상위로 이동시킴
    if (existing.children.length > 0) {
      await prisma.menu.updateMany({
        where: { parentId: id },
        data: { parentId: existing.parentId },
      })
    }

    await prisma.menu.delete({ where: { id } })

    return NextResponse.json({ success: true, data: { id: params.id } })
  } catch (error) {
    console.error('Failed to delete menu:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '메뉴 삭제에 실패했습니다.' } },
      { status: 500 },
    )
  }
}
