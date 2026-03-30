import { NextResponse } from 'next/server'
import { prisma } from '@letmein/db'
import { getSessionHospitalId } from '@/lib/session'

export async function GET() {
  const hospitalId = await getSessionHospitalId()
  if (!hospitalId) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED' } },
      { status: 401 },
    )
  }

  const subscription = await prisma.hospitalSubscription.findFirst({
    where: { hospitalId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      hospitalId: true,
      tier: true,
      status: true,
      startedAt: true,
      expiresAt: true,
    },
  })

  if (!subscription) {
    return NextResponse.json({ success: true, data: { subscription: null } })
  }

  const now = new Date()
  const isActive = subscription.status === 'active' && subscription.expiresAt > now

  return NextResponse.json({
    success: true,
    data: {
      subscription: {
        id: Number(subscription.id),
        hospitalId: Number(subscription.hospitalId),
        tier: subscription.tier as 'basic' | 'premium' | 'vip',
        startDate: subscription.startedAt.toISOString(),
        endDate: subscription.expiresAt.toISOString(),
        isActive,
        createdAt: subscription.startedAt.toISOString(),
      },
    },
  })
}
