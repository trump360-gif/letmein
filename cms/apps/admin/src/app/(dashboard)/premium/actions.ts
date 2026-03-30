'use server'

import { prisma } from '@letmein/db'
import { revalidatePath } from 'next/cache'

export async function cancelSubscription(subscriptionId: number) {
  await prisma.hospitalSubscription.update({
    where: { id: BigInt(subscriptionId) },
    data: { status: 'cancelled', cancelledAt: new Date() },
  })
  revalidatePath('/premium')
}

export async function grantSubscription(
  hospitalId: number,
  tier: 'basic' | 'standard' | 'premium',
  expiresAt: string, // ISO date string e.g. "2026-12-31"
) {
  const monthlyPrice = { basic: 99000, standard: 199000, premium: 399000 }[tier]

  await prisma.$transaction(async (tx) => {
    // 기존 active 구독이 있으면 만료 처리
    await tx.hospitalSubscription.updateMany({
      where: { hospitalId: BigInt(hospitalId), status: 'active' },
      data: { status: 'expired' },
    })

    // 새 구독 생성
    await tx.hospitalSubscription.create({
      data: {
        hospitalId: BigInt(hospitalId),
        tier,
        status: 'active',
        startedAt: new Date(),
        expiresAt: new Date(expiresAt),
        monthlyPrice,
      },
    })

    // 병원 isPremium / premiumTier 업데이트
    await tx.hospital.update({
      where: { id: BigInt(hospitalId) },
      data: { isPremium: true, premiumTier: tier },
    })
  })

  revalidatePath('/premium')
}
