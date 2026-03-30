'use client'

import { useRouter } from 'next/navigation'
import { MessageSquare, Clock } from 'lucide-react'
import { useHospitalChatRooms } from '@/features/hospital-chat'
import type { ChatRoomListItem } from '@/features/hospital-chat'

function formatTime(iso: string | null): string {
  if (!iso) return ''
  const date = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffMin < 1) return '방금 전'
  if (diffMin < 60) return `${diffMin}분 전`
  if (diffHour < 24) return `${diffHour}시간 전`
  if (diffDay < 7) return `${diffDay}일 전`
  return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
}

function ChatRoomSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-gray-100 animate-pulse">
      <div className="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0" />
      <div className="flex-1 min-w-0 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-24" />
        <div className="h-3 bg-gray-200 rounded w-40" />
      </div>
      <div className="h-3 bg-gray-200 rounded w-12" />
    </div>
  )
}

function ChatRoomCard({ room, onClick }: { room: ChatRoomListItem; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-4 p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors text-left"
    >
      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
        {room.userProfileImage ? (
          <img src={room.userProfileImage} alt={room.userName} className="w-full h-full object-cover" />
        ) : (
          <MessageSquare className="w-5 h-5 text-blue-500" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-gray-900 truncate">{room.userName}</span>
          {room.unreadCount > 0 && (
            <span className="flex-shrink-0 min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
              {room.unreadCount > 99 ? '99+' : room.unreadCount}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 truncate mt-0.5">
          {room.lastMessage ?? '메시지가 없습니다.'}
        </p>
      </div>

      <div className="flex-shrink-0 flex items-center gap-1 text-xs text-gray-400">
        <Clock className="w-3 h-3" />
        <span>{formatTime(room.lastMessageAt)}</span>
      </div>
    </button>
  )
}

export function HospitalChatListView() {
  const router = useRouter()
  const { data: rooms, isLoading, isError, refetch } = useHospitalChatRooms()

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">채팅 목록</h2>
        </div>
        {[1, 2, 3].map((i) => (
          <ChatRoomSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <p className="text-sm text-red-500 mb-3">채팅 목록을 불러오지 못했습니다.</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="text-xs text-blue-600 hover:text-blue-700 underline"
        >
          다시 시도
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">채팅</h1>
        <button
          type="button"
          onClick={() => refetch()}
          className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
        >
          새로고침
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">채팅 목록</h2>
          <span className="text-xs text-gray-400">{rooms?.length ?? 0}개</span>
        </div>

        {!rooms || rooms.length === 0 ? (
          <div className="py-16 text-center">
            <MessageSquare className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-500">채팅방이 없습니다.</p>
            <p className="text-xs text-gray-400 mt-1">유저가 상담을 신청하면 채팅방이 생성됩니다.</p>
          </div>
        ) : (
          <div>
            {rooms.map((room) => (
              <ChatRoomCard
                key={room.id}
                room={room}
                onClick={() => router.push(`/hospital/chat/${room.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
