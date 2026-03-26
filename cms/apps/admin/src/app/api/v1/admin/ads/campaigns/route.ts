import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@letmein/db'
import type { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, Number(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || '20')))
    const status = searchParams.get('status')

    const where: Prisma.AdCampaignWhereInput = {}
    if (status) where.status = status

    const [campaigns, total] = await Promise.all([
      prisma.adCampaign.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          hospital: { select: { name: true } },
          creative: { select: { headline: true } },
        },
      }),
      prisma.adCampaign.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        campaigns: campaigns.map((c) => ({
          id: Number(c.id),
          hospitalId: Number(c.hospitalId),
          creativeId: Number(c.creativeId),
          placement: c.placement,
          status: c.status,
          dailyBudget: c.dailyBudget,
          cpmPrice: c.cpmPrice,
          startDate: c.startDate.toISOString(),
          endDate: c.endDate.toISOString(),
          totalImpressions: Number(c.totalImpressions),
          totalClicks: Number(c.totalClicks),
          totalSpent: c.totalSpent,
          createdAt: (c.createdAt ?? new Date()).toISOString(),
          updatedAt: (c.updatedAt ?? new Date()).toISOString(),
          hospitalName: c.hospital.name,
          creativeHeadline: c.creative.headline,
        })),
        total,
        page,
        limit,
        hasNext: page * limit < total,
      },
    })
  } catch (error) {
    console.error('Failed to fetch ad campaigns:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '광고 캠페인 목록을 불러오는데 실패했습니다.' } },
      { status: 500 },
    )
  }
}
