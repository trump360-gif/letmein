import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@letmein/db'
import { subDays, format, startOfDay, endOfDay } from 'date-fns'

const CHANNEL_LABELS: Record<string, string> = {
  inapp: '인앱',
  email: '이메일',
  kakao: '카카오톡',
  sms: 'SMS',
  push: '푸시',
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

    // Notification sent per day
    const notifications = await prisma.notification.findMany({
      where: { createdAt: { gte: startDate, lte: endDate } },
      select: { createdAt: true, isRead: true, type: true },
    })

    const dailySentMap = new Map<string, number>()
    const dailyReadMap = new Map<string, number>()

    for (const n of notifications) {
      const key = format(n.createdAt, 'yyyy-MM-dd')
      dailySentMap.set(key, (dailySentMap.get(key) ?? 0) + 1)
      if (n.isRead) {
        dailyReadMap.set(key, (dailyReadMap.get(key) ?? 0) + 1)
      }
    }

    const allDates = Array.from(new Set([...dailySentMap.keys(), ...dailyReadMap.keys()])).sort()
    const dailySent = allDates.map((d) => ({ date: d, value: dailySentMap.get(d) ?? 0 }))
    const dailyRead = allDates.map((d) => ({ date: d, value: dailyReadMap.get(d) ?? 0 }))

    // Channel distribution from queue
    const channelGroups = await prisma.notificationQueue.groupBy({
      by: ['channel'],
      where: { createdAt: { gte: startDate, lte: endDate } },
      _count: { id: true },
    })

    const sentQueues = await prisma.notificationQueue.groupBy({
      by: ['channel'],
      where: {
        createdAt: { gte: startDate, lte: endDate },
        status: 'sent',
      },
      _count: { id: true },
    })

    const sentMap = new Map(sentQueues.map((g) => [g.channel, g._count.id]))

    const channelDistribution = channelGroups.map((g) => {
      const sent = g._count.id
      const read = sentMap.get(g.channel) ?? 0
      return {
        channel: g.channel,
        label: CHANNEL_LABELS[g.channel] ?? g.channel,
        sent,
        read,
        readRate: sent > 0 ? Math.round((read / sent) * 1000) / 10 : 0,
      }
    })

    const totalSent = notifications.length
    const totalRead = notifications.filter((n) => n.isRead).length
    const readRate = totalSent > 0 ? Math.round((totalRead / totalSent) * 1000) / 10 : 0

    return NextResponse.json({
      success: true,
      data: {
        dailySent,
        dailyRead,
        channelDistribution,
        readRate,
        totalSent,
        totalRead,
      },
    })
  } catch (error) {
    console.error('Failed to fetch notification stats:', error)
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '알림 통계를 불러오는데 실패했습니다.' },
      },
      { status: 500 },
    )
  }
}
