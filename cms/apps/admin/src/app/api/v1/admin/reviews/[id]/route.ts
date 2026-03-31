import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@letmein/db'
import { getSessionAdminId } from '@/lib/session'

const VALID_STATUSES = ['active', 'blinded', 'deleted'] as const
type ReviewStatus = (typeof VALID_STATUSES)[number]

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const adminId = await getSessionAdminId()
    if (!adminId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다.' } },
        { status: 401 },
      )
    }

    const { id } = await params
    const reviewId = BigInt(id)

    const body = await request.json()
    const { status } = body as { status: unknown }

    if (!status || !VALID_STATUSES.includes(status as ReviewStatus)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_BODY',
            message: `status는 ${VALID_STATUSES.join(', ')} 중 하나여야 합니다.`,
          },
        },
        { status: 400 },
      )
    }

    // Verify the review exists
    const existing = await prisma.$queryRaw<Array<{ id: bigint }>>`
      SELECT id FROM reviews WHERE id = ${reviewId}
    `

    if (existing.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '리뷰를 찾을 수 없습니다.' } },
        { status: 404 },
      )
    }

    await prisma.$executeRaw`
      UPDATE reviews
      SET status = ${status as string}, updated_at = NOW()
      WHERE id = ${reviewId}
    `

    return NextResponse.json({
      success: true,
      data: { id: id, status },
    })
  } catch (error) {
    console.error('Failed to update review status:', error)
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '리뷰 상태 변경에 실패했습니다.' },
      },
      { status: 500 },
    )
  }
}
