'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Input,
  Label,
} from '@letmein/ui'
import { useProcessPoints } from '@/features/user-manage'

const schema = z.object({
  type: z.enum(['admin_give', 'admin_deduct']),
  amount: z.number().min(1, '1 이상 입력해주세요.'),
  note: z.string().min(1, '사유를 입력해주세요.'),
  expiresAt: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface UserPointDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: number
  currentPoints: number
  userNickname: string
}

export function UserPointDialog({ open, onOpenChange, userId, currentPoints, userNickname }: UserPointDialogProps) {
  const [serverError, setServerError] = useState('')
  const processPoints = useProcessPoints()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: 'admin_give',
      amount: 0,
      note: '',
      expiresAt: '',
    },
  })

  const selectedType = watch('type')
  const amount = watch('amount')

  const previewBalance = selectedType === 'admin_deduct'
    ? currentPoints - (amount || 0)
    : currentPoints + (amount || 0)

  const onSubmit = async (data: FormValues) => {
    setServerError('')
    try {
      await processPoints.mutateAsync({
        id: userId,
        data: {
          amount: data.amount,
          type: data.type,
          note: data.note,
          expiresAt: data.expiresAt || undefined,
        },
      })
      reset()
      onOpenChange(false)
    } catch (err) {
      setServerError(err instanceof Error ? err.message : '포인트 처리에 실패했습니다.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>포인트 지급/차감</DialogTitle>
          <DialogDescription>
            <span className="font-medium">{userNickname}</span> 회원의 포인트를 관리합니다.
            현재 보유: <span className="font-medium">{currentPoints.toLocaleString()} P</span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>구분</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={selectedType === 'admin_give' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setValue('type', 'admin_give')}
              >
                지급
              </Button>
              <Button
                type="button"
                variant={selectedType === 'admin_deduct' ? 'destructive' : 'outline'}
                size="sm"
                onClick={() => setValue('type', 'admin_deduct')}
              >
                차감
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">포인트</Label>
            <Input
              id="amount"
              type="number"
              min={1}
              placeholder="포인트 수량"
              {...register('amount', { valueAsNumber: true })}
            />
            {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
            {amount > 0 && (
              <p className={`text-xs ${previewBalance < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                변경 후 잔액: {previewBalance.toLocaleString()} P
                {previewBalance < 0 && ' (잔액 부족)'}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">사유</Label>
            <Input
              id="note"
              placeholder="포인트 지급/차감 사유"
              {...register('note')}
            />
            {errors.note && <p className="text-xs text-destructive">{errors.note.message}</p>}
          </div>

          {selectedType === 'admin_give' && (
            <div className="space-y-2">
              <Label htmlFor="expiresAt">만료일 (선택)</Label>
              <Input
                id="expiresAt"
                type="date"
                {...register('expiresAt')}
              />
            </div>
          )}

          {serverError && (
            <p className="text-sm text-destructive">{serverError}</p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              취소
            </Button>
            <Button
              type="submit"
              variant={selectedType === 'admin_deduct' ? 'destructive' : 'default'}
              disabled={processPoints.isPending || previewBalance < 0}
            >
              {processPoints.isPending
                ? '처리 중...'
                : selectedType === 'admin_give'
                  ? '지급'
                  : '차감'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
