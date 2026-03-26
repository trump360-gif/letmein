import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@letmein/db'
import { subDays, format, startOfDay, endOfDay } from 'date-fns'

const REASON_LABELS: Record<string, string> = {
  spam: '스팸/광고',
  abuse: '욕설/비하',
  harassment: '괴롭힘',
  sexual: '음란물',
  illegal: '불법 정보',
  copyright: '저작권 침해',
  other: '기타',
}

const STATUS_LABELS: Record<string, string> = {
  pending: '대기',
  processed: '처리됨',
  dismissed: '기각',
}

function parsePeriod(period: string | null, from: string | null, to: string | null) {
  const now = new Date()
  let startDate: Date
  let endDate = endOfDay(now)

  if (period === 'custom' && from && to) {
    startDate = startOfDay(new Date(from))
    endDate = endOfDay(new Date(to))
  } else {
    const days = period === '90d' ? 90 : period === '30d' ? 30 : 7
    startDate = startOfDay(subDays(now, days))
  }

  return { startDate, endDate }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period')
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    const { startDate, endDate } = parsePeriod(period, from, to)
    const periodDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    const prevStart = startOfDay(subDays(startDate, periodDays))
    const prevEnd = endOfDay(subDays(startDate, 1))

    const [
      dailyStats,
      reasonGroups,
      statusGroups,
      totalReports,
      periodNewReports,
      prevPeriodNewReports,
      processedCount,
    ] = await Promise.all([
      prisma.statsDaily.findMany({
        where: { date: { gte: startDate, lte: endDate } },
        orderBy: { date: 'asc' },
        select: { date: true, newReports: true },
      }),
      prisma.report.groupBy({
        by: ['reason'],
        where: { createdAt: { gte: startDate, lte: endDate } },
        _count: { id: true },
      }),
      prisma.report.groupBy({
        by: ['status'],
        where: { createdAt: { gte: startDate, lte: endDate } },
        _count: { id: true },
      }),
      prisma.report.count(),
      prisma.report.count({
        where: { createdAt: { gte: startDate, lte: endDate } },
      }),
      prisma.report.count({
        where: { createdAt: { gte: prevStart, lte: prevEnd } },
      }),
      prisma.report.count({
        where: {
          createdAt: { gte: startDate, lte: endDate },
          status: { in: ['processed', 'dismissed'] },
        },
      }),
    ])

    const dailyReports = dailyStats.map((s) => ({
      date: format(s.date, 'yyyy-MM-dd'),
      value: s.newReports,
    }))

    const totalInPeriod = reasonGroups.reduce((sum, g) => sum + g._count.id, 0)
    const reasonDistribution = reasonGroups.map((g) => ({
      reason: g.reason,
      label: REASON_LABELS[g.reason] ?? g.reason,
      count: g._count.id,
      percentage: totalInPeriod > 0 ? Math.round((g._count.id / totalInPeriod) * 1000) / 10 : 0,
    }))

    const statusTotal = statusGroups.reduce((sum, g) => sum + g._count.id, 0)
    const statusDistribution = statusGroups.map((g) => ({
      status: g.status,
      label: STATUS_LABELS[g.status] ?? g.status,
      count: g._count.id,
      percentage: statusTotal > 0 ? Math.round((g._count.id / statusTotal) * 1000) / 10 : 0,
    }))

    const periodNewReportChange =
      prevPeriodNewReports > 0
        ? Math.round(((periodNewReports - prevPeriodNewReports) / prevPeriodNewReports) * 1000) / 10
        : 0

    const processRate =
      periodNewReports > 0 ? Math.round((processedCount / periodNewReports) * 1000) / 10 : 0

    // Daily sanctions from Sanction table
    const sanctions = await prisma.sanction.findMany({
      where: { createdAt: { gte: startDate, lte: endDate } },
      select: { createdAt: true },
    })

    const sanctionMap = new Map<string, number>()
    sanctions.forEach((s) => {
      const key = format(s.createdAt, 'yyyy-MM-dd')
      sanctionMap.set(key, (sanctionMap.get(key) ?? 0) + 1)
    })

    const dailySanctions = dailyStats.map((s) => ({
      date: format(s.date, 'yyyy-MM-dd'),
      value: sanctionMap.get(format(s.date, 'yyyy-MM-dd')) ?? 0,
    }))

    return NextResponse.json({
      success: true,
      data: {
        dailyReports,
        reasonDistribution,
        statusDistribution,
        dailySanctions,
        totalReports,
        periodNewReports,
        periodNewReportChange,
        processRate,
      },
    })
  } catch (error) {
    console.error('Failed to fetch report stats:', error)
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '신고 통계를 불러오는데 실패했습니다.' },
      },
      { status: 500 },
    )
  }
}
