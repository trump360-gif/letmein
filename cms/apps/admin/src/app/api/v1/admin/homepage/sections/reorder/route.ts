import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@letmein/db'

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { sectionIds } = body as { sectionIds: string[] }

    if (!sectionIds || !Array.isArray(sectionIds)) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_BODY', message: 'sectionIds 배열이 필요합니다.' } },
        { status: 400 },
      )
    }

    await prisma.$transaction(
      sectionIds.map((id, index) =>
        prisma.homepageSection.update({
          where: { id: BigInt(id) },
          data: { sortOrder: index },
        }),
      ),
    )

    const sections = await prisma.homepageSection.findMany({
      orderBy: { sortOrder: 'asc' },
    })

    return NextResponse.json({
      success: true,
      data: sections.map((s) => ({
        id: s.id.toString(),
        type: s.type,
        title: s.title,
        config: s.config as Record<string, unknown>,
        sortOrder: s.sortOrder,
        isActive: s.isActive,
        updatedAt: s.updatedAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error('Failed to reorder sections:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '섹션 순서 변경에 실패했습니다.' } },
      { status: 500 },
    )
  }
}
