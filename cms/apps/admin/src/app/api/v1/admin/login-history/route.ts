import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@letmein/db'
import type { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, Number(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || '20')))
    const adminId = searchParams.get('adminId')
    const status = searchParams.get('status')
    const ipAddress = searchParams.get('ipAddress')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    const where: Prisma.AdminLoginHistoryWhereInput = {}

    if (adminId) {
      where.adminId = BigInt(adminId)
    }

    if (status) {
      where.status = status
    }

    if (ipAddress) {
      where.ipAddress = { contains: ipAddress }
    }

    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) where.createdAt.gte = new Date(dateFrom)
      if (dateTo) where.createdAt.lte = new Date(dateTo)
    }

    const [histories, total] = await Promise.all([
      prisma.adminLoginHistory.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          admin: {
            select: {
              id: true,
              email: true,
              nickname: true,
            },
          },
        },
      }),
      prisma.adminLoginHistory.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: histories.map((h) => ({
        id: h.id.toString(),
        adminId: h.adminId.toString(),
        adminEmail: h.admin.email,
        adminNickname: h.admin.nickname,
        ipAddress: h.ipAddress,
        userAgent: h.userAgent,
        status: h.status,
        isNewIp: h.isNewIp,
        createdAt: h.createdAt.toISOString(),
      })),
      meta: {
        total,
        page,
        limit,
        hasNext: page * limit < total,
      },
    })
  } catch (error) {
    console.error('Failed to fetch login history:', error)
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '로그인 이력을 불러오는데 실패했습니다.' },
      },
      { status: 500 },
    )
  }
}
