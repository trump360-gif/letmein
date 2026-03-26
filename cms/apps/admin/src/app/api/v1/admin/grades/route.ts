import { NextResponse } from 'next/server'
import { prisma } from '@letmein/db'

export async function GET() {
  try {
    const grades = await prisma.userGrade.findMany({
      orderBy: { grade: 'asc' },
    })

    return NextResponse.json({
      success: true,
      data: grades.map((g) => ({
        id: Number(g.id),
        grade: g.grade,
        name: g.name,
        conditions: g.conditions,
        autoUpgrade: g.autoUpgrade,
        notifyUpgrade: g.notifyUpgrade,
        storageLimitMb: g.storageLimitMb,
        createdAt: g.createdAt.toISOString(),
        updatedAt: g.updatedAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error('Failed to fetch grades:', error)
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '등급 목록을 불러오는데 실패했습니다.' },
      },
      { status: 500 },
    )
  }
}
