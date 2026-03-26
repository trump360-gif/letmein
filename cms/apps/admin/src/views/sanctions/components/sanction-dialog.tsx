'use client'

import { useState } from 'react'
import {
  Button,
  Label,
  Input,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@letmein/ui'
import type { SanctionType } from '@letmein/types'
import { useCreateSanction } from '@/features/report-handle'
import { SANCTION_TYPES } from '@/shared/lib/constants'

interface SanctionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function SanctionDialog({ open, onOpenChange, onSuccess }: SanctionDialogProps) {
  const [userId, setUserId] = useState('')
  const [type, setType] = useState<SanctionType>('warning')
  const [reason, setReason] = useState('')
  const [durationDays, setDurationDays] = useState('')

  const createSanction = useCreateSanction()

  const handleSubmit = async () => {
    if (!userId) return

    await createSanction.mutateAsync({
      userId: Number(userId),
      type,
      reason: reason || undefined,
      durationDays: durationDays ? Number(durationDays) : undefined,
    })

    setUserId('')
    setType('warning')
    setReason('')
    setDurationDays('')
    onOpenChange(false)
    onSuccess?.()
  }

  const showDuration = type.startsWith('suspend') || type === 'permanent_ban'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>제재 적용</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>대상 유저 ID</Label>
            <Input
              type="number"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="유저 ID를 입력하세요"
            />
          </div>

          <div className="space-y-2">
            <Label>제재 유형</Label>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(SANCTION_TYPES).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setType(value as SanctionType)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    type === value
                      ? 'bg-foreground text-background'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {showDuration && (
            <div className="space-y-2">
              <Label>기간 (일)</Label>
              <Input
                type="number"
                value={durationDays}
                onChange={(e) => setDurationDays(e.target.value)}
                placeholder={type === 'permanent_ban' ? '영구' : '자동 설정됨'}
                disabled={type === 'permanent_ban'}
              />
              <p className="text-xs text-muted-foreground">
                비워두면 제재 유형에 따라 자동 설정됩니다.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label>제재 사유</Label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="제재 사유를 입력하세요"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!userId || createSanction.isPending}
            variant="destructive"
          >
            {createSanction.isPending ? '적용 중...' : '제재 적용'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
