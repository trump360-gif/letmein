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
  const { scheduledAt, note } = body as { scheduledAt: string; note?: string }

  if (!scheduledAt) {
    return NextResponse.json(
      { success: false, error: { code: 'BAD_REQUEST', message: '방문 예약 날짜를 입력하세요.' } },
      { status: 400 },
    )
  }

  // Create visit card via raw SQL (no Prisma model)
  const visitCards = await prisma.$queryRaw<Array<{
    id: bigint
    room_id: bigint
    hospital_id: bigint
    scheduled_at: Date
    note: string | null
    status: string
    created_at: Date
  }>>`
    INSERT INTO visit_cards (room_id, hospital_id, scheduled_at, note, status, created_at)
    VALUES (${roomId}, ${hospitalId}, ${new Date(scheduledAt)}, ${note ?? null}, 'pending', NOW())
    RETURNING id, room_id, hospital_id, scheduled_at, note, status, created_at
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
    scheduledAt: visitCard.scheduled_at.toISOString(),
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
        scheduledAt: visitCard.scheduled_at.toISOString(),
        note: visitCard.note,
        status: visitCard.status,
        createdAt: visitCard.created_at.toISOString(),
      },
    },
  })
}
