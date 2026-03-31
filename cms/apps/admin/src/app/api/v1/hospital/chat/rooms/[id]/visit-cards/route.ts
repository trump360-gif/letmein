import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@letmein/db'
import { getSessionHospitalId } from '@/lib/session'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const hospitalId = await getSessionHospitalId()
  if (!hospitalId) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED' } },
      { status: 401 },
    )
  }

  const roomId = BigInt(params.id)

  // Verify this room belongs to the hospital
  const room = await prisma.chatRoom.findUnique({
    where: { id: roomId },
    select: { hospitalId: true },
  })
  if (!room || room.hospitalId !== hospitalId) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND' } },
      { status: 404 },
    )
  }

  const visitCards = await prisma.$queryRaw<Array<{
    id: bigint
    room_id: bigint
    hospital_id: bigint
    proposed_date: string
    proposed_time: string
    note: string | null
    status: string
    created_at: Date
  }>>`
    SELECT id, room_id, hospital_id, proposed_date, proposed_time, note, status, created_at
    FROM visit_cards
    WHERE room_id = ${roomId} AND hospital_id = ${hospitalId}
    ORDER BY created_at DESC
  `

  return NextResponse.json({
    success: true,
    data: {
      visitCards: visitCards.map((vc) => ({
        id: vc.id.toString(),
        roomId: vc.room_id.toString(),
        hospitalId: vc.hospital_id.toString(),
        proposedDate: vc.proposed_date,
        proposedTime: vc.proposed_time,
        note: vc.note,
        status: vc.status,
        createdAt: vc.created_at.toISOString(),
      })),
    },
  })
}
