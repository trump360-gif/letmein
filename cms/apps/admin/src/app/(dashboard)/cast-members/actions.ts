'use server'

import { prisma } from '@letmein/db'
import { revalidatePath } from 'next/cache'

export async function verifyCastMember(castMemberId: number) {
  await prisma.castMember.update({
    where: { id: BigInt(castMemberId) },
    data: {
      verificationStatus: 'verified',
      verifiedAt: new Date(),
      verifiedBy: BigInt(1),
      rejectionReason: null,
    },
  })
  revalidatePath('/cast-members')
}

export async function rejectCastMember(castMemberId: number, reason: string) {
  await prisma.castMember.update({
    where: { id: BigInt(castMemberId) },
    data: {
      verificationStatus: 'rejected',
      verifiedAt: new Date(),
      verifiedBy: BigInt(1),
      rejectionReason: reason,
    },
  })
  revalidatePath('/cast-members')
}
