'use client'

import { useState } from 'react'
import { Button, Input, Label, Textarea, Badge } from '@letmein/ui'
import { Send, Loader2 } from 'lucide-react'
import { useSendNotificationStore } from '@/features/notification-send'
import { useSendNotification } from '@/features/notification-send'
import {
  CHANNEL_LABELS,
  PRIORITY_LABELS,
  type NotificationChannel,
  type NotificationPriority,
  type TargetType,
} from '@letmein/types'

const TARGET_TYPE_OPTIONS: { value: TargetType; label: string }[] = [
  { value: 'all', label: '전체 회원' },
  { value: 'grade', label: '특정 등급' },
  { value: 'users', label: '특정 사용자' },
  { value: 'board_subscribers', label: '게시판 구독자' },
]

const CHANNELS: NotificationChannel[] = ['pwa', 'email', 'kakao', 'sms', 'inapp']
const PRIORITIES: NotificationPriority[] = [1, 2, 3]

export function SendNotification() {
  const store = useSendNotificationStore()
  const sendMutation = useSendNotification()
  const [result, setResult] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setResult(null)

    try {
      const data = await sendMutation.mutateAsync({
        targetType: store.targetType,
        targetValue: store.targetValue || undefined,
        channels: store.channels,
        priority: store.priority,
        title: store.title,
        body: store.body,
        linkUrl: store.linkUrl || undefined,
        scheduledAt: store.scheduledAt || undefined,
      })
      setResult(data.message)
      store.reset()
    } catch (error) {
      setResult(error instanceof Error ? error.message : '발송에 실패했습니다.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 대상 선택 */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">발송 대상</Label>
        <div className="flex flex-wrap gap-1.5">
          {TARGET_TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => store.setTargetType(opt.value)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                store.targetType === opt.value
                  ? 'bg-foreground text-background'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {store.targetType === 'grade' && (
          <div>
            <Label htmlFor="targetValue">등급 번호</Label>
            <Input
              id="targetValue"
              type="number"
              min={1}
              placeholder="예: 3"
              value={store.targetValue}
              onChange={(e) => store.setTargetValue(e.target.value)}
              className="mt-1 max-w-xs"
            />
          </div>
        )}

        {store.targetType === 'users' && (
          <div>
            <Label htmlFor="targetValue">사용자 ID (쉼표 구분)</Label>
            <Input
              id="targetValue"
              placeholder="예: 1, 2, 3"
              value={store.targetValue}
              onChange={(e) => store.setTargetValue(e.target.value)}
              className="mt-1"
            />
          </div>
        )}

        {store.targetType === 'board_subscribers' && (
          <div>
            <Label htmlFor="targetValue">게시판 ID</Label>
            <Input
              id="targetValue"
              type="number"
              placeholder="예: 1"
              value={store.targetValue}
              onChange={(e) => store.setTargetValue(e.target.value)}
              className="mt-1 max-w-xs"
            />
          </div>
        )}
      </div>

      {/* 채널 선택 */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">발송 채널</Label>
        <div className="flex flex-wrap gap-1.5">
          {CHANNELS.map((channel) => (
            <button
              key={channel}
              type="button"
              onClick={() => store.toggleChannel(channel)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                store.channels.includes(channel)
                  ? 'bg-foreground text-background'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
              }`}
            >
              {CHANNEL_LABELS[channel]}
            </button>
          ))}
        </div>
      </div>

      {/* 우선순위 */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">우선순위</Label>
        <div className="flex flex-wrap gap-1.5">
          {PRIORITIES.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => store.setPriority(p)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                store.priority === p
                  ? p === 1
                    ? 'bg-destructive text-destructive-foreground'
                    : 'bg-foreground text-background'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
              }`}
            >
              {PRIORITY_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {/* 제목 */}
      <div className="space-y-2">
        <Label htmlFor="title" className="text-base font-semibold">
          제목
        </Label>
        <Input
          id="title"
          placeholder="알림 제목을 입력하세요"
          value={store.title}
          onChange={(e) => store.setTitle(e.target.value)}
          required
        />
      </div>

      {/* 내용 */}
      <div className="space-y-2">
        <Label htmlFor="body" className="text-base font-semibold">
          내용
        </Label>
        <Textarea
          id="body"
          placeholder="알림 내용을 입력하세요"
          value={store.body}
          onChange={(e) => store.setBody(e.target.value)}
          rows={5}
          required
        />
      </div>

      {/* 링크 */}
      <div className="space-y-2">
        <Label htmlFor="linkUrl" className="text-base font-semibold">
          링크 URL (선택)
        </Label>
        <Input
          id="linkUrl"
          type="url"
          placeholder="https://..."
          value={store.linkUrl}
          onChange={(e) => store.setLinkUrl(e.target.value)}
        />
      </div>

      {/* 예약 발송 */}
      <div className="space-y-2">
        <Label htmlFor="scheduledAt" className="text-base font-semibold">
          예약 발송 (선택)
        </Label>
        <Input
          id="scheduledAt"
          type="datetime-local"
          value={store.scheduledAt}
          onChange={(e) => store.setScheduledAt(e.target.value)}
          className="max-w-xs"
        />
      </div>

      {/* 결과 메시지 */}
      {result && (
        <div className="rounded-md border bg-muted p-3">
          <Badge variant={sendMutation.isError ? 'destructive' : 'default'}>
            {sendMutation.isError ? '실패' : '성공'}
          </Badge>
          <p className="mt-1 text-sm">{result}</p>
        </div>
      )}

      {/* 발송 버튼 */}
      <Button
        type="submit"
        disabled={sendMutation.isPending || store.channels.length === 0}
        className="w-full sm:w-auto"
      >
        {sendMutation.isPending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Send className="mr-2 h-4 w-4" />
        )}
        알림 발송
      </Button>
    </form>
  )
}
