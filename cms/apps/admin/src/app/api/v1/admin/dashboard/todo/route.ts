import { NextResponse } from 'next/server'
import { prisma } from '@letmein/db'

export async function GET() {
  try {
    const now = new Date()

    // 30일 후 기준 (휴면 예정, 배너 만료)
    const thirtyDaysLater = new Date(now)
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30)

    const [
      pendingReports,
      dormantSoonUsers,
      expiringBanners,
    ] = await Promise.all([
      // 미처리 신고 수
      prisma.report.count({
        where: { status: 'pending' },
      }),
      // 휴면 예정 회원 (dormantNotifiedAt이 설정되어 있고 아직 active인 회원)
      prisma.user.count({
        where: {
          status: 'active',
          dormantNotifiedAt: { not: null },
          deletedAt: null,
        },
      }),
      // 만료 예정 배너 (30일 이내 만료)
      prisma.banner.count({
        where: {
          isActive: true,
          endsAt: {
            gte: now,
            lte: thirtyDaysLater,
          },
          deletedAt: null,
        },
      }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        items: [
          {
            id: 'pending-reports',
            label: '미처리 신고',
            count: pendingReports,
            href: '/reports?status=pending',
            urgency: pendingReports > 10 ? 'high' : pendingReports > 0 ? 'medium' : 'low',
          },
          {
            id: 'dormant-users',
            label: '휴면 예정 회원',
            count: dormantSoonUsers,
            href: '/users?status=dormant-soon',
            urgency: dormantSoonUsers > 50 ? 'high' : dormantSoonUsers > 0 ? 'medium' : 'low',
          },
          {
            id: 'expiring-banners',
            label: '만료 예정 배너',
            count: expiringBanners,
            href: '/banners?filter=expiring',
            urgency: expiringBanners > 5 ? 'high' : expiringBanners > 0 ? 'medium' : 'low',
          },
        ],
      },
    })
  } catch (error) {
    console.error('Failed to fetch dashboard todo:', error)
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '할 일 목록을 불러오는데 실패했습니다.' },
      },
      { status: 500 },
    )
  }
}
