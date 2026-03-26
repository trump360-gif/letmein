import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@letmein/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status') || undefined
    const channel = searchParams.get('channel') || undefined

    const where = {
      ...(status && { status }),
      ...(channel && { channel }),
    }

    const [items, total] = await Promise.all([
      prisma.notificationQueue.findMany({
        where,
        include: {
          user: { select: { nickname: true, email: true } },
        },
        orderBy: [{ priority: 'asc' }, { scheduledAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.notificationQueue.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        items: items.map((item) => ({
          id: item.id.toString(),
          userId: item.userId.toString(),
          userName: item.user.nickname,
          userEmail: item.user.email,
          channel: item.channel,
          priority: item.priority,
          subject: item.subject,
          body: item.body,
          metadata: item.metadata,
          status: item.status,
          retryCount: item.retryCount,
          lastError: item.lastError,
          scheduledAt: item.scheduledAt.toISOString(),
          sentAt: item.sentAt?.toISOString() || null,
          createdAt: item.createdAt.toISOString(),
        })),
      },
      meta: {
        total,
        page,
        limit,
        hasNext: page * limit < total,
      },
    })
  } catch (error) {
    console.error('Failed to fetch notification queue:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '발송 큐를 불러오는데 실패했습니다.' } },
      { status: 500 },
    )
  }
}
