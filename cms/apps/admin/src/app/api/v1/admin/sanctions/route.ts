import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@letmein/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))
    const type = searchParams.get('type')
    const activeOnly = searchParams.get('active') === 'true'
    const search = searchParams.get('search')

    const where: Record<string, unknown> = {}

    if (type) where.type = type
    if (activeOnly) {
      where.liftedAt = null
      where.OR = [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ]
    }
    if (search) {
      where.user = {
        OR: [
          { nickname: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      }
    }

    const [sanctions, total] = await Promise.all([
      prisma.sanction.findMany({
        where,
        include: {
          user: { select: { nickname: true, email: true } },
          applier: { select: { nickname: true } },
          lifter: { select: { nickname: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.sanction.count({ where }),
    ])

    const now = new Date()

    return NextResponse.json({
      success: true,
      data: sanctions.map((s) => ({
        id: s.id.toString(),
        userId: s.userId.toString(),
        userNickname: s.user.nickname,
        userEmail: s.user.email,
        type: s.type,
        reason: s.reason,
        durationDays: s.durationDays,
        expiresAt: s.expiresAt?.toISOString() ?? null,
        appliedBy: s.appliedBy.toString(),
        applierNickname: s.applier.nickname,
        liftedAt: s.liftedAt?.toISOString() ?? null,
        liftedBy: s.liftedBy?.toString() ?? null,
        lifterNickname: s.lifter?.nickname ?? null,
        createdAt: s.createdAt.toISOString(),
        isActive: !s.liftedAt && (!s.expiresAt || s.expiresAt > now),
      })),
      meta: {
        total,
        page,
        limit,
        hasNext: page * limit < total,
      },
    })
  } catch (error) {
    console.error('Failed to fetch sanctions:', error)
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '제재 목록을 불러오는데 실패했습니다.' },
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, type, reason, durationDays } = body

    if (!userId || !type) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'INVALID_BODY', message: '필수 항목이 누락되었습니다.' },
        },
        { status: 400 },
      )
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: BigInt(userId) },
    })

    if (!targetUser) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: '대상 유저를 찾을 수 없습니다.' },
        },
        { status: 404 },
      )
    }

    // TODO: Get actual admin user ID from session
    const adminUserId = BigInt(1)

    const days = durationDays ?? getDefaultDuration(type)
    const expiresAt = days ? new Date(Date.now() + days * 24 * 60 * 60 * 1000) : null

    const sanction = await prisma.$transaction(async (tx) => {
      const s = await tx.sanction.create({
        data: {
          userId: BigInt(userId),
          type,
          reason: reason ?? null,
          durationDays: days,
          expiresAt,
          appliedBy: adminUserId,
        },
        include: {
          user: { select: { nickname: true, email: true } },
          applier: { select: { nickname: true } },
        },
      })

      // Update user status for suspensions
      if (type.startsWith('suspend') || type === 'permanent_ban') {
        await tx.user.update({
          where: { id: BigInt(userId) },
          data: {
            status: 'suspended',
            suspendedUntil: expiresAt,
            suspensionReason: reason ?? '어드민에 의한 제재',
          },
        })
      }

      return s
    })

    return NextResponse.json(
      {
        success: true,
        data: {
          id: sanction.id.toString(),
          userId: sanction.userId.toString(),
          userNickname: sanction.user.nickname,
          userEmail: sanction.user.email,
          type: sanction.type,
          reason: sanction.reason,
          durationDays: sanction.durationDays,
          expiresAt: sanction.expiresAt?.toISOString() ?? null,
          appliedBy: sanction.appliedBy.toString(),
          applierNickname: sanction.applier.nickname,
          liftedAt: null,
          liftedBy: null,
          lifterNickname: null,
          createdAt: sanction.createdAt.toISOString(),
          isActive: true,
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error('Failed to create sanction:', error)
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '제재 적용에 실패했습니다.' },
      },
      { status: 500 },
    )
  }
}

function getDefaultDuration(type: string): number | null {
  switch (type) {
    case 'suspend_1d': return 1
    case 'suspend_3d': return 3
    case 'suspend_7d': return 7
    case 'suspend_30d': return 30
    case 'permanent_ban': return null
    default: return null
  }
}
