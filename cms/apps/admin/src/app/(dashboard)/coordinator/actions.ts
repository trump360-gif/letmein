'use server'

import { prisma } from '@letmein/db'
import { revalidatePath } from 'next/cache'

export async function matchHospital(requestId: number, hospitalId: number, note: string) {
  await prisma.$transaction(async (tx) => {
    await tx.coordinatorMatch.create({
      data: {
        requestId: BigInt(requestId),
        hospitalId: BigInt(hospitalId),
        matchedBy: BigInt(1),
        note: note || null,
      },
    })
    await tx.consultationRequest.update({
      where: { id: BigInt(requestId) },
      data: { status: 'matched', matchedAt: new Date() },
    })
  })
  revalidatePath('/coordinator')
}

export async function updateConsultationStatus(requestId: number, status: string, note?: string) {
  await prisma.consultationRequest.update({
    where: { id: BigInt(requestId) },
    data: {
      status,
      coordinatorNote: note ?? null,
    },
  })
  revalidatePath('/coordinator')
}
