import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@letmein/db'
import { getSessionAdminId } from '@/lib/session'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { hospitalId, note } = body

    if (!hospitalId) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'hospitalId가 필요합니다.' } },
        { status: 400 },
      )
    }

    const adminId = await getSessionAdminId() ?? BigInt(1)

    await prisma.$transaction(async (tx) => {
      // 1. 상담 요청의 userId 조회 (ChatRoom 생성에 필요)
      const consultationRequest = await tx.consultationRequest.findUniqueOrThrow({
        where: { id: BigInt(params.id) },
        select: { userId: true },
      })

      // 2. 코디네이터 매칭 생성
      await tx.coordinatorMatch.create({
        data: {
          requestId: BigInt(params.id),
          hospitalId: BigInt(hospitalId),
          matchedBy: adminId,
          note: note || null,
        },
      })

      // 3. 채팅방 자동 생성
      await tx.chatRoom.create({
        data: {
          requestId: BigInt(params.id),
          userId: consultationRequest.userId,
          hospitalId: BigInt(hospitalId),
          status: 'active',
        },
      })

      // 4. 상담 요청 상태 업데이트
      await tx.consultationRequest.update({
        where: { id: BigInt(params.id) },
        data: {
          status: 'matched',
          matchedAt: new Date(),
        },
      })
    })

    return NextResponse.json({ success: true, data: { message: '매칭이 완료되었습니다.' } })
  } catch (error) {
    console.error('Failed to match consultation:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '매칭에 실패했습니다.' } },
      { status: 500 },
    )
  }
}
