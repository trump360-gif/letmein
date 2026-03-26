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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const location = searchParams.get('location')

    const where: any = { parentId: null }
    if (location) where.location = location

    const menus = await prisma.menu.findMany({
      where,
      include: {
        board: { select: { id: true, nameKey: true, slug: true } },
        children: {
          include: {
            board: { select: { id: true, nameKey: true, slug: true } },
            children: {
              include: {
                board: { select: { id: true, nameKey: true, slug: true } },
              },
              orderBy: { sortOrder: 'asc' },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { sortOrder: 'asc' },
    })

    return NextResponse.json({
      success: true,
      data: { menus: menus.map(serializeMenu) },
    })
  } catch (error) {
    console.error('Failed to fetch menus:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '메뉴를 불러오는데 실패했습니다.' } },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      parentId, location, nameKey, linkType, linkUrl, boardId,
      openNewTab, icon, minGrade, maxGrade, badgeType, badgeText,
      badgeColor, badgeExpiresAt, sortOrder, isVisible,
    } = body

    if (!nameKey || !location) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_BODY', message: '메뉴 이름과 위치는 필수입니다.' } },
        { status: 400 },
      )
    }

    const menu = await prisma.menu.create({
      data: {
        parentId: parentId ? BigInt(parentId) : null,
        location: location ?? 'gnb',
        nameKey,
        linkType: linkType ?? 'internal',
        linkUrl: linkUrl ?? null,
        boardId: boardId ? BigInt(boardId) : null,
        openNewTab: openNewTab ?? false,
        icon: icon ?? null,
        minGrade: minGrade ?? 0,
        maxGrade: maxGrade ?? 9,
        badgeType: badgeType ?? null,
        badgeText: badgeText ?? null,
        badgeColor: badgeColor ?? null,
        badgeExpiresAt: badgeExpiresAt ? new Date(badgeExpiresAt) : null,
        sortOrder: sortOrder ?? 0,
        isVisible: isVisible ?? true,
      },
      include: {
        board: { select: { id: true, nameKey: true, slug: true } },
        children: true,
      },
    })

    return NextResponse.json({ success: true, data: serializeMenu(menu) }, { status: 201 })
  } catch (error) {
    console.error('Failed to create menu:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '메뉴 생성에 실패했습니다.' } },
      { status: 500 },
    )
  }
}
