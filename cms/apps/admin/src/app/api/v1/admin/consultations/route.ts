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
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const where: Prisma.ConsultationRequestWhereInput = {}

    if (search) {
      where.user = {
        nickname: { contains: search, mode: 'insensitive' },
      }
    }

    if (status) {
      where.status = status
    }

    const allowedSortFields = ['createdAt', 'expiresAt'] as const
    const actualSort = allowedSortFields.includes(sortBy as (typeof allowedSortFields)[number]) ? sortBy : 'createdAt'
    const actualOrder = sortOrder === 'asc' ? 'asc' : 'desc'

    const [requests, total] = await Promise.all([
      prisma.consultationRequest.findMany({
        where,
        orderBy: { [actualSort]: actualOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: { select: { nickname: true } },
          _count: { select: { matches: true } },
        },
      }),
      prisma.consultationRequest.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        requests: requests.map((r) => ({
          id: Number(r.id),
          userId: Number(r.userId),
          categoryId: r.categoryId,
          description: r.description,
          preferredPeriod: r.preferredPeriod,
          photoPublic: r.photoPublic,
          status: r.status,
          coordinatorId: r.coordinatorId ? Number(r.coordinatorId) : null,
          coordinatorNote: r.coordinatorNote,
          matchedAt: r.matchedAt?.toISOString() ?? null,
          escalatedAt: r.escalatedAt?.toISOString() ?? null,
          expiresAt: r.expiresAt.toISOString(),
          createdAt: (r.createdAt ?? new Date()).toISOString(),
          userName: r.user.nickname,
          matchCount: r._count.matches,
        })),
        total,
        page,
        limit,
        hasNext: page * limit < total,
      },
    })
  } catch (error) {
    console.error('Failed to fetch consultations:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '상담 목록을 불러오는데 실패했습니다.' } },
      { status: 500 },
    )
  }
}
