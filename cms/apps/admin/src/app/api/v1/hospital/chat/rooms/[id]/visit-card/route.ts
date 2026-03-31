import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@letmein/db'
import { getSessionHospitalId } from '@/lib/session'

export async function POST(
  request: NextRequest,
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
    select: { hospitalId: true, userId: true },
  })
  if (!room || room.hospitalId !== hospitalId) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND' } },
      { status: 404 },
    )
  }

  const body = await request.json()
  const { proposedDate, proposedTime, note } = body as { proposedDate: string; proposedTime: string; note?: string }

  if (!proposedDate || !proposedTime) {
    return NextResponse.json(
      { success: false, error: { code: 'BAD_REQUEST', message: '방문 예약 날짜와 시간을 입력하세요.' } },
      { status: 400 },
    )
  }

  try {
  // Create visit card via raw SQL (no Prisma model)
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
    INSERT INTO visit_cards (room_id, hospital_id, proposed_date, proposed_time, note, status, created_at)
    VALUES (${roomId}, ${hospitalId}, ${proposedDate}::date, ${proposedTime}, ${note ?? null}, 'proposed', NOW())
    RETURNING id, room_id, hospital_id, proposed_date, proposed_time, note, status, created_at
  `

  const visitCard = visitCards[0]

  // Also send a chat message with type 'visit_card' including the card ID
  const credential = await prisma.adminCredential.findFirst({
    where: { hospitalId, role: 'hospital' },
    select: { id: true },
  })
  const senderId = credential?.id ?? hospitalId

  const cardContent = JSON.stringify({
    visitCardId: visitCard.id.toString(),
    proposedDate: visitCard.proposed_date,
    proposedTime: visitCard.proposed_time,
    note: visitCard.note ?? null,
    status: visitCard.status,
  })

  await prisma.chatMessage.create({
    data: {
      roomId,
      senderId,
      messageType: 'visit_card',
      content: cardContent,
    },
  })

  await prisma.chatRoom.update({
    where: { id: roomId },
    data: { lastMessageAt: new Date() },
  })

  return NextResponse.json({
    success: true,
    data: {
      visitCard: {
        id: visitCard.id.toString(),
        roomId: visitCard.room_id.toString(),
        hospitalId: visitCard.hospital_id.toString(),
        proposedDate: visitCard.proposed_date,
        proposedTime: visitCard.proposed_time,
        note: visitCard.note,
        status: visitCard.status,
        createdAt: visitCard.created_at.toISOString(),
      },
    },
  })
  } catch (error) {
    console.error('Visit card POST error:', error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}
