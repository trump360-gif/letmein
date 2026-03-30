export interface ChatRoomListItem {
  id: string
  userId: string
  hospitalId: string
  status: string
  userName: string
  userProfileImage: string | null
  lastMessage: string | null
  lastMessageType: string
  lastMessageAt: string | null
  unreadCount: number
  createdAt: string
}

export interface Message {
  id: string
  roomId: string
  senderId: string
  senderType: 'user' | 'hospital'
  messageType: string
  content: string
  createdAt: string
}

export interface VisitCard {
  id: string
  roomId: string
  hospitalId: string
  scheduledAt: string
  note: string | null
  status: 'pending' | 'accepted' | 'declined'
  createdAt: string
}

export async function fetchHospitalChatRooms(): Promise<ChatRoomListItem[]> {
  const res = await fetch('/api/v1/hospital/chat/rooms', { cache: 'no-store' })
  if (!res.ok) throw new Error('채팅방 목록을 불러오지 못했습니다.')
  const json = await res.json()
  return json.data.rooms
}

export async function fetchMessages(
  roomId: string,
  params?: { before?: number; limit?: number },
): Promise<Message[]> {
  const searchParams = new URLSearchParams()
  if (params?.before) searchParams.set('before', String(params.before))
  if (params?.limit) searchParams.set('limit', String(params.limit))
  const query = searchParams.toString() ? `?${searchParams.toString()}` : ''

  const res = await fetch(`/api/v1/hospital/chat/rooms/${roomId}/messages${query}`, {
    cache: 'no-store',
  })
  if (!res.ok) throw new Error('메시지를 불러오지 못했습니다.')
  const json = await res.json()
  return json.data.messages
}

export async function sendMessage(roomId: string, content: string): Promise<Message> {
  const res = await fetch(`/api/v1/hospital/chat/rooms/${roomId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'text', content }),
  })
  if (!res.ok) throw new Error('메시지 전송에 실패했습니다.')
  const json = await res.json()
  return json.data.message
}

export async function createVisitCard(
  roomId: string,
  scheduledAt: string,
  note?: string,
): Promise<VisitCard> {
  const res = await fetch(`/api/v1/hospital/chat/rooms/${roomId}/visit-card`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scheduledAt, note }),
  })
  if (!res.ok) throw new Error('방문 예약 카드 생성에 실패했습니다.')
  const json = await res.json()
  return json.data.visitCard
}

export async function fetchVisitCards(roomId: string): Promise<VisitCard[]> {
  const res = await fetch(`/api/v1/hospital/chat/rooms/${roomId}/visit-cards`, {
    cache: 'no-store',
  })
  if (!res.ok) throw new Error('방문 예약 카드 목록을 불러오지 못했습니다.')
  const json = await res.json()
  return json.data.visitCards
}
