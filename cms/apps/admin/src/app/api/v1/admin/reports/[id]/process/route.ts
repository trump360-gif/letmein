import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@letmein/db'
import { getSessionAdminId } from '@/lib/session'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const reportId = BigInt(id)
    const body = await request.json()
    const { action, sanctionType, sanctionDurationDays, sanctionReason } = body

    if (!action || !['blind', 'delete', 'dismiss'].includes(action)) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'INVALID_BODY', message: '유효한 처리 액션을 선택해주세요.' },
        },
        { status: 400 },
      )
    }

    const report = await prisma.report.findUnique({
      where: { id: reportId },
    })

    if (!report) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: '신고를 찾을 수 없습니다.' },
        },
        { status: 404 },
      )
    }

    if (report.status !== 'pending') {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'ALREADY_PROCESSED', message: '이미 처리된 신고입니다.' },
        },
        { status: 409 },
      )
    }

    const adminUserId = await getSessionAdminId() ?? BigInt(1)

    await prisma.$transaction(async (tx) => {
      // 1. Update report status
      const newStatus = action === 'dismiss' ? 'dismissed' : 'processed'
      await tx.report.update({
        where: { id: reportId },
        data: {
          status: newStatus,
          processedBy: adminUserId,
          processedAt: new Date(),
        },
      })

      // 2. Apply content action
      if (action === 'blind' || action === 'delete') {
        if (report.targetType === 'post') {
          await tx.post.update({
            where: { id: report.targetId },
            data: {
              status: action === 'blind' ? 'blind' : 'deleted',
              ...(action === 'delete' ? { deletedAt: new Date() } : {}),
            },
          })
        } else if (report.targetType === 'comment') {
          await tx.comment.update({
            where: { id: report.targetId },
            data: {
              status: action === 'blind' ? 'blinded' : 'deleted',
              ...(action === 'delete' ? { deletedAt: new Date() } : {}),
            },
          })
        }
      }

      // 3. Apply sanction if requested
      if (sanctionType) {
        let targetUserId: bigint | null = null

        if (report.targetType === 'post') {
          const post = await tx.post.findUnique({
            where: { id: report.targetId },
            select: { userId: true },
          })
          targetUserId = post?.userId ?? null
        } else if (report.targetType === 'comment') {
          const comment = await tx.comment.findUnique({
            where: { id: report.targetId },
            select: { userId: true },
          })
          targetUserId = comment?.userId ?? null
        } else if (report.targetType === 'user') {
          targetUserId = report.targetId
        }

        if (targetUserId) {
          const durationDays = sanctionDurationDays ?? getDurationDays(sanctionType)
          const expiresAt = durationDays
            ? new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000)
            : null

          await tx.sanction.create({
            data: {
              userId: targetUserId,
              type: sanctionType,
              reason: sanctionReason ?? `신고 처리에 의한 제재 (신고 #${id})`,
              durationDays,
              expiresAt,
              appliedBy: adminUserId,
            },
          })

          // Update user status if suspension
          if (sanctionType.startsWith('suspend') || sanctionType === 'permanent_ban') {
            await tx.user.update({
              where: { id: targetUserId },
              data: {
                status: 'suspended',
                suspendedUntil: expiresAt,
                suspensionReason: sanctionReason ?? `신고 처리에 의한 제재`,
              },
            })
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: { message: '신고가 처리되었습니다.' },
    })
  } catch (error) {
    console.error('Failed to process report:', error)
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '신고 처리에 실패했습니다.' },
      },
      { status: 500 },
    )
  }
}

function getDurationDays(sanctionType: string): number | null {
  switch (sanctionType) {
    case 'suspend_1d':
      return 1
    case 'suspend_3d':
      return 3
    case 'suspend_7d':
      return 7
    case 'suspend_30d':
      return 30
    case 'permanent_ban':
      return null
    default:
      return null
  }
}
