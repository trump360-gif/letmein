'use server'

import { prisma } from '@letmein/db'
import { revalidatePath } from 'next/cache'

export async function approveHospital(hospitalId: number) {
  await prisma.hospital.update({
    where: { id: BigInt(hospitalId) },
    data: { status: 'approved', approvedAt: new Date() },
  })
  revalidatePath('/hospitals')
}

export async function rejectHospital(hospitalId: number, reason?: string) {
  await prisma.hospital.update({
    where: { id: BigInt(hospitalId) },
    data: { status: 'rejected' },
  })
  revalidatePath('/hospitals')
}

export async function suspendHospital(hospitalId: number) {
  await prisma.hospital.update({
    where: { id: BigInt(hospitalId) },
    data: { status: 'suspended' },
  })
  revalidatePath('/hospitals')
}
