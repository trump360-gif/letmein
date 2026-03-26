import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@letmein/db'
import type { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'csv'
    const adminId = searchParams.get('adminId')
    const action = searchParams.get('action')
    const module = searchParams.get('module')
    const targetType = searchParams.get('targetType')
    const ipAddress = searchParams.get('ipAddress')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    const where: Prisma.AdminActivityLogWhereInput = {}

    if (adminId) where.adminId = BigInt(adminId)
    if (action) where.action = { contains: action, mode: 'insensitive' }
    if (module) where.module = module
    if (targetType) where.targetType = targetType
    if (ipAddress) where.ipAddress = { contains: ipAddress }
    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) where.createdAt.gte = new Date(dateFrom)
      if (dateTo) where.createdAt.lte = new Date(dateTo)
    }

    const logs = await prisma.adminActivityLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 10000,
      include: {
        admin: {
          select: { email: true, nickname: true },
        },
      },
    })

    if (format === 'json') {
      const jsonData = logs.map((log) => ({
        id: log.id.toString(),
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
      }))

      return new NextResponse(JSON.stringify(jsonData, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="activity-logs-${new Date().toISOString().slice(0, 10)}.json"`,
        },
      })
    }

    // CSV format
    const headers = ['ID', '관리자 이메일', '관리자 닉네임', '액션', '모듈', '대상 타입', '대상 ID', 'IP 주소', '시각']
    const rows = logs.map((log) => [
      log.id.toString(),
      log.admin.email ?? '',
      log.admin.nickname,
      log.action,
      log.module,
      log.targetType ?? '',
      log.targetId?.toString() ?? '',
      log.ipAddress ?? '',
      log.createdAt.toISOString(),
    ])

    const BOM = '\uFEFF'
    const csv = BOM + [headers.join(','), ...rows.map((r) => r.map((c) => `"${(c ?? '').replace(/"/g, '""')}"`).join(','))].join('\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="activity-logs-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    })
  } catch (error) {
    console.error('Failed to export activity logs:', error)
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '로그 내보내기에 실패했습니다.' },
      },
      { status: 500 },
    )
  }
}
