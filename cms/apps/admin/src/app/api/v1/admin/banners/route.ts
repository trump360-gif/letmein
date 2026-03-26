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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const position = searchParams.get('position')
    const groupId = searchParams.get('groupId')
    const isActive = searchParams.get('isActive')
    const page = parseInt(searchParams.get('page') ?? '1')
    const limit = parseInt(searchParams.get('limit') ?? '20')

    const where: any = { deletedAt: null }
    if (position) where.position = position
    if (groupId) where.groupId = BigInt(groupId)
    if (isActive !== null && isActive !== '') where.isActive = isActive === 'true'

    const [banners, total] = await Promise.all([
      prisma.banner.findMany({
        where,
        include: {
          group: true,
          pcImage: { select: mediaSelect },
          mobileImage: { select: mediaSelect },
          tabletImage: { select: mediaSelect },
        },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.banner.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: { banners: banners.map(serializeBanner), total },
      meta: { total, page, limit, hasNext: page * limit < total },
    })
  } catch (error) {
    console.error('Failed to fetch banners:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '배너를 불러오는데 실패했습니다.' } },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.name || !body.position) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_BODY', message: '배너 이름과 위치는 필수입니다.' } },
        { status: 400 },
      )
    }

    const banner = await prisma.banner.create({
      data: {
        groupId: body.groupId ? BigInt(body.groupId) : null,
        name: body.name,
        position: body.position,
        type: body.type ?? 'image',
        pcImageId: body.pcImageId ? BigInt(body.pcImageId) : null,
        mobileImageId: body.mobileImageId ? BigInt(body.mobileImageId) : null,
        tabletImageId: body.tabletImageId ? BigInt(body.tabletImageId) : null,
        altText: body.altText ?? null,
        textContent: body.textContent ?? null,
        bgColor: body.bgColor ?? null,
        textColor: body.textColor ?? null,
        linkUrl: body.linkUrl ?? null,
        openNewTab: body.openNewTab ?? false,
        utmCampaign: body.utmCampaign ?? null,
        targetAudience: body.targetAudience ?? 'all',
        minGrade: body.minGrade ?? 0,
        startsAt: body.startsAt ? new Date(body.startsAt) : null,
        endsAt: body.endsAt ? new Date(body.endsAt) : null,
        sortOrder: body.sortOrder ?? 0,
        isActive: body.isActive ?? true,
        dismissOptions: body.dismissOptions ?? ['today'],
        abGroup: body.abGroup ?? null,
        abRatio: body.abRatio ?? 50,
      },
      include: {
        group: true,
        pcImage: { select: mediaSelect },
        mobileImage: { select: mediaSelect },
        tabletImage: { select: mediaSelect },
      },
    })

    return NextResponse.json({ success: true, data: serializeBanner(banner) }, { status: 201 })
  } catch (error) {
    console.error('Failed to create banner:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '배너 생성에 실패했습니다.' } },
      { status: 500 },
    )
  }
}
