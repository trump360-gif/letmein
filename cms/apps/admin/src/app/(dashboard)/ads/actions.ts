'use server'

import { prisma } from '@letmein/db'
import { revalidatePath } from 'next/cache'
import { getSessionAdminId } from '@/lib/session'

export async function approveAdCreative(creativeId: number) {
  const adminId = await getSessionAdminId() ?? BigInt(1)
  await prisma.adCreative.update({
    where: { id: BigInt(creativeId) },
    data: {
      reviewStatus: 'approved',
      rejectionReason: null,
      reviewedAt: new Date(),
      reviewedBy: adminId,
    },
  })
  revalidatePath('/ads')
}

export async function rejectAdCreative(creativeId: number, reason: string) {
  const adminId = await getSessionAdminId() ?? BigInt(1)
  await prisma.adCreative.update({
    where: { id: BigInt(creativeId) },
    data: {
      reviewStatus: 'rejected',
      rejectionReason: reason,
      reviewedAt: new Date(),
      reviewedBy: adminId,
    },
  })
  revalidatePath('/ads')
}
