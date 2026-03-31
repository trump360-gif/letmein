import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@letmein/db'
import { getSessionHospitalId } from '@/lib/session'

export async function GET() {
  try {
  const hospitalId = await getSessionHospitalId()
  if (!hospitalId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const hospital = await prisma.hospital.findUnique({
    where: { id: hospitalId },
    select: {
      id: true,
      name: true,
      description: true,
      address: true,
      phone: true,
      operatingHours: true,
      profileImage: true,
      detailedDescription: true,
      galleryImages: true,
    },
  })

  if (!hospital) {
    return NextResponse.json({ error: 'Hospital not found' }, { status: 404 })
  }

  return NextResponse.json({
    id: hospital.id.toString(),
    name: hospital.name,
    description: hospital.description,
    address: hospital.address,
    phone: hospital.phone,
    operatingHours: hospital.operatingHours,
    profileImage: hospital.profileImage,
    detailedDescription: hospital.detailedDescription,
    galleryImages: hospital.galleryImages,
  })
  } catch (error) {
    console.error('Profile GET error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const hospitalId = await getSessionHospitalId()
  if (!hospitalId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  // name 필드는 의도적으로 무시
  const { address, phone, operatingHours, profileImage, detailedDescription } = body

  const updated = await prisma.hospital.update({
    where: { id: hospitalId },
    data: {
      ...(address !== undefined && { address }),
      ...(phone !== undefined && { phone }),
      ...(operatingHours !== undefined && { operatingHours }),
      ...(profileImage !== undefined && { profileImage }),
      ...(detailedDescription !== undefined && { detailedDescription }),
    },
    select: {
      id: true,
      name: true,
      address: true,
      phone: true,
      operatingHours: true,
      profileImage: true,
      detailedDescription: true,
    },
  })

  return NextResponse.json({
    id: updated.id.toString(),
    name: updated.name,
    address: updated.address,
    phone: updated.phone,
    operatingHours: updated.operatingHours,
    profileImage: updated.profileImage,
    detailedDescription: updated.detailedDescription,
  })
}
