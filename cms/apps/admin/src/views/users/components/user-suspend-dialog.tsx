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
import { useSuspendUser } from '@/features/user-manage'

const schema = z.object({
  reason: z.string().min(1, '정지 사유를 입력해주세요.'),
  durationDays: z.number().min(1, '1일 이상 입력해주세요.').max(3650, '최대 3650일까지 가능합니다.'),
})

type FormValues = z.infer<typeof schema>

const PRESET_DURATIONS = [
  { label: '1일', days: 1 },
  { label: '3일', days: 3 },
  { label: '7일', days: 7 },
  { label: '30일', days: 30 },
  { label: '90일', days: 90 },
  { label: '365일', days: 365 },
]

interface UserSuspendDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: number
  userNickname: string
}

export function UserSuspendDialog({ open, onOpenChange, userId, userNickname }: UserSuspendDialogProps) {
  const [serverError, setServerError] = useState('')
  const suspendUser = useSuspendUser()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      reason: '',
      durationDays: 7,
    },
  })

  const durationDays = watch('durationDays')

  const onSubmit = async (data: FormValues) => {
    setServerError('')
    try {
      await suspendUser.mutateAsync({ id: userId, data })
      reset()
      onOpenChange(false)
    } catch (err) {
      setServerError(err instanceof Error ? err.message : '계정 정지에 실패했습니다.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>계정 정지</DialogTitle>
          <DialogDescription>
            <span className="font-medium">{userNickname}</span> 회원의 계정을 정지합니다.
            정지된 계정은 로그인이 불가능합니다.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>정지 기간</Label>
            <div className="flex flex-wrap gap-2">
              {PRESET_DURATIONS.map((preset) => (
                <Button
                  key={preset.days}
                  type="button"
                  variant={durationDays === preset.days ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setValue('durationDays', preset.days)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={1}
                max={3650}
                className="w-24"
                {...register('durationDays', { valueAsNumber: true })}
              />
              <span className="text-sm text-muted-foreground">일</span>
            </div>
            {errors.durationDays && (
              <p className="text-xs text-destructive">{errors.durationDays.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">정지 사유</Label>
            <textarea
              id="reason"
              className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="정지 사유를 상세히 입력하세요"
              {...register('reason')}
            />
            {errors.reason && <p className="text-xs text-destructive">{errors.reason.message}</p>}
          </div>

          {serverError && (
            <p className="text-sm text-destructive">{serverError}</p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              취소
            </Button>
            <Button type="submit" variant="destructive" disabled={suspendUser.isPending}>
              {suspendUser.isPending ? '처리 중...' : '계정 정지'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
