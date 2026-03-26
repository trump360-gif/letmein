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

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const id = BigInt(params.id)
    const body = await request.json()

    const existing = await prisma.popup.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '팝업을 찾을 수 없습니다.' } },
        { status: 404 },
      )
    }

    const data: any = {}
    if (body.name !== undefined) data.name = body.name
    if (body.type !== undefined) data.type = body.type
    if (body.imageId !== undefined) data.imageId = body.imageId ? BigInt(body.imageId) : null
    if (body.htmlContent !== undefined) data.htmlContent = body.htmlContent
    if (body.displayScope !== undefined) data.displayScope = body.displayScope
    if (body.boardId !== undefined) data.boardId = body.boardId ? BigInt(body.boardId) : null
    if (body.widthPx !== undefined) data.widthPx = body.widthPx
    if (body.heightPx !== undefined) data.heightPx = body.heightPx
    if (body.posX !== undefined) data.posX = body.posX
    if (body.posY !== undefined) data.posY = body.posY
    if (body.dismissOptions !== undefined) data.dismissOptions = body.dismissOptions
    if (body.targetAudience !== undefined) data.targetAudience = body.targetAudience
    if (body.minGrade !== undefined) data.minGrade = body.minGrade
    if (body.targetNewDays !== undefined) data.targetNewDays = body.targetNewDays
    if (body.targetRegion !== undefined) data.targetRegion = body.targetRegion
    if (body.animation !== undefined) data.animation = body.animation
    if (body.abGroup !== undefined) data.abGroup = body.abGroup
    if (body.abRatio !== undefined) data.abRatio = body.abRatio
    if (body.priority !== undefined) data.priority = body.priority
    if (body.maxDisplay !== undefined) data.maxDisplay = body.maxDisplay
    if (body.startsAt !== undefined) data.startsAt = body.startsAt ? new Date(body.startsAt) : null
    if (body.endsAt !== undefined) data.endsAt = body.endsAt ? new Date(body.endsAt) : null
    if (body.isActive !== undefined) data.isActive = body.isActive

    const popup = await prisma.popup.update({
      where: { id },
      data,
      include: {
        image: { select: { id: true, originalName: true, mimeType: true, width: true, height: true } },
        board: { select: { id: true, nameKey: true, slug: true } },
      },
    })

    return NextResponse.json({ success: true, data: serializePopup(popup) })
  } catch (error) {
    console.error('Failed to update popup:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '팝업 수정에 실패했습니다.' } },
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

    const existing = await prisma.popup.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '팝업을 찾을 수 없습니다.' } },
        { status: 404 },
      )
    }

    await prisma.popup.delete({ where: { id } })

    return NextResponse.json({ success: true, data: { id: params.id } })
  } catch (error) {
    console.error('Failed to delete popup:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '팝업 삭제에 실패했습니다.' } },
      { status: 500 },
    )
  }
}
