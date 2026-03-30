'use server'

import { prisma } from '@letmein/db'
import { revalidatePath } from 'next/cache'
import { getSessionAdminId } from '@/lib/session'

export async function matchHospital(requestId: number, hospitalId: number, note: string) {
  const adminId = await getSessionAdminId()
  if (!adminId) throw new Error('인증이 필요합니다.')

  await prisma.$transaction(async (tx) => {
    // 1. 상담 요청의 userId 조회 (ChatRoom 생성에 필요)
    const request = await tx.consultationRequest.findUniqueOrThrow({
      where: { id: BigInt(requestId) },
      select: { userId: true },
    })

    // 2. 코디네이터 매칭 생성
    await tx.coordinatorMatch.create({
      data: {
        requestId: BigInt(requestId),
        hospitalId: BigInt(hospitalId),
        matchedBy: adminId,   // per CMS-02: BigInt(1) → 실제 세션 ID
        note: note || null,
      },
    })

    // 3. 채팅방 자동 생성 (per CMS-01)
    await tx.chatRoom.create({
      data: {
        requestId: BigInt(requestId),
        userId: request.userId,
        hospitalId: BigInt(hospitalId),
        status: 'active',
      },
    })

    // 4. 상담 요청 상태 업데이트
    await tx.consultationRequest.update({
      where: { id: BigInt(requestId) },
      data: { status: 'matched', matchedAt: new Date() },
    })
  })

  revalidatePath('/coordinator')
}

export async function updateConsultationStatus(requestId: number, status: string, note?: string) {
  await prisma.consultationRequest.update({
    where: { id: BigInt(requestId) },
    data: {
      status,
      coordinatorNote: note ?? null,
    },
  })
  revalidatePath('/coordinator')
}
