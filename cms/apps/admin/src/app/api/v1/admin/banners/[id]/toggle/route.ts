import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@letmein/db'

export async function PATCH(
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

    const banner = await prisma.banner.update({
      where: { id },
      data: { isActive: !existing.isActive },
    })

    return NextResponse.json({
      success: true,
      data: { id: banner.id.toString(), isActive: banner.isActive },
    })
  } catch (error) {
    console.error('Failed to toggle banner:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '배너 상태 변경에 실패했습니다.' } },
      { status: 500 },
    )
  }
}
