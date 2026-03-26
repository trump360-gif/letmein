import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@letmein/db'

export async function GET() {
  try {
    const sections = await prisma.homepageSection.findMany({
      orderBy: { sort_order: 'asc' },
    })

    return NextResponse.json({
      success: true,
      data: sections.map(serializeSection),
    })
  } catch (error) {
    console.error('Failed to fetch sections:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '섹션을 불러오는데 실패했습니다.' } },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, config, isVisible, sortOrder } = body as {
      type: string
      config: Record<string, unknown>
      isVisible?: boolean
      sortOrder?: number
    }

    if (!type) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_BODY', message: 'type은 필수입니다.' } },
        { status: 400 },
      )
    }

    // sortOrder가 없으면 마지막에 추가
    let order = sortOrder
    if (order === undefined) {
      const last = await prisma.homepageSection.findFirst({
        orderBy: { sort_order: 'desc' },
        select: { sort_order: true },
      })
      order = (last?.sort_order ?? 0) + 1
    }

    const section = await prisma.homepageSection.create({
      data: {
        type,
        config: config ? JSON.stringify(config) : null,
        is_visible: isVisible ?? true,
        sort_order: order,
      },
    })

    return NextResponse.json({
      success: true,
      data: serializeSection(section),
    })
  } catch (error) {
    console.error('Failed to create section:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '섹션 생성에 실패했습니다.' } },
      { status: 500 },
    )
  }
}

function serializeSection(s: {
  id: bigint
  type: string
  config: string | null
  sort_order: number | null
  is_visible: boolean | null
  updated_at: Date | null
}) {
  return {
    id: s.id.toString(),
    type: s.type,
    config: s.config ? (JSON.parse(s.config) as Record<string, unknown>) : {},
    sortOrder: s.sort_order,
    isVisible: s.is_visible,
    updatedAt: s.updated_at?.toISOString() ?? null,
  }
}
