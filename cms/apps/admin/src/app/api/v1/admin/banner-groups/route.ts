import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@letmein/db'

export async function GET() {
  try {
    const groups = await prisma.bannerGroup.findMany({
      include: { _count: { select: { banners: true } } },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      success: true,
      data: {
        groups: groups.map((g) => ({
          id: g.id.toString(),
          name: g.name,
          isActive: g.isActive,
          createdAt: g.createdAt.toISOString(),
          _count: g._count,
        })),
      },
    })
  } catch (error) {
    console.error('Failed to fetch banner groups:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '배너 그룹을 불러오는데 실패했습니다.' } },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.name) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_BODY', message: '그룹 이름은 필수입니다.' } },
        { status: 400 },
      )
    }

    const group = await prisma.bannerGroup.create({
      data: {
        name: body.name,
        isActive: body.isActive ?? true,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        id: group.id.toString(),
        name: group.name,
        isActive: group.isActive,
        createdAt: group.createdAt.toISOString(),
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Failed to create banner group:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '배너 그룹 생성에 실패했습니다.' } },
      { status: 500 },
    )
  }
}
