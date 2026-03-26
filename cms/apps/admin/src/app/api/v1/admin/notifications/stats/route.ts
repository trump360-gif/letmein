import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@letmein/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')

    const since = new Date()
    since.setDate(since.getDate() - days)

    // 전체 통계
    const [totalSent, totalFailed, totalPending] = await Promise.all([
      prisma.notificationQueue.count({ where: { status: 'sent', createdAt: { gte: since } } }),
      prisma.notificationQueue.count({ where: { status: 'failed', createdAt: { gte: since } } }),
      prisma.notificationQueue.count({ where: { status: 'pending', createdAt: { gte: since } } }),
    ])

    // 채널별 통계
    const channelStats = await prisma.notificationQueue.groupBy({
      by: ['channel', 'status'],
      where: { createdAt: { gte: since } },
      _count: { id: true },
    })

    const channelMap: Record<string, { sent: number; failed: number; pending: number }> = {}
    for (const stat of channelStats) {
      if (!channelMap[stat.channel]) {
        channelMap[stat.channel] = { sent: 0, failed: 0, pending: 0 }
      }
      if (stat.status === 'sent') channelMap[stat.channel].sent = stat._count.id
      if (stat.status === 'failed') channelMap[stat.channel].failed = stat._count.id
      if (stat.status === 'pending') channelMap[stat.channel].pending = stat._count.id
    }

    const byChannel = Object.entries(channelMap).map(([channel, stats]) => ({
      channel,
      ...stats,
    }))

    // 일별 통계 (raw query for date grouping)
    const dailyStats = await prisma.$queryRaw<
      Array<{ date: Date; status: string; count: bigint }>
    >`
      SELECT DATE(created_at) as date, status, COUNT(*) as count
      FROM notification_queue
      WHERE created_at >= ${since}
      GROUP BY DATE(created_at), status
      ORDER BY date DESC
      LIMIT ${days * 5}
    `

    const dayMap: Record<string, { sent: number; failed: number }> = {}
    for (const row of dailyStats) {
      const dateStr = new Date(row.date).toISOString().split('T')[0]
      if (!dayMap[dateStr]) {
        dayMap[dateStr] = { sent: 0, failed: 0 }
      }
      if (row.status === 'sent') dayMap[dateStr].sent = Number(row.count)
      if (row.status === 'failed') dayMap[dateStr].failed = Number(row.count)
    }

    const byDay = Object.entries(dayMap)
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a, b) => a.date.localeCompare(b.date))

    return NextResponse.json({
      success: true,
      data: {
        totalSent,
        totalFailed,
        totalPending,
        byChannel,
        byDay,
      },
    })
  } catch (error) {
    console.error('Failed to fetch notification stats:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '알림 통계를 불러오는데 실패했습니다.' } },
      { status: 500 },
    )
  }
}
