import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@letmein/db'
import { getSessionAdminId } from '@/lib/session'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const sanctionId = BigInt(id)

    const sanction = await prisma.sanction.findUnique({
      where: { id: sanctionId },
    })

    if (!sanction) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: '제재를 찾을 수 없습니다.' },
        },
        { status: 404 },
      )
    }

    if (sanction.liftedAt) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'ALREADY_LIFTED', message: '이미 해제된 제재입니다.' },
        },
        { status: 409 },
      )
    }

    const adminUserId = await getSessionAdminId() ?? BigInt(1)

    await prisma.$transaction(async (tx) => {
      await tx.sanction.update({
        where: { id: sanctionId },
        data: {
          liftedAt: new Date(),
          liftedBy: adminUserId,
        },
      })

      // Check if there are other active sanctions for this user
      const activeSanctions = await tx.sanction.count({
        where: {
          userId: sanction.userId,
          id: { not: sanctionId },
          liftedAt: null,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } },
          ],
        },
      })

      // If no other active suspensions, restore user status
      if (activeSanctions === 0 && (sanction.type.startsWith('suspend') || sanction.type === 'permanent_ban')) {
        await tx.user.update({
          where: { id: sanction.userId },
          data: {
            status: 'active',
            suspendedUntil: null,
            suspensionReason: null,
          },
        })
      }
    })

    return NextResponse.json({
      success: true,
      data: { message: '제재가 해제되었습니다.' },
    })
  } catch (error) {
    console.error('Failed to lift sanction:', error)
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '제재 해제에 실패했습니다.' },
      },
      { status: 500 },
    )
  }
}
