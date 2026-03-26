import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@letmein/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const id = BigInt(params.id)
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') ?? '30')

    const banner = await prisma.banner.findUnique({ where: { id } })
    if (!banner) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '배너를 찾을 수 없습니다.' } },
        { status: 404 },
      )
    }

    const since = new Date()
    since.setDate(since.getDate() - days)

    const stats = await prisma.bannerStat.findMany({
      where: {
        bannerId: id,
        date: { gte: since },
      },
      orderBy: { date: 'asc' },
    })

    const serialized = stats.map((s) => ({
      id: s.id.toString(),
      bannerId: s.bannerId.toString(),
      date: s.date.toISOString().split('T')[0],
      impressions: s.impressions,
      clicks: s.clicks,
      pcClicks: s.pcClicks,
      mobileClicks: s.mobileClicks,
      ctr: s.impressions > 0 ? Math.round((s.clicks / s.impressions) * 10000) / 100 : 0,
    }))

    const totalImpressions = serialized.reduce((sum, s) => sum + s.impressions, 0)
    const totalClicks = serialized.reduce((sum, s) => sum + s.clicks, 0)

    return NextResponse.json({
      success: true,
      data: {
        stats: serialized,
        summary: {
          totalImpressions,
          totalClicks,
          avgCtr: totalImpressions > 0 ? Math.round((totalClicks / totalImpressions) * 10000) / 100 : 0,
        },
      },
    })
  } catch (error) {
    console.error('Failed to fetch banner stats:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '배너 통계를 불러오는데 실패했습니다.' } },
      { status: 500 },
    )
  }
}
