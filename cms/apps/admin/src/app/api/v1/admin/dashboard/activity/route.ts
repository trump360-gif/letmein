import { NextResponse } from 'next/server'
import { prisma } from '@letmein/db'

export async function GET() {
  try {
    const logs = await prisma.adminActivityLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        admin: {
          select: { nickname: true },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        items: logs.map((log) => ({
          id: log.id.toString(),
          action: log.action,
          module: log.module,
          targetType: log.targetType,
          targetId: log.targetId?.toString() ?? null,
          adminNickname: log.admin.nickname,
          createdAt: log.createdAt.toISOString(),
        })),
      },
    })
  } catch (error) {
    console.error('Failed to fetch activity logs:', error)
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '활동 로그를 불러오는데 실패했습니다.' },
      },
      { status: 500 },
    )
  }
}
