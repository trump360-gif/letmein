import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@letmein/db'
import { getSessionHospitalId } from '@/lib/session'

export async function GET() {
  const hospitalId = await getSessionHospitalId()
  if (!hospitalId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const doctors = await prisma.hospitalDoctor.findMany({
    where: { hospitalId },
    orderBy: { sortOrder: 'asc' },
  })

  return NextResponse.json({
    doctors: doctors.map((d) => ({
      ...d,
      id: d.id.toString(),
      hospitalId: d.hospitalId.toString(),
    })),
  })
}

export async function POST(request: NextRequest) {
  const hospitalId = await getSessionHospitalId()
  if (!hospitalId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { name, title, experience, profileImage } = body

  if (!name || typeof name !== 'string' || name.trim() === '') {
    return NextResponse.json({ error: 'name is required' }, { status: 400 })
  }

  const aggregate = await prisma.hospitalDoctor.aggregate({
    where: { hospitalId },
    _max: { sortOrder: true },
  })
  const nextSortOrder = (aggregate._max.sortOrder ?? 0) + 1

  const doctor = await prisma.hospitalDoctor.create({
    data: {
      hospitalId,
      name: name.trim(),
      title: title ?? null,
      experience: experience ?? null,
      profileImage: profileImage ?? null,
      sortOrder: nextSortOrder,
    },
  })

  return NextResponse.json(
    {
      doctor: {
        ...doctor,
        id: doctor.id.toString(),
        hospitalId: doctor.hospitalId.toString(),
      },
    },
    { status: 201 },
  )
}
