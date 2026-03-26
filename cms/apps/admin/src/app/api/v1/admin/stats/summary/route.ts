import { NextResponse } from 'next/server'
import { prisma } from '@letmein/db'
import { subDays, startOfDay, endOfDay, startOfWeek, startOfMonth } from 'date-fns'

export async function GET() {
  try {
    const now = new Date()
    const todayStart = startOfDay(now)
    const todayEnd = endOfDay(now)
    const yesterdayStart = startOfDay(subDays(now, 1))
    const yesterdayEnd = endOfDay(subDays(now, 1))
    const weekStart = startOfWeek(now, { weekStartsOn: 1 })
    const monthStart = startOfMonth(now)

    const [
      totalUsers,
      totalPosts,
      totalComments,
      pendingReports,
      todayNewUsers,
      todayNewPosts,
      todayNewComments,
      todayNewReports,
      yesterdayNewUsers,
      yesterdayNewPosts,
      yesterdayNewComments,
      yesterdayNewReports,
      dau,
      wau,
      mau,
    ] = await Promise.all([
      // User: withdrawn_at이 null인 활성 사용자
      prisma.user.count({ where: { withdrawn_at: null } }),
      // Post: status가 active인 게시물
      prisma.post.count({ where: { status: 'active' } }),
      // Comment: status가 active인 댓글
      prisma.comment.count({ where: { status: 'active' } }),
      prisma.report.count({ where: { status: 'pending' } }),
      prisma.user.count({
        where: { createdAt: { gte: todayStart, lte: todayEnd }, withdrawn_at: null },
      }),
      prisma.post.count({
        where: { createdAt: { gte: todayStart, lte: todayEnd }, status: 'active' },
      }),
      prisma.comment.count({
        where: { createdAt: { gte: todayStart, lte: todayEnd }, status: 'active' },
      }),
      prisma.report.count({
        where: { createdAt: { gte: todayStart, lte: todayEnd } },
      }),
      prisma.user.count({
        where: { createdAt: { gte: yesterdayStart, lte: yesterdayEnd }, withdrawn_at: null },
      }),
      prisma.post.count({
        where: { createdAt: { gte: yesterdayStart, lte: yesterdayEnd }, status: 'active' },
      }),
      prisma.comment.count({
        where: { createdAt: { gte: yesterdayStart, lte: yesterdayEnd }, status: 'active' },
      }),
      prisma.report.count({
        where: { createdAt: { gte: yesterdayStart, lte: yesterdayEnd } },
      }),
      // DAU/WAU/MAU: StatsDaily 테이블에서 집계 (lastLoginAt 필드 없음)
      prisma.statsDaily.findFirst({
        where: { date: { gte: todayStart, lte: todayEnd } },
        select: { active_users: true },
      }).then((r) => r?.active_users ?? 0),
      prisma.statsDaily.aggregate({
        where: { date: { gte: weekStart } },
        _sum: { active_users: true },
      }).then((r) => r._sum.active_users ?? 0),
      prisma.statsDaily.aggregate({
        where: { date: { gte: monthStart } },
        _sum: { active_users: true },
      }).then((r) => r._sum.active_users ?? 0),
    ])

    return NextResponse.json({
      success: true,
      data: {
        totalUsers,
        totalPosts,
        totalComments,
        pendingReports,
        todayNewUsers,
        todayNewPosts,
        todayNewComments,
        todayNewReports,
        yesterdayNewUsers,
        yesterdayNewPosts,
        yesterdayNewComments,
        yesterdayNewReports,
        dau,
        wau,
        mau,
      },
    })
  } catch (error) {
    console.error('Failed to fetch stats summary:', error)
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '통계 요약을 불러오는데 실패했습니다.' },
      },
      { status: 500 },
    )
  }
}
