import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@letmein/db'

function serializePopup(p: any) {
  return {
    id: p.id.toString(),
    name: p.name,
    type: p.type,
    imageId: p.imageId?.toString() ?? null,
    htmlContent: p.htmlContent,
    displayScope: p.displayScope,
    boardId: p.boardId?.toString() ?? null,
    widthPx: p.widthPx,
    heightPx: p.heightPx,
    posX: p.posX,
    posY: p.posY,
    dismissOptions: p.dismissOptions,
    targetAudience: p.targetAudience,
    minGrade: p.minGrade,
    targetNewDays: p.targetNewDays,
    targetRegion: p.targetRegion,
    animation: p.animation,
    abGroup: p.abGroup,
    abRatio: p.abRatio,
    priority: p.priority,
    maxDisplay: p.maxDisplay,
    startsAt: p.startsAt?.toISOString() ?? null,
    endsAt: p.endsAt?.toISOString() ?? null,
    isActive: p.isActive,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    image: p.image
      ? {
          id: p.image.id.toString(),
          originalName: p.image.originalName,
          mimeType: p.image.mimeType,
          width: p.image.width,
          height: p.image.height,
        }
      : null,
    board: p.board
      ? { id: p.board.id.toString(), nameKey: p.board.nameKey, slug: p.board.slug }
      : null,
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const isActive = searchParams.get('isActive')
    const page = parseInt(searchParams.get('page') ?? '1')
    const limit = parseInt(searchParams.get('limit') ?? '20')

    const where: any = {}
    if (isActive !== null && isActive !== '') where.isActive = isActive === 'true'

    const [popups, total] = await Promise.all([
      prisma.popup.findMany({
        where,
        include: {
          image: { select: { id: true, originalName: true, mimeType: true, width: true, height: true } },
          board: { select: { id: true, nameKey: true, slug: true } },
        },
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.popup.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: { popups: popups.map(serializePopup), total },
      meta: { total, page, limit, hasNext: page * limit < total },
    })
  } catch (error) {
    console.error('Failed to fetch popups:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '팝업을 불러오는데 실패했습니다.' } },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.name) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_BODY', message: '팝업 이름은 필수입니다.' } },
        { status: 400 },
      )
    }

    const popup = await prisma.popup.create({
      data: {
        name: body.name,
        type: body.type ?? 'image',
        imageId: body.imageId ? BigInt(body.imageId) : null,
        htmlContent: body.htmlContent ?? null,
        displayScope: body.displayScope ?? 'all',
        boardId: body.boardId ? BigInt(body.boardId) : null,
        widthPx: body.widthPx ?? 500,
        heightPx: body.heightPx ?? 400,
        posX: body.posX ?? 50,
        posY: body.posY ?? 50,
        dismissOptions: body.dismissOptions ?? ['today'],
        targetAudience: body.targetAudience ?? 'all',
        minGrade: body.minGrade ?? 0,
        targetNewDays: body.targetNewDays ?? null,
        targetRegion: body.targetRegion ?? null,
        animation: body.animation ?? 'fade',
        abGroup: body.abGroup ?? null,
        abRatio: body.abRatio ?? 50,
        priority: body.priority ?? 0,
        maxDisplay: body.maxDisplay ?? 1,
        startsAt: body.startsAt ? new Date(body.startsAt) : null,
        endsAt: body.endsAt ? new Date(body.endsAt) : null,
        isActive: body.isActive ?? true,
      },
      include: {
        image: { select: { id: true, originalName: true, mimeType: true, width: true, height: true } },
        board: { select: { id: true, nameKey: true, slug: true } },
      },
    })

    return NextResponse.json({ success: true, data: serializePopup(popup) }, { status: 201 })
  } catch (error) {
    console.error('Failed to create popup:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '팝업 생성에 실패했습니다.' } },
      { status: 500 },
    )
  }
}
