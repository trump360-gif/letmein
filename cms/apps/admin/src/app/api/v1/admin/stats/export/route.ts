import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@letmein/db'
import { subDays, format, startOfDay, endOfDay } from 'date-fns'

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

function toCsv(headers: string[], rows: (string | number)[][]): string {
  const headerLine = headers.join(',')
  const dataLines = rows.map((row) =>
    row
      .map((cell) => {
        const str = String(cell)
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`
        }
        return str
      })
      .join(','),
  )
  return [headerLine, ...dataLines].join('\n')
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const target = searchParams.get('target') ?? 'summary'
    const period = searchParams.get('period')
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    const { startDate, endDate } = parsePeriod(period, from, to)

    let csvData = ''
    let filename = ''

    switch (target) {
      case 'summary':
      case 'users':
      case 'posts':
      case 'reports': {
        const stats = await prisma.statsDaily.findMany({
          where: { date: { gte: startDate, lte: endDate } },
          orderBy: { date: 'asc' },
        })

        if (target === 'users') {
          filename = `user-stats-${format(startDate, 'yyyyMMdd')}-${format(endDate, 'yyyyMMdd')}.csv`
          csvData = toCsv(
            ['날짜', '신규 가입', '활성 사용자'],
            stats.map((s) => [format(s.date, 'yyyy-MM-dd'), s.newUsers, s.activeUsers]),
          )
        } else if (target === 'posts') {
          filename = `post-stats-${format(startDate, 'yyyyMMdd')}-${format(endDate, 'yyyyMMdd')}.csv`
          csvData = toCsv(
            ['날짜', '신규 게시물', '신규 댓글'],
            stats.map((s) => [format(s.date, 'yyyy-MM-dd'), s.newPosts, s.newComments]),
          )
        } else if (target === 'reports') {
          filename = `report-stats-${format(startDate, 'yyyyMMdd')}-${format(endDate, 'yyyyMMdd')}.csv`
          csvData = toCsv(
            ['날짜', '신규 신고'],
            stats.map((s) => [format(s.date, 'yyyy-MM-dd'), s.newReports]),
          )
        } else {
          filename = `summary-stats-${format(startDate, 'yyyyMMdd')}-${format(endDate, 'yyyyMMdd')}.csv`
          csvData = toCsv(
            ['날짜', '신규 가입', '활성 사용자', '신규 게시물', '신규 댓글', '신규 신고', '포인트', '수익'],
            stats.map((s) => [
              format(s.date, 'yyyy-MM-dd'),
              s.newUsers,
              s.activeUsers,
              s.newPosts,
              s.newComments,
              s.newReports,
              s.totalPoints,
              s.totalRevenue,
            ]),
          )
        }
        break
      }

      case 'banners': {
        const bannerStats = await prisma.bannerStat.findMany({
          where: { date: { gte: startDate, lte: endDate } },
          include: { banner: { select: { name: true, position: true } } },
          orderBy: { date: 'asc' },
        })
        filename = `banner-stats-${format(startDate, 'yyyyMMdd')}-${format(endDate, 'yyyyMMdd')}.csv`
        csvData = toCsv(
          ['날짜', '배너명', '위치', '노출수', '클릭수', 'PC 클릭', '모바일 클릭', 'CTR(%)'],
          bannerStats.map((s) => [
            format(s.date, 'yyyy-MM-dd'),
            s.banner.name,
            s.banner.position,
            s.impressions,
            s.clicks,
            s.pcClicks,
            s.mobileClicks,
            s.impressions > 0 ? Math.round((s.clicks / s.impressions) * 10000) / 100 : 0,
          ]),
        )
        break
      }

      case 'notifications': {
        const notifications = await prisma.notification.findMany({
          where: { createdAt: { gte: startDate, lte: endDate } },
          select: { createdAt: true, type: true, isRead: true },
        })

        const dailyMap = new Map<string, { sent: number; read: number }>()
        for (const n of notifications) {
          const key = format(n.createdAt, 'yyyy-MM-dd')
          const entry = dailyMap.get(key) ?? { sent: 0, read: 0 }
          entry.sent++
          if (n.isRead) entry.read++
          dailyMap.set(key, entry)
        }

        filename = `notification-stats-${format(startDate, 'yyyyMMdd')}-${format(endDate, 'yyyyMMdd')}.csv`
        const sortedDates = Array.from(dailyMap.keys()).sort()
        csvData = toCsv(
          ['날짜', '발송 수', '열람 수', '열람률(%)'],
          sortedDates.map((d) => {
            const e = dailyMap.get(d)!
            return [d, e.sent, e.read, e.sent > 0 ? Math.round((e.read / e.sent) * 1000) / 10 : 0]
          }),
        )
        break
      }

      case 'funnel': {
        const eventCounts = await prisma.funnelEvent.groupBy({
          by: ['event'],
          where: { createdAt: { gte: startDate, lte: endDate } },
          _count: { id: true },
        })

        const stages = ['visit', 'signup_start', 'signup_complete', 'first_post', 'first_comment', 'grade_up']
        const stageLabels: Record<string, string> = {
          visit: '방문',
          signup_start: '가입 시작',
          signup_complete: '가입 완료',
          first_post: '첫 게시물',
          first_comment: '첫 댓글',
          grade_up: '등급 승급',
        }
        const countMap = new Map(eventCounts.map((e) => [e.event, e._count.id]))
        const totalVisits = countMap.get('visit') ?? 0

        filename = `funnel-stats-${format(startDate, 'yyyyMMdd')}-${format(endDate, 'yyyyMMdd')}.csv`
        csvData = toCsv(
          ['단계', '이벤트', '수', '전환율(%)'],
          stages.map((s) => {
            const count = countMap.get(s) ?? 0
            return [
              stageLabels[s] ?? s,
              s,
              count,
              totalVisits > 0 ? Math.round((count / totalVisits) * 1000) / 10 : 0,
            ]
          }),
        )
        break
      }

      default:
        return NextResponse.json(
          {
            success: false,
            error: { code: 'INVALID_TARGET', message: '잘못된 내보내기 대상입니다.' },
          },
          { status: 400 },
        )
    }

    return NextResponse.json({
      success: true,
      data: {
        filename,
        data: csvData,
        mimeType: 'text/csv',
      },
    })
  } catch (error) {
    console.error('Failed to export stats:', error)
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '통계 내보내기에 실패했습니다.' },
      },
      { status: 500 },
    )
  }
}
