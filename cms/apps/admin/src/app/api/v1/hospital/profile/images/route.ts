import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@letmein/db'
import { getSessionHospitalId } from '@/lib/session'

export async function GET() {
  const hospitalId = await getSessionHospitalId()
  if (!hospitalId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const hospital = await prisma.hospital.findUnique({
    where: { id: hospitalId },
    select: { galleryImages: true },
  })

  if (!hospital) {
    return NextResponse.json({ error: 'Hospital not found' }, { status: 404 })
  }

  let images: string[] = []
  try {
    images = JSON.parse(hospital.galleryImages || '[]')
  } catch {
    images = []
  }

  return NextResponse.json({ images })
}

export async function PUT(request: NextRequest) {
  const hospitalId = await getSessionHospitalId()
  if (!hospitalId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { images } = body as { images: string[] }

  if (!Array.isArray(images)) {
    return NextResponse.json({ error: 'images must be an array' }, { status: 400 })
  }

  if (images.length > 10) {
    return NextResponse.json({ error: '이미지는 최대 10장까지 등록할 수 있습니다.' }, { status: 400 })
  }

  await prisma.hospital.update({
    where: { id: hospitalId },
    data: { galleryImages: JSON.stringify(images) },
  })

  return NextResponse.json({ images })
}
