import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@letmein/db'
import { getSessionHospitalId } from '@/lib/session'

interface RouteParams {
  params: { id: string }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const hospitalId = await getSessionHospitalId()
  if (!hospitalId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const doctorId = BigInt(params.id)

  const existing = await prisma.hospitalDoctor.findFirst({
    where: { id: doctorId, hospitalId },
  })
  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const body = await request.json()
  const { name, title, experience, profileImage } = body

  const updated = await prisma.hospitalDoctor.update({
    where: { id: doctorId },
    data: {
      ...(name !== undefined ? { name: String(name).trim() } : {}),
      ...(title !== undefined ? { title: title ?? null } : {}),
      ...(experience !== undefined ? { experience: experience ?? null } : {}),
      ...(profileImage !== undefined ? { profileImage: profileImage ?? null } : {}),
    },
  })

  return NextResponse.json({
    doctor: {
      ...updated,
      id: updated.id.toString(),
      hospitalId: updated.hospitalId.toString(),
    },
  })
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const hospitalId = await getSessionHospitalId()
  if (!hospitalId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const doctorId = BigInt(params.id)

  const existing = await prisma.hospitalDoctor.findFirst({
    where: { id: doctorId, hospitalId },
  })
  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await prisma.hospitalDoctor.delete({ where: { id: doctorId } })

  return new NextResponse(null, { status: 204 })
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const hospitalId = await getSessionHospitalId()
  if (!hospitalId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (params.id === 'order') {
    // 순서 일괄 저장
    const body = await request.json()
    const orders: Array<{ id: number; sortOrder: number }> = body.orders

    if (!Array.isArray(orders)) {
      return NextResponse.json({ error: 'orders array is required' }, { status: 400 })
    }

    // 현재 병원 소속 의사 ID 목록 조회
    const doctorIds = orders.map((o) => BigInt(o.id))
    const ownedDoctors = await prisma.hospitalDoctor.findMany({
      where: { id: { in: doctorIds }, hospitalId },
      select: { id: true },
    })
    const ownedIds = new Set(ownedDoctors.map((d) => d.id.toString()))

    // 소속 확인
    for (const o of orders) {
      if (!ownedIds.has(String(o.id))) {
        return NextResponse.json(
          { error: `Doctor ${o.id} not found in this hospital` },
          { status: 403 },
        )
      }
    }

    await prisma.$transaction(
      orders.map((o) =>
        prisma.hospitalDoctor.update({
          where: { id: BigInt(o.id) },
          data: { sortOrder: o.sortOrder },
        }),
      ),
    )

    return NextResponse.json({ success: true })
  }

  // 단일 의사 부분 수정 (PATCH로도 개별 수정 허용)
  const doctorId = BigInt(params.id)

  const existing = await prisma.hospitalDoctor.findFirst({
    where: { id: doctorId, hospitalId },
  })
  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const body = await request.json()
  const { name, title, experience, profileImage } = body

  const updated = await prisma.hospitalDoctor.update({
    where: { id: doctorId },
    data: {
      ...(name !== undefined ? { name: String(name).trim() } : {}),
      ...(title !== undefined ? { title: title ?? null } : {}),
      ...(experience !== undefined ? { experience: experience ?? null } : {}),
      ...(profileImage !== undefined ? { profileImage: profileImage ?? null } : {}),
    },
  })

  return NextResponse.json({
    doctor: {
      ...updated,
      id: updated.id.toString(),
      hospitalId: updated.hospitalId.toString(),
    },
  })
}
