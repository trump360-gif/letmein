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
