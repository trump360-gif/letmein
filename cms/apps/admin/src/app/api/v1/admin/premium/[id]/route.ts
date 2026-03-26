import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@letmein/db'

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const subscription = await prisma.hospitalSubscription.findUnique({
      where: { id: BigInt(params.id) },
      include: {
        hospital: { select: { name: true } },
      },
    })

    if (!subscription) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '구독을 찾을 수 없습니다.' } },
        { status: 404 },
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: Number(subscription.id),
        hospitalId: Number(subscription.hospitalId),
        tier: subscription.tier,
        status: subscription.status,
        startedAt: subscription.startedAt.toISOString(),
        expiresAt: subscription.expiresAt.toISOString(),
        cancelledAt: subscription.cancelledAt?.toISOString() ?? null,
        monthlyPrice: subscription.monthlyPrice,
        createdAt: (subscription.createdAt ?? new Date()).toISOString(),
        updatedAt: (subscription.updatedAt ?? new Date()).toISOString(),
        hospitalName: subscription.hospital.name,
      },
    })
  } catch (error) {
    console.error('Failed to fetch subscription:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '구독 정보를 불러오는데 실패했습니다.' } },
      { status: 500 },
    )
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { status, tier, expiresAt } = body

    const data: Record<string, unknown> = {}
    if (status) {
      data.status = status
      if (status === 'cancelled') data.cancelledAt = new Date()
    }
    if (tier) data.tier = tier
    if (expiresAt) data.expiresAt = new Date(expiresAt)

    await prisma.hospitalSubscription.update({
      where: { id: BigInt(params.id) },
      data,
    })

    return NextResponse.json({ success: true, data: { message: '구독이 업데이트되었습니다.' } })
  } catch (error) {
    console.error('Failed to update subscription:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '구독 업데이트에 실패했습니다.' } },
      { status: 500 },
    )
  }
}
