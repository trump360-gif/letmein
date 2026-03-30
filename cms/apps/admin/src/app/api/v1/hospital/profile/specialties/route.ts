import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@letmein/db'
import { getSessionHospitalId } from '@/lib/session'

export async function GET() {
  const hospitalId = await getSessionHospitalId()
  if (!hospitalId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [specialties, allCategories] = await Promise.all([
    prisma.hospitalSpecialty.findMany({
      where: { hospitalId },
      include: {
        category: {
          select: { id: true, name: true },
        },
      },
    }),
    prisma.procedureCategory.findMany({
      orderBy: { sortOrder: 'asc' },
      select: { id: true, name: true },
    }),
  ])

  return NextResponse.json({
    specialties: specialties.map((s) => ({
      id: s.id.toString(),
      categoryId: s.categoryId,
      category: s.category,
    })),
    allCategories,
  })
}

export async function POST(request: NextRequest) {
  const hospitalId = await getSessionHospitalId()
  if (!hospitalId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { categoryId } = body as { categoryId: number }

  if (!categoryId || typeof categoryId !== 'number') {
    return NextResponse.json({ error: 'categoryId is required' }, { status: 400 })
  }

  try {
    const specialty = await prisma.hospitalSpecialty.create({
      data: { hospitalId, categoryId },
      include: {
        category: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json({
      id: specialty.id.toString(),
      categoryId: specialty.categoryId,
      category: specialty.category,
    })
  } catch (error: unknown) {
    // Prisma unique constraint violation
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code: string }).code === 'P2002'
    ) {
      return NextResponse.json({ error: '이미 추가된 전문분야입니다.' }, { status: 409 })
    }
    throw error
  }
}

export async function DELETE(request: NextRequest) {
  const hospitalId = await getSessionHospitalId()
  if (!hospitalId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { categoryId } = body as { categoryId: number }

  if (!categoryId || typeof categoryId !== 'number') {
    return NextResponse.json({ error: 'categoryId is required' }, { status: 400 })
  }

  await prisma.hospitalSpecialty.delete({
    where: {
      hospitalId_categoryId: { hospitalId, categoryId },
    },
  })

  return NextResponse.json({ success: true })
}
