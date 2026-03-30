'use server'

import { prisma } from '@letmein/db'
import { revalidatePath } from 'next/cache'
import { getSessionAdminId } from '@/lib/session'

export async function verifyCastMember(castMemberId: number) {
  const adminId = await getSessionAdminId() ?? BigInt(1)
  await prisma.castMember.update({
    where: { id: BigInt(castMemberId) },
    data: {
      verificationStatus: 'verified',
      verifiedAt: new Date(),
      verifiedBy: adminId,
      rejectionReason: null,
    },
  })
  revalidatePath('/cast-members')
}

export async function rejectCastMember(castMemberId: number, reason: string) {
  const adminId = await getSessionAdminId() ?? BigInt(1)
  await prisma.castMember.update({
    where: { id: BigInt(castMemberId) },
    data: {
      verificationStatus: 'rejected',
      verifiedAt: new Date(),
      verifiedBy: adminId,
      rejectionReason: reason,
    },
  })
  revalidatePath('/cast-members')
}
