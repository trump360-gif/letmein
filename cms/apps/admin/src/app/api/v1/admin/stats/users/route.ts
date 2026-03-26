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

const GRADE_NAMES: Record<number, string> = {
  0: '비회원',
  1: '일반',
  2: 'Bronze',
  3: 'Silver',
  4: 'Gold',
  5: 'VVIP',
  9: '어드민',
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period')
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    const { startDate, endDate } = parsePeriod(period, from, to)

    // Previous period for comparison
    const periodDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    const prevStart = startOfDay(subDays(startDate, periodDays))
    const prevEnd = endOfDay(subDays(startDate, 1))

    const [dailyStats, gradeGroups, totalUsers, periodNewUsers, prevPeriodNewUsers] =
      await Promise.all([
        prisma.statsDaily.findMany({
          where: { date: { gte: startDate, lte: endDate } },
          orderBy: { date: 'asc' },
          select: { date: true, newUsers: true, activeUsers: true },
        }),
        prisma.user.groupBy({
          by: ['grade'],
          where: { deletedAt: null },
          _count: { id: true },
        }),
        prisma.user.count({ where: { deletedAt: null } }),
        prisma.user.count({
          where: { createdAt: { gte: startDate, lte: endDate }, deletedAt: null },
        }),
        prisma.user.count({
          where: { createdAt: { gte: prevStart, lte: prevEnd }, deletedAt: null },
        }),
      ])

    const dailySignups = dailyStats.map((s) => ({
      date: format(s.date, 'yyyy-MM-dd'),
      value: s.newUsers,
    }))

    const dauData = dailyStats.map((s) => ({
      date: format(s.date, 'yyyy-MM-dd'),
      value: s.activeUsers,
    }))

    const gradeDistribution = gradeGroups.map((g) => ({
      grade: g.grade,
      name: GRADE_NAMES[g.grade] ?? `등급 ${g.grade}`,
      count: g._count.id,
      percentage: totalUsers > 0 ? Math.round((g._count.id / totalUsers) * 1000) / 10 : 0,
    }))

    const periodNewUserChange =
      prevPeriodNewUsers > 0
        ? Math.round(((periodNewUsers - prevPeriodNewUsers) / prevPeriodNewUsers) * 1000) / 10
        : 0

    return NextResponse.json({
      success: true,
      data: {
        dailySignups,
        gradeDistribution,
        activeUsers: {
          dau: dauData,
          wau: dailyStats.map((s) => ({
            date: format(s.date, 'yyyy-MM-dd'),
            value: s.activeUsers,
          })),
          mau: dailyStats.map((s) => ({
            date: format(s.date, 'yyyy-MM-dd'),
            value: s.activeUsers,
          })),
        },
        totalUsers,
        periodNewUsers,
        periodNewUserChange,
      },
    })
  } catch (error) {
    console.error('Failed to fetch user stats:', error)
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '회원 통계를 불러오는데 실패했습니다.' },
      },
      { status: 500 },
    )
  }
}
