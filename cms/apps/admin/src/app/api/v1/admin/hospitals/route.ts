import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@letmein/db'
import type { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, Number(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || '20')))
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status')
    const isPremium = searchParams.get('isPremium')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const where: Prisma.HospitalWhereInput = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (status) {
      where.status = status
    }

    if (isPremium !== null && isPremium !== undefined && isPremium !== '') {
      where.isPremium = isPremium === 'true'
    }

    const allowedSortFields = ['createdAt', 'name', 'caseCount'] as const
    const actualSort = allowedSortFields.includes(sortBy as (typeof allowedSortFields)[number]) ? sortBy : 'createdAt'
    const actualOrder = sortOrder === 'asc' ? 'asc' : 'desc'

    const [hospitals, total] = await Promise.all([
      prisma.hospital.findMany({
        where,
        orderBy: { [actualSort]: actualOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: { select: { nickname: true } },
          _count: { select: { specialties: true, doctors: true } },
        },
      }),
      prisma.hospital.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        hospitals: hospitals.map((h) => ({
          id: Number(h.id),
          userId: Number(h.userId),
          name: h.name,
          businessNumber: h.businessNumber,
          licenseImage: h.licenseImage,
          description: h.description,
          address: h.address,
          phone: h.phone,
          operatingHours: h.operatingHours,
          profileImage: h.profileImage,
          status: h.status,
          isPremium: h.isPremium,
          premiumTier: h.premiumTier,
          introVideoUrl: h.introVideoUrl,
          detailedDescription: h.detailedDescription,
          caseCount: h.caseCount,
          approvedAt: h.approvedAt?.toISOString() ?? null,
          createdAt: (h.createdAt ?? new Date()).toISOString(),
          updatedAt: (h.updatedAt ?? new Date()).toISOString(),
          userName: h.user.nickname,
          userEmail: null,
          specialtyCount: h._count.specialties,
          doctorCount: h._count.doctors,
        })),
        total,
        page,
        limit,
        hasNext: page * limit < total,
      },
    })
  } catch (error) {
    console.error('Failed to fetch hospitals:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '병원 목록을 불러오는데 실패했습니다.' } },
      { status: 500 },
    )
  }
}
