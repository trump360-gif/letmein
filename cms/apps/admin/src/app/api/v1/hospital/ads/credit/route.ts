import { NextResponse } from 'next/server'
import { prisma } from '@letmein/db'
import { getSessionHospitalId } from '@/lib/session'

export async function GET() {
  const hospitalId = await getSessionHospitalId()
  if (!hospitalId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const credit = await prisma.adCredit.findUnique({
    where: { hospitalId },
    select: {
      id: true,
      hospitalId: true,
      balance: true,
      updatedAt: true,
    },
  })

  if (!credit) {
    // Return zero balance if no credit record exists yet
    return NextResponse.json({
      credit: {
        id: 0,
        hospital_id: Number(hospitalId),
        balance: 0,
        updated_at: new Date().toISOString(),
      },
    })
  }

  return NextResponse.json({
    credit: {
      id: Number(credit.id),
      hospital_id: Number(credit.hospitalId),
      balance: credit.balance,
      updated_at: credit.updatedAt?.toISOString() ?? new Date().toISOString(),
    },
  })
}
