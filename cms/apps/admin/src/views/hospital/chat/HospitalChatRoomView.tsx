'use client'

import { useState, useEffect, useRef, KeyboardEvent } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Send, Calendar, ChevronDown, ChevronUp, Check, X, Clock } from 'lucide-react'
import { useChatMessages, useSendMessage, useCreateVisitCard, useVisitCards } from '@/features/hospital-chat'
import type { Message, VisitCard } from '@/features/hospital-chat'

// ──────────────────────────────────────────────
// Sub-components
// ──────────────────────────────────────────────

function DisclaimerBanner() {
  return (
    <div className="sticky top-0 z-10 bg-amber-50 border-b border-amber-200 px-4 py-2.5">
      <p className="text-xs text-amber-800 leading-relaxed">
        이 채팅은 의료 상담이 아니며 법적 책임을 지지 않습니다.
        구체적인 의료 문의는 병원에 직접 방문하시기 바랍니다.
      </p>
    </div>
  )
}

function VisitCardStatusBadge({ status }: { status: string }) {
  if (status === 'accepted') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
        <Check className="w-3 h-3" />
        수락됨
      </span>
    )
  }
  if (status === 'declined') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
        <X className="w-3 h-3" />
        거절됨
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
      <Clock className="w-3 h-3" />
      대기중
    </span>
  )
}

function VisitCardMessage({
  content,
  visitCards,
  isHospital,
}: {
  content: string
  visitCards: VisitCard[]
  isHospital: boolean
}) {
  let cardData: { visitCardId?: string; scheduledAt?: string; note?: string | null; status?: string } = {}
  try {
    cardData = JSON.parse(content)
  } catch {
    return <span className="text-sm text-gray-700">{content}</span>
  }

  const visitCard = visitCards.find((vc) => vc.id === cardData.visitCardId)
  const status = visitCard?.status ?? cardData.status ?? 'pending'
  const scheduledAt = cardData.scheduledAt ? new Date(cardData.scheduledAt) : null

  return (
    <div
      className={`rounded-xl border p-3 min-w-[200px] max-w-[260px] ${
        isHospital ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <Calendar className="w-4 h-4 text-blue-500 flex-shrink-0" />
        <span className="text-xs font-semibold text-gray-800">방문 예약 카드</span>
      </div>
      {scheduledAt && (
        <p className="text-sm font-medium text-gray-900 mb-1">
          {scheduledAt.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}{' '}
          {scheduledAt.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
        </p>
      )}
      {cardData.note && (
        <p className="text-xs text-gray-600 mb-2">{cardData.note}</p>
      )}
      <VisitCardStatusBadge status={status} />
    </div>
  )
}

function MessageBubble({
  message,
  visitCards,
}: {
  message: Message
  visitCards: VisitCard[]
}) {
  const isHospital = message.senderType === 'hospital'
  const time = new Date(message.createdAt).toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className={`flex gap-2 ${isHospital ? 'flex-row-reverse' : 'flex-row'} items-end`}>
      <div className={`flex flex-col gap-1 max-w-[70%] ${isHospital ? 'items-end' : 'items-start'}`}>
        {message.messageType === 'visit_card' ? (
          <VisitCardMessage
            content={message.content}
            visitCards={visitCards}
            isHospital={isHospital}
          />
        ) : (
          <div
            className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
              isHospital
                ? 'bg-blue-500 text-white rounded-br-sm'
                : 'bg-white border border-gray-200 text-gray-900 rounded-bl-sm'
            }`}
          >
            {message.content}
          </div>
        )}
        <span className="text-xs text-gray-400">{time}</span>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────
// Visit Card Form
// ──────────────────────────────────────────────

function VisitCardForm({
  roomId,
  onClose,
}: {
  roomId: string
  onClose: () => void
}) {
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [note, setNote] = useState('')
  const { mutate: createCard, isPending } = useCreateVisitCard(roomId)

  function handleSubmit() {
    if (!date || !time) return
    const scheduledAt = new Date(`${date}T${time}`).toISOString()
    createCard(
      { scheduledAt, note: note.trim() || undefined },
      {
        onSuccess: () => {
          setDate('')
          setTime('')
          setNote('')
          onClose()
        },
      },
    )
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-3 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-800 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-500" />
          방문 예약 카드 작성
        </span>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">날짜</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">시간</label>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">메모 (선택)</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="방문 시 안내 사항을 입력하세요."
          rows={2}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
        >
          취소
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!date || !time || isPending}
          className="px-4 py-2 text-sm font-medium bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isPending ? '발송 중...' : '예약 카드 발송'}
        </button>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────
// Main View
// ──────────────────────────────────────────────

interface HospitalChatRoomViewProps {
  roomId: string
}

export function HospitalChatRoomView({ roomId }: HospitalChatRoomViewProps) {
  const router = useRouter()
  const [inputText, setInputText] = useState('')
  const [showVisitCardForm, setShowVisitCardForm] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { data: messages = [], refetch: refetchMessages, isLoading } = useChatMessages(roomId, true)
  const { data: visitCards = [] } = useVisitCards(roomId)
  const { mutate: sendMsg, isPending: isSending } = useSendMessage(roomId)

  // 3-second polling
  useEffect(() => {
    const interval = setInterval(() => {
      refetchMessages()
    }, 3000)
    return () => clearInterval(interval)
  }, [refetchMessages])

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function handleSend() {
    const content = inputText.trim()
    if (!content || isSending) return
    sendMsg(content, {
      onSuccess: () => setInputText(''),
    })
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.push('/hospital/chat')}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-base font-semibold text-gray-900">채팅방</h1>
      </div>

      {/* Disclaimer Banner — sticky top-0 */}
      <DisclaimerBanner />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {isLoading && (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!isLoading && messages.length === 0 && (
          <div className="flex justify-center py-16">
            <p className="text-sm text-gray-400">아직 메시지가 없습니다. 먼저 인사를 건네보세요.</p>
          </div>
        )}

        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} visitCards={visitCards} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 px-4 pt-3 pb-4">
        {/* Visit Card Form */}
        {showVisitCardForm && (
          <VisitCardForm
            roomId={roomId}
            onClose={() => setShowVisitCardForm(false)}
          />
        )}

        {/* Visit Card Button */}
        <div className="mb-2">
          <button
            type="button"
            onClick={() => setShowVisitCardForm((prev) => !prev)}
            className="flex items-center gap-2 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100"
          >
            <Calendar className="w-3.5 h-3.5" />
            방문 예약 카드 발송
            {showVisitCardForm ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Text Input */}
        <div className="flex items-end gap-2">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="메시지를 입력하세요. (Enter: 전송 / Shift+Enter: 줄바꿈)"
            rows={2}
            className="flex-1 resize-none rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder:text-gray-400"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!inputText.trim() || isSending}
            className="flex-shrink-0 w-10 h-10 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
