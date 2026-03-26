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

    const where: Prisma.CastMemberWhereInput = {}

    if (search) {
      where.OR = [
        { displayName: { contains: search, mode: 'insensitive' } },
        { youtubeChannelUrl: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (status) {
      where.verificationStatus = status
    }

    const allowedSortFields = ['createdAt', 'followerCount', 'storyCount'] as const
    const actualSort = allowedSortFields.includes(sortBy as (typeof allowedSortFields)[number]) ? sortBy : 'createdAt'
    const actualOrder = sortOrder === 'asc' ? 'asc' : 'desc'

    const [members, total] = await Promise.all([
      prisma.castMember.findMany({
        where,
        orderBy: { [actualSort]: actualOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: { select: { nickname: true } },
        },
      }),
      prisma.castMember.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        members: members.map((m) => ({
          id: Number(m.id),
          userId: Number(m.userId),
          displayName: m.displayName,
          bio: m.bio,
          profileImage: m.profileImage,
          badgeType: m.badgeType,
          verificationStatus: m.verificationStatus,
          verifiedAt: m.verifiedAt?.toISOString() ?? null,
          verifiedBy: m.verifiedBy ? Number(m.verifiedBy) : null,
          rejectionReason: m.rejectionReason,
          youtubeChannelUrl: m.youtubeChannelUrl,
          followerCount: m.followerCount,
          storyCount: m.storyCount,
          createdAt: (m.createdAt ?? new Date()).toISOString(),
          updatedAt: (m.updatedAt ?? new Date()).toISOString(),
          userName: m.user.nickname,
          userEmail: null,
        })),
        total,
        page,
        limit,
        hasNext: page * limit < total,
      },
    })
  } catch (error) {
    console.error('Failed to fetch cast members:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '출연자 목록을 불러오는데 실패했습니다.' } },
      { status: 500 },
    )
  }
}
