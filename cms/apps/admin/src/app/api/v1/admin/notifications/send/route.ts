import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@letmein/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { targetType, targetValue, channels, priority, title, body: content, linkUrl, scheduledAt } = body as {
      targetType: 'all' | 'grade' | 'users' | 'board_subscribers'
      targetValue?: string
      channels: string[]
      priority: number
      title: string
      body: string
      linkUrl?: string
      scheduledAt?: string
    }

    if (!channels || channels.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_BODY', message: '발송 채널을 선택해주세요.' } },
        { status: 400 },
      )
    }

    if (!title || !content) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_BODY', message: '제목과 내용을 입력해주세요.' } },
        { status: 400 },
      )
    }

    // 대상 사용자 조회
    let userIds: bigint[] = []

    switch (targetType) {
      case 'all': {
        const users = await prisma.user.findMany({
          where: { status: 'active', deletedAt: null },
          select: { id: true },
        })
        userIds = users.map((u) => u.id)
        break
      }
      case 'grade': {
        if (!targetValue) {
          return NextResponse.json(
            { success: false, error: { code: 'INVALID_BODY', message: '등급을 선택해주세요.' } },
            { status: 400 },
          )
        }
        const users = await prisma.user.findMany({
          where: { grade: parseInt(targetValue), status: 'active', deletedAt: null },
          select: { id: true },
        })
        userIds = users.map((u) => u.id)
        break
      }
      case 'users': {
        if (!targetValue) {
          return NextResponse.json(
            { success: false, error: { code: 'INVALID_BODY', message: '사용자 ID를 입력해주세요.' } },
            { status: 400 },
          )
        }
        userIds = targetValue.split(',').map((id) => BigInt(id.trim()))
        break
      }
      case 'board_subscribers': {
        if (!targetValue) {
          return NextResponse.json(
            { success: false, error: { code: 'INVALID_BODY', message: '게시판 ID를 입력해주세요.' } },
            { status: 400 },
          )
        }
        const subs = await prisma.notificationSubscription.findMany({
          where: { targetType: 'board', targetId: BigInt(targetValue) },
          select: { userId: true },
        })
        userIds = subs.map((s) => s.userId)
        break
      }
    }

    if (userIds.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'NO_TARGET', message: '대상 사용자가 없습니다.' } },
        { status: 400 },
      )
    }

    const schedule = scheduledAt ? new Date(scheduledAt) : new Date()

    // 채널별 큐에 등록
    const queueItems = userIds.flatMap((userId) =>
      channels.map((channel) => ({
        userId,
        channel,
        priority: priority || 2,
        subject: title,
        body: content,
        metadata: linkUrl ? { linkUrl } : undefined,
        status: 'pending' as const,
        scheduledAt: schedule,
      })),
    )

    // 배치로 큐 삽입
    const created = await prisma.notificationQueue.createMany({
      data: queueItems,
    })

    // 인앱 채널이 포함된 경우 Notification 테이블에도 직접 생성
    if (channels.includes('inapp')) {
      await prisma.notification.createMany({
        data: userIds.map((userId) => ({
          userId,
          type: 'manual_send',
          title,
          body: content,
          linkUrl: linkUrl || null,
        })),
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        message: `${userIds.length}명에게 ${channels.length}개 채널로 발송 예약되었습니다.`,
        queuedCount: created.count,
        targetCount: userIds.length,
      },
    })
  } catch (error) {
    console.error('Failed to send notification:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '알림 발송에 실패했습니다.' } },
      { status: 500 },
    )
  }
}
