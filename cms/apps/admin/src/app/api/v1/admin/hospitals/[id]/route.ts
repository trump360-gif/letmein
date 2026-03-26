import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@letmein/db'

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const hospital = await prisma.hospital.findUnique({
      where: { id: BigInt(params.id) },
      include: {
        user: { select: { nickname: true } },
        specialties: { include: { category: true } },
        doctors: { orderBy: { sortOrder: 'asc' } },
      },
    })

    if (!hospital) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '병원을 찾을 수 없습니다.' } },
        { status: 404 },
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: Number(hospital.id),
        userId: Number(hospital.userId),
        name: hospital.name,
        businessNumber: hospital.businessNumber,
        licenseImage: hospital.licenseImage,
        description: hospital.description,
        address: hospital.address,
        phone: hospital.phone,
        operatingHours: hospital.operatingHours,
        profileImage: hospital.profileImage,
        status: hospital.status,
        isPremium: hospital.isPremium,
        premiumTier: hospital.premiumTier,
        introVideoUrl: hospital.introVideoUrl,
        detailedDescription: hospital.detailedDescription,
        caseCount: hospital.caseCount,
        approvedAt: hospital.approvedAt?.toISOString() ?? null,
        createdAt: (hospital.createdAt ?? new Date()).toISOString(),
        updatedAt: (hospital.updatedAt ?? new Date()).toISOString(),
        userName: hospital.user.nickname,
        userEmail: null,
      },
    })
  } catch (error) {
    console.error('Failed to fetch hospital:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '병원 정보를 불러오는데 실패했습니다.' } },
      { status: 500 },
    )
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { status } = body

    const data: Record<string, unknown> = {}
    if (status) {
      data.status = status
      if (status === 'approved') {
        data.approvedAt = new Date()
      }
    }

    await prisma.hospital.update({
      where: { id: BigInt(params.id) },
      data,
    })

    return NextResponse.json({ success: true, data: { message: '병원 상태가 업데이트되었습니다.' } })
  } catch (error) {
    console.error('Failed to update hospital:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '병원 업데이트에 실패했습니다.' } },
      { status: 500 },
    )
  }
}
