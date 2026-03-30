import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@letmein/db'
import { getSessionAdminId } from '@/lib/session'

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { reviewStatus, rejectionReason } = body

    if (!reviewStatus || !['approved', 'rejected'].includes(reviewStatus)) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'reviewStatus는 approved 또는 rejected여야 합니다.' } },
        { status: 400 },
      )
    }

    const adminId = await getSessionAdminId() ?? BigInt(1)

    await prisma.adCreative.update({
      where: { id: BigInt(params.id) },
      data: {
        reviewStatus,
        rejectionReason: reviewStatus === 'rejected' ? (rejectionReason || null) : null,
        reviewedAt: new Date(),
        reviewedBy: adminId,
      },
    })

    return NextResponse.json({ success: true, data: { message: '광고 심사가 완료되었습니다.' } })
  } catch (error) {
    console.error('Failed to review ad creative:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '광고 심사에 실패했습니다.' } },
      { status: 500 },
    )
  }
}
