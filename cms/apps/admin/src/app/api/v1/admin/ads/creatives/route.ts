import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@letmein/db'
import type { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, Number(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || '20')))
    const search = searchParams.get('search') || ''
    const reviewStatus = searchParams.get('reviewStatus')
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const where: Prisma.AdCreativeWhereInput = {}

    if (search) {
      where.OR = [
        { headline: { contains: search, mode: 'insensitive' } },
        { hospital: { name: { contains: search, mode: 'insensitive' } } },
      ]
    }

    if (reviewStatus) {
      where.reviewStatus = reviewStatus
    }

    const actualOrder = sortOrder === 'asc' ? 'asc' : 'desc'

    const [creatives, total] = await Promise.all([
      prisma.adCreative.findMany({
        where,
        orderBy: { createdAt: actualOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          hospital: { select: { name: true } },
        },
      }),
      prisma.adCreative.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        creatives: creatives.map((c) => ({
          id: Number(c.id),
          hospitalId: Number(c.hospitalId),
          imageUrl: c.imageUrl,
          headline: c.headline,
          reviewStatus: c.reviewStatus,
          rejectionReason: c.rejectionReason,
          reviewedAt: c.reviewedAt?.toISOString() ?? null,
          reviewedBy: c.reviewedBy ? Number(c.reviewedBy) : null,
          createdAt: (c.createdAt ?? new Date()).toISOString(),
          hospitalName: c.hospital.name,
        })),
        total,
        page,
        limit,
        hasNext: page * limit < total,
      },
    })
  } catch (error) {
    console.error('Failed to fetch ad creatives:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '광고 소재 목록을 불러오는데 실패했습니다.' } },
      { status: 500 },
    )
  }
}
