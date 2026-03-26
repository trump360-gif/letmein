import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@letmein/db'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const adminId = BigInt(params.id)

    const admin = await prisma.adminUser.findUnique({ where: { id: adminId } })
    if (!admin) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '관리자를 찾을 수 없습니다.' } },
        { status: 404 },
      )
    }

    await prisma.adminUser.delete({ where: { id: adminId } })

    return NextResponse.json({ success: true, data: null })
  } catch (error) {
    console.error('Failed to delete admin:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '관리자 제거에 실패했습니다.' } },
      { status: 500 },
    )
  }
}
