'use client'

import { useState } from 'react'
import {
  Button,
  Input,
  Label,
  Badge,
  Switch,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@letmein/ui'
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react'
import {
  useWebhooks,
  useCreateWebhook,
  useUpdateWebhook,
  useDeleteWebhook,
} from '@/features/notification-send'
import { NOTIFICATION_TRIGGERS, type WebhookConfig } from '@letmein/types'

const WEBHOOK_EVENTS = NOTIFICATION_TRIGGERS.map((t) => ({
  value: t.event,
  label: t.label,
}))

export function WebhookSettings() {
  const { data: webhooks, isLoading } = useWebhooks()
  const createMutation = useCreateWebhook()
  const updateMutation = useUpdateWebhook()
  const deleteMutation = useDeleteWebhook()

  const [showDialog, setShowDialog] = useState(false)
  const [editingWebhook, setEditingWebhook] = useState<WebhookConfig | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<WebhookConfig | null>(null)

  // Form state
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [secret, setSecret] = useState('')
  const [selectedEvents, setSelectedEvents] = useState<string[]>([])
  const [isActive, setIsActive] = useState(true)

  const resetForm = () => {
    setName('')
    setUrl('')
    setSecret('')
    setSelectedEvents([])
    setIsActive(true)
    setEditingWebhook(null)
  }

  const openCreateDialog = () => {
    resetForm()
    setShowDialog(true)
  }

  const openEditDialog = (webhook: WebhookConfig) => {
    setEditingWebhook(webhook)
    setName(webhook.name)
    setUrl(webhook.url)
    setSecret('')
    setSelectedEvents(webhook.events as string[])
    setIsActive(webhook.isActive)
    setShowDialog(true)
  }

  const toggleEvent = (event: string) => {
    setSelectedEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event],
    )
  }

  const handleSave = async () => {
    if (editingWebhook) {
      await updateMutation.mutateAsync({
        id: editingWebhook.id,
        payload: {
          name,
          url,
          events: selectedEvents,
          ...(secret && { secret }),
          isActive,
        },
      })
    } else {
      await createMutation.mutateAsync({
        name,
        url,
        events: selectedEvents,
        secret: secret || undefined,
        isActive,
      })
    }
    setShowDialog(false)
    resetForm()
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    await deleteMutation.mutateAsync(deleteTarget.id)
    setDeleteTarget(null)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          이벤트 발생 시 외부 URL로 웹훅을 발송합니다.
        </p>
        <Button size="sm" onClick={openCreateDialog}>
          <Plus className="mr-1 h-4 w-4" />
          웹훅 추가
        </Button>
      </div>

      {!webhooks || webhooks.length === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="text-muted-foreground">등록된 웹훅이 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {webhooks.map((webhook) => (
            <div
              key={webhook.id}
              className="flex items-center justify-between rounded-lg border bg-card p-4"
            >
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">{webhook.name}</h4>
                  <Badge variant={webhook.isActive ? 'default' : 'secondary'}>
                    {webhook.isActive ? '활성' : '비활성'}
                  </Badge>
                </div>
                <p className="text-sm font-mono text-muted-foreground">{webhook.url}</p>
                <div className="flex flex-wrap gap-1">
                  {(webhook.events as string[]).map((event) => (
                    <Badge key={event} variant="outline" className="text-xs">
                      {WEBHOOK_EVENTS.find((e) => e.value === event)?.label || event}
                    </Badge>
                  ))}
                </div>
                {webhook.lastSentAt && (
                  <p className="text-xs text-muted-foreground">
                    마지막 발송: {new Date(webhook.lastSentAt).toLocaleString('ko-KR')}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => openEditDialog(webhook)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setDeleteTarget(webhook)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingWebhook ? '웹훅 수정' : '웹훅 추가'}</DialogTitle>
            <DialogDescription>
              {editingWebhook ? '웹훅 설정을 수정합니다.' : '새 웹훅을 등록합니다.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="webhookName">이름</Label>
              <Input
                id="webhookName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="예: Slack 알림"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="webhookUrl">URL</Label>
              <Input
                id="webhookUrl"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://hooks.slack.com/..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="webhookSecret">Secret (선택)</Label>
              <Input
                id="webhookSecret"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                placeholder={editingWebhook ? '변경하려면 입력' : 'HMAC 서명용 시크릿'}
              />
            </div>

            <div className="space-y-2">
              <Label>이벤트 선택</Label>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {WEBHOOK_EVENTS.map((event) => (
                  <label
                    key={event.value}
                    className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm cursor-pointer hover:bg-accent"
                  >
                    <input
                      type="checkbox"
                      checked={selectedEvents.includes(event.value)}
                      onChange={() => toggleEvent(event.value)}
                      className="rounded"
                    />
                    {event.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch checked={isActive} onCheckedChange={setIsActive} />
              <Label>활성화</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowDialog(false); resetForm() }}>
              취소
            </Button>
            <Button
              onClick={handleSave}
              disabled={!name || !url || selectedEvents.length === 0 || createMutation.isPending || updateMutation.isPending}
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              )}
              {editingWebhook ? '웹훅 수정' : '웹훅 추가'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>웹훅 삭제</DialogTitle>
            <DialogDescription>
              &quot;{deleteTarget?.name}&quot; 웹훅을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
