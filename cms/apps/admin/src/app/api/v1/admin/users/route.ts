import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@letmein/db'
import type { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, Number(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || '20')))
    const search = searchParams.get('search') || ''
    const grade = searchParams.get('grade')
    const status = searchParams.get('status')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const joinFrom = searchParams.get('joinFrom')
    const joinTo = searchParams.get('joinTo')

    const where: Prisma.UserWhereInput = {
      deletedAt: null,
    }

    if (search) {
      where.OR = [
        { nickname: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (grade !== null && grade !== undefined && grade !== '') {
      where.grade = Number(grade)
    }

    if (status) {
      where.status = status
    }

    if (joinFrom || joinTo) {
      where.createdAt = {}
      if (joinFrom) {
        where.createdAt.gte = new Date(joinFrom)
      }
      if (joinTo) {
        where.createdAt.lte = new Date(joinTo)
      }
    }

    const allowedSortFields = ['createdAt', 'lastLoginAt', 'points', 'grade'] as const
    const actualSort = allowedSortFields.includes(sortBy as (typeof allowedSortFields)[number])
      ? sortBy
      : 'createdAt'
    const actualOrder = sortOrder === 'asc' ? 'asc' : 'desc'

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { [actualSort]: actualOrder },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          email: true,
          nickname: true,
          name: true,
          phone: true,
          grade: true,
          points: true,
          status: true,
          socialProvider: true,
          emailVerifiedAt: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.user.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        users: users.map((u) => ({
          id: Number(u.id),
          email: u.email,
          nickname: u.nickname,
          name: u.name,
          phone: u.phone,
          grade: u.grade,
          points: u.points,
          status: u.status,
          socialProvider: u.socialProvider,
          emailVerifiedAt: u.emailVerifiedAt?.toISOString() ?? null,
          lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
          createdAt: u.createdAt.toISOString(),
          updatedAt: u.updatedAt.toISOString(),
        })),
        total,
        page,
        limit,
        hasNext: page * limit < total,
      },
    })
  } catch (error) {
    console.error('Failed to fetch users:', error)
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '회원 목록을 불러오는데 실패했습니다.' },
      },
      { status: 500 },
    )
  }
}
