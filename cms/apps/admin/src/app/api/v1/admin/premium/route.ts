import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@letmein/db'
import type { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, Number(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || '20')))
    const search = searchParams.get('search') || ''
    const tier = searchParams.get('tier')
    const status = searchParams.get('status')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const where: Prisma.HospitalSubscriptionWhereInput = {}

    if (search) {
      where.hospital = {
        name: { contains: search, mode: 'insensitive' },
      }
    }

    if (tier) where.tier = tier
    if (status) where.status = status

    const allowedSortFields = ['createdAt', 'expiresAt', 'monthlyPrice'] as const
    const actualSort = allowedSortFields.includes(sortBy as (typeof allowedSortFields)[number]) ? sortBy : 'createdAt'
    const actualOrder = sortOrder === 'asc' ? 'asc' : 'desc'

    const [subscriptions, total] = await Promise.all([
      prisma.hospitalSubscription.findMany({
        where,
        orderBy: { [actualSort]: actualOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          hospital: { select: { name: true } },
        },
      }),
      prisma.hospitalSubscription.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        subscriptions: subscriptions.map((s) => ({
          id: Number(s.id),
          hospitalId: Number(s.hospitalId),
          tier: s.tier,
          status: s.status,
          startedAt: s.startedAt.toISOString(),
          expiresAt: s.expiresAt.toISOString(),
          cancelledAt: s.cancelledAt?.toISOString() ?? null,
          monthlyPrice: s.monthlyPrice,
          createdAt: (s.createdAt ?? new Date()).toISOString(),
          updatedAt: (s.updatedAt ?? new Date()).toISOString(),
          hospitalName: s.hospital.name,
        })),
        total,
        page,
        limit,
        hasNext: page * limit < total,
      },
    })
  } catch (error) {
    console.error('Failed to fetch subscriptions:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '구독 목록을 불러오는데 실패했습니다.' } },
      { status: 500 },
    )
  }
}
