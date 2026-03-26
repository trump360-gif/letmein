import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@letmein/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))
    const status = searchParams.get('status')
    const targetType = searchParams.get('targetType')
    const reason = searchParams.get('reason')
    const search = searchParams.get('search')

    const where: Record<string, unknown> = {}

    if (status) where.status = status
    if (targetType) where.targetType = targetType
    if (reason) where.reason = reason
    if (search) {
      where.OR = [
        { reporter: { nickname: { contains: search, mode: 'insensitive' } } },
        { reasonText: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        include: {
          reporter: { select: { nickname: true } },
          processor: { select: { nickname: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.report.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: reports.map((r) => ({
        id: r.id.toString(),
        reporterId: r.reporterId.toString(),
        reporterNickname: r.reporter.nickname,
        targetType: r.targetType,
        targetId: r.targetId.toString(),
        reason: r.reason,
        reasonText: r.reasonText,
        weight: Number(r.weight),
        status: r.status,
        processedBy: r.processedBy?.toString() ?? null,
        processedAt: r.processedAt?.toISOString() ?? null,
        createdAt: r.createdAt.toISOString(),
      })),
      meta: {
        total,
        page,
        limit,
        hasNext: page * limit < total,
      },
    })
  } catch (error) {
    console.error('Failed to fetch reports:', error)
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '신고 목록을 불러오는데 실패했습니다.' },
      },
      { status: 500 },
    )
  }
}
