import { NextResponse } from 'next/server'
import { prisma } from '@letmein/db'
import { getSessionHospitalId } from '@/lib/session'

export async function GET() {
  const hospitalId = await getSessionHospitalId()
  if (!hospitalId) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED' } },
      { status: 401 },
    )
  }

  const rooms = await prisma.chatRoom.findMany({
    where: { hospitalId },
    orderBy: { lastMessageAt: 'desc' },
    include: {
      user: { select: { id: true, nickname: true, profile_image: true } },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { id: true, content: true, messageType: true, createdAt: true },
      },
    },
  })

  const roomsData = await Promise.all(
    rooms.map(async (room) => {
      const unreadCount = await prisma.chatMessage.count({
        where: {
          roomId: room.id,
          readAt: null,
          senderId: room.userId, // unread = messages from user not yet read
        },
      })

      const lastMsg = room.messages[0]
      return {
        id: room.id.toString(),
        userId: room.userId.toString(),
        hospitalId: room.hospitalId.toString(),
        status: room.status ?? 'active',
        userName: room.user.nickname ?? `User #${room.userId.toString()}`,
        userProfileImage: room.user.profile_image ?? null,
        lastMessage: lastMsg?.content ?? null,
        lastMessageType: lastMsg?.messageType ?? 'text',
        lastMessageAt: lastMsg?.createdAt?.toISOString() ?? room.createdAt?.toISOString() ?? null,
        unreadCount,
        createdAt: room.createdAt?.toISOString() ?? new Date().toISOString(),
      }
    }),
  )

  return NextResponse.json({ success: true, data: { rooms: roomsData } })
}
