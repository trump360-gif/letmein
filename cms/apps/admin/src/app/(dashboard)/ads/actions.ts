'use server'

import { prisma } from '@letmein/db'
import { revalidatePath } from 'next/cache'

export async function approveAdCreative(creativeId: number) {
  await prisma.adCreative.update({
    where: { id: BigInt(creativeId) },
    data: {
      reviewStatus: 'approved',
      rejectionReason: null,
      reviewedAt: new Date(),
      reviewedBy: BigInt(1),
    },
  })
  revalidatePath('/ads')
}

export async function rejectAdCreative(creativeId: number, reason: string) {
  await prisma.adCreative.update({
    where: { id: BigInt(creativeId) },
    data: {
      reviewStatus: 'rejected',
      rejectionReason: reason,
      reviewedAt: new Date(),
      reviewedBy: BigInt(1),
    },
  })
  revalidatePath('/ads')
}
