import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@letmein/db'

const mediaSelect = {
  id: true,
  originalName: true,
  mimeType: true,
  sizeBytes: true,
  width: true,
  height: true,
}

function serializeBanner(b: any) {
  return {
    id: b.id.toString(),
    groupId: b.groupId?.toString() ?? null,
    name: b.name,
    position: b.position,
    type: b.type,
    pcImageId: b.pcImageId?.toString() ?? null,
    mobileImageId: b.mobileImageId?.toString() ?? null,
    tabletImageId: b.tabletImageId?.toString() ?? null,
    altText: b.altText,
    textContent: b.textContent,
    bgColor: b.bgColor,
    textColor: b.textColor,
    linkUrl: b.linkUrl,
    openNewTab: b.openNewTab,
    utmCampaign: b.utmCampaign,
    targetAudience: b.targetAudience,
    minGrade: b.minGrade,
    startsAt: b.startsAt?.toISOString() ?? null,
    endsAt: b.endsAt?.toISOString() ?? null,
    sortOrder: b.sortOrder,
    isActive: b.isActive,
    dismissOptions: b.dismissOptions,
    abGroup: b.abGroup,
    abRatio: b.abRatio,
    createdAt: b.createdAt.toISOString(),
    updatedAt: b.updatedAt.toISOString(),
    deletedAt: b.deletedAt?.toISOString() ?? null,
    group: b.group ? { id: b.group.id.toString(), name: b.group.name, isActive: b.group.isActive, createdAt: b.group.createdAt.toISOString() } : null,
    pcImage: b.pcImage ? { ...b.pcImage, id: b.pcImage.id.toString() } : null,
    mobileImage: b.mobileImage ? { ...b.mobileImage, id: b.mobileImage.id.toString() } : null,
    tabletImage: b.tabletImage ? { ...b.tabletImage, id: b.tabletImage.id.toString() } : null,
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const id = BigInt(params.id)
    const banner = await prisma.banner.findUnique({
      where: { id },
      include: {
        group: true,
        pcImage: { select: mediaSelect },
        mobileImage: { select: mediaSelect },
        tabletImage: { select: mediaSelect },
      },
    })

    if (!banner) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '배너를 찾을 수 없습니다.' } },
        { status: 404 },
      )
    }

    return NextResponse.json({ success: true, data: serializeBanner(banner) })
  } catch (error) {
    console.error('Failed to fetch banner:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '배너를 불러오는데 실패했습니다.' } },
      { status: 500 },
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const id = BigInt(params.id)
    const body = await request.json()

    const existing = await prisma.banner.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '배너를 찾을 수 없습니다.' } },
        { status: 404 },
      )
    }

    const data: any = {}
    if (body.groupId !== undefined) data.groupId = body.groupId ? BigInt(body.groupId) : null
    if (body.name !== undefined) data.name = body.name
    if (body.position !== undefined) data.position = body.position
    if (body.type !== undefined) data.type = body.type
    if (body.pcImageId !== undefined) data.pcImageId = body.pcImageId ? BigInt(body.pcImageId) : null
    if (body.mobileImageId !== undefined) data.mobileImageId = body.mobileImageId ? BigInt(body.mobileImageId) : null
    if (body.tabletImageId !== undefined) data.tabletImageId = body.tabletImageId ? BigInt(body.tabletImageId) : null
    if (body.altText !== undefined) data.altText = body.altText
    if (body.textContent !== undefined) data.textContent = body.textContent
    if (body.bgColor !== undefined) data.bgColor = body.bgColor
    if (body.textColor !== undefined) data.textColor = body.textColor
    if (body.linkUrl !== undefined) data.linkUrl = body.linkUrl
    if (body.openNewTab !== undefined) data.openNewTab = body.openNewTab
    if (body.utmCampaign !== undefined) data.utmCampaign = body.utmCampaign
    if (body.targetAudience !== undefined) data.targetAudience = body.targetAudience
    if (body.minGrade !== undefined) data.minGrade = body.minGrade
    if (body.startsAt !== undefined) data.startsAt = body.startsAt ? new Date(body.startsAt) : null
    if (body.endsAt !== undefined) data.endsAt = body.endsAt ? new Date(body.endsAt) : null
    if (body.sortOrder !== undefined) data.sortOrder = body.sortOrder
    if (body.isActive !== undefined) data.isActive = body.isActive
    if (body.dismissOptions !== undefined) data.dismissOptions = body.dismissOptions
    if (body.abGroup !== undefined) data.abGroup = body.abGroup
    if (body.abRatio !== undefined) data.abRatio = body.abRatio

    const banner = await prisma.banner.update({
      where: { id },
      data,
      include: {
        group: true,
        pcImage: { select: mediaSelect },
        mobileImage: { select: mediaSelect },
        tabletImage: { select: mediaSelect },
      },
    })

    return NextResponse.json({ success: true, data: serializeBanner(banner) })
  } catch (error) {
    console.error('Failed to update banner:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '배너 수정에 실패했습니다.' } },
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

    const existing = await prisma.banner.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '배너를 찾을 수 없습니다.' } },
        { status: 404 },
      )
    }

    // Soft delete
    await prisma.banner.update({
      where: { id },
      data: { deletedAt: new Date() },
    })

    return NextResponse.json({ success: true, data: { id: params.id } })
  } catch (error) {
    console.error('Failed to delete banner:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '배너 삭제에 실패했습니다.' } },
      { status: 500 },
    )
  }
}
