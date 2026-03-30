import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@letmein/db'
import { getSessionHospitalId } from '@/lib/session'

export async function GET(
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

  const searchParams = request.nextUrl.searchParams
  const before = searchParams.get('before')
  const limit = parseInt(searchParams.get('limit') ?? '50', 10)

  const messages = await prisma.chatMessage.findMany({
    where: {
      roomId,
      ...(before ? { id: { lt: BigInt(before) } } : {}),
    },
    orderBy: { createdAt: 'asc' },
    take: limit,
  })

  const messagesData = messages.map((msg) => ({
    id: msg.id.toString(),
    roomId: msg.roomId.toString(),
    senderId: msg.senderId.toString(),
    senderType: msg.senderId === room.userId ? 'user' : 'hospital',
    messageType: msg.messageType ?? 'text',
    content: msg.content ?? '',
    createdAt: msg.createdAt?.toISOString() ?? new Date().toISOString(),
  }))

  return NextResponse.json({ success: true, data: { messages: messagesData } })
}

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

  // Get the AdminCredential linked to this hospital to use as senderId
  const credential = await prisma.adminCredential.findFirst({
    where: { hospitalId, role: 'hospital' },
    select: { id: true },
  })

  const body = await request.json()
  const { type = 'text', content } = body as { type?: string; content: string }

  if (!content?.trim()) {
    return NextResponse.json(
      { success: false, error: { code: 'BAD_REQUEST', message: '메시지 내용을 입력하세요.' } },
      { status: 400 },
    )
  }

  // Hospital sends as the hospital credential user, fallback to hospitalId as BigInt
  const senderId = credential?.id ?? hospitalId

  const message = await prisma.chatMessage.create({
    data: {
      roomId,
      senderId,
      messageType: type,
      content: content.trim(),
    },
  })

  // Update room lastMessageAt
  await prisma.chatRoom.update({
    where: { id: roomId },
    data: { lastMessageAt: new Date() },
  })

  return NextResponse.json({
    success: true,
    data: {
      message: {
        id: message.id.toString(),
        roomId: message.roomId.toString(),
        senderId: message.senderId.toString(),
        senderType: 'hospital',
        messageType: message.messageType ?? 'text',
        content: message.content ?? '',
        createdAt: message.createdAt?.toISOString() ?? new Date().toISOString(),
      },
    },
  })
}
