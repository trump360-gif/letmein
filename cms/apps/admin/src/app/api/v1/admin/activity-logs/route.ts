import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@letmein/db'
import type { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, Number(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || '20')))
    const adminId = searchParams.get('adminId')
    const action = searchParams.get('action')
    const module = searchParams.get('module')
    const targetType = searchParams.get('targetType')
    const targetId = searchParams.get('targetId')
    const ipAddress = searchParams.get('ipAddress')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const search = searchParams.get('search')

    const where: Prisma.AdminActivityLogWhereInput = {}

    if (adminId) {
      where.adminId = BigInt(adminId)
    }

    if (action) {
      where.action = { contains: action, mode: 'insensitive' }
    }

    if (module) {
      where.module = module
    }

    if (targetType) {
      where.targetType = targetType
    }

    if (targetId) {
      where.targetId = BigInt(targetId)
    }

    if (ipAddress) {
      where.ipAddress = { contains: ipAddress }
    }

    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) where.createdAt.gte = new Date(dateFrom)
      if (dateTo) where.createdAt.lte = new Date(dateTo)
    }

    if (search) {
      where.OR = [
        { action: { contains: search, mode: 'insensitive' } },
        { module: { contains: search, mode: 'insensitive' } },
        { admin: { nickname: { contains: search, mode: 'insensitive' } } },
        { admin: { email: { contains: search, mode: 'insensitive' } } },
      ]
    }

    const [logs, total] = await Promise.all([
      prisma.adminActivityLog.findMany({
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
      prisma.adminActivityLog.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: logs.map((log) => ({
        id: log.id.toString(),
        adminId: log.adminId.toString(),
        adminEmail: log.admin.email,
        adminNickname: log.admin.nickname,
        action: log.action,
        module: log.module,
        targetType: log.targetType,
        targetId: log.targetId?.toString() ?? null,
        beforeData: log.beforeData,
        afterData: log.afterData,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        createdAt: log.createdAt.toISOString(),
      })),
      meta: {
        total,
        page,
        limit,
        hasNext: page * limit < total,
      },
    })
  } catch (error) {
    console.error('Failed to fetch activity logs:', error)
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '활동 로그를 불러오는데 실패했습니다.' },
      },
      { status: 500 },
    )
  }
}
