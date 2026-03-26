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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period')
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    const { startDate, endDate } = parsePeriod(period, from, to)

    const bannerStats = await prisma.bannerStat.findMany({
      where: { date: { gte: startDate, lte: endDate } },
      include: {
        banner: {
          select: { id: true, name: true, position: true, abGroup: true },
        },
      },
      orderBy: { date: 'asc' },
    })

    // Aggregate per banner
    const bannerMap = new Map<
      string,
      {
        id: string
        name: string
        position: string
        impressions: number
        clicks: number
        pcClicks: number
        mobileClicks: number
        abGroup: string | null
      }
    >()

    const dailyImpMap = new Map<string, number>()
    const dailyClickMap = new Map<string, number>()

    for (const stat of bannerStats) {
      const key = stat.banner.id.toString()
      const existing = bannerMap.get(key)
      if (existing) {
        existing.impressions += stat.impressions
        existing.clicks += stat.clicks
        existing.pcClicks += stat.pcClicks
        existing.mobileClicks += stat.mobileClicks
      } else {
        bannerMap.set(key, {
          id: key,
          name: stat.banner.name,
          position: stat.banner.position,
          impressions: stat.impressions,
          clicks: stat.clicks,
          pcClicks: stat.pcClicks,
          mobileClicks: stat.mobileClicks,
          abGroup: stat.banner.abGroup,
        })
      }

      const dateKey = format(stat.date, 'yyyy-MM-dd')
      dailyImpMap.set(dateKey, (dailyImpMap.get(dateKey) ?? 0) + stat.impressions)
      dailyClickMap.set(dateKey, (dailyClickMap.get(dateKey) ?? 0) + stat.clicks)
    }

    const banners = Array.from(bannerMap.values()).map((b) => ({
      ...b,
      ctr: b.impressions > 0 ? Math.round((b.clicks / b.impressions) * 10000) / 100 : 0,
    }))

    const allDates = Array.from(new Set([...dailyImpMap.keys(), ...dailyClickMap.keys()])).sort()
    const dailyImpressions = allDates.map((d) => ({ date: d, value: dailyImpMap.get(d) ?? 0 }))
    const dailyClicks = allDates.map((d) => ({ date: d, value: dailyClickMap.get(d) ?? 0 }))

    const totalImpressions = banners.reduce((s, b) => s + b.impressions, 0)
    const totalClicks = banners.reduce((s, b) => s + b.clicks, 0)
    const overallCTR =
      totalImpressions > 0 ? Math.round((totalClicks / totalImpressions) * 10000) / 100 : 0

    return NextResponse.json({
      success: true,
      data: {
        banners,
        dailyImpressions,
        dailyClicks,
        overallCTR,
      },
    })
  } catch (error) {
    console.error('Failed to fetch banner stats:', error)
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '배너 통계를 불러오는데 실패했습니다.' },
      },
      { status: 500 },
    )
  }
}
