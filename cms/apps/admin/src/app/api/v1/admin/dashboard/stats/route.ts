import { NextResponse } from 'next/server'
import { prisma } from '@letmein/db'

export async function GET() {
  try {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterdayStart = new Date(todayStart)
    yesterdayStart.setDate(yesterdayStart.getDate() - 1)

    const [
      totalUsers,
      totalPosts,
      todayNewUsers,
      yesterdayNewUsers,
      todayNewPosts,
      yesterdayNewPosts,
      pendingReports,
      todayAiSuccess,
      todayAiFailed,
    ] = await Promise.all([
      // 총 회원수 (활성 유저)
      prisma.user.count({ where: { status: 'active' } }),
      // 총 게시물수
      prisma.post.count({ where: { status: 'active' } }),
      // 오늘 신규 가입
      prisma.user.count({
        where: {
          createdAt: { gte: todayStart },
          status: 'active',
        },
      }),
      // 어제 신규 가입
      prisma.user.count({
        where: {
          createdAt: { gte: yesterdayStart, lt: todayStart },
          status: 'active',
        },
      }),
      // 오늘 게시물
      prisma.post.count({
        where: {
          createdAt: { gte: todayStart },
          status: 'active',
        },
      }),
      // 어제 게시물
      prisma.post.count({
        where: {
          createdAt: { gte: yesterdayStart, lt: todayStart },
          status: 'active',
        },
      }),
      // 미처리 신고
      prisma.report.count({
        where: { status: 'pending' },
      }),
      // AI 통계 (미구현 - 0 반환)
      Promise.resolve(0),
      Promise.resolve(0),
    ])

    // 변화율 계산
    const calcChange = (today: number, yesterday: number) => {
      if (yesterday === 0) return today > 0 ? 100 : 0
      return Math.round(((today - yesterday) / yesterday) * 100)
    }

    return NextResponse.json({
      success: true,
      data: {
        totalUsers,
        totalPosts,
        todayNewUsers,
        todayNewPosts,
        pendingReports,
        changes: {
          newUsers: calcChange(todayNewUsers, yesterdayNewUsers),
          newPosts: calcChange(todayNewPosts, yesterdayNewPosts),
        },
        aiStats: {
          todaySuccess: todayAiSuccess,
          todayFailed: todayAiFailed,
        },
        updatedAt: now.toISOString(),
      },
    })
  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error)
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '대시보드 통계를 불러오는데 실패했습니다.' },
      },
      { status: 500 },
    )
  }
}
