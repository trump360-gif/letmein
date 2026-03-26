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
import { USER_GRADES } from '@/shared/lib/constants'
import { useChangeGrade } from '@/features/user-manage'

const schema = z.object({
  grade: z.number().min(0).max(9),
  reason: z.string().min(1, '변경 사유를 입력해주세요.'),
})

type FormValues = z.infer<typeof schema>

interface UserGradeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: number
  currentGrade: number
  userNickname: string
}

export function UserGradeDialog({ open, onOpenChange, userId, currentGrade, userNickname }: UserGradeDialogProps) {
  const [serverError, setServerError] = useState('')
  const changeGrade = useChangeGrade()

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
      grade: currentGrade,
      reason: '',
    },
  })

  const selectedGrade = watch('grade')

  const onSubmit = async (data: FormValues) => {
    setServerError('')
    try {
      await changeGrade.mutateAsync({ id: userId, data })
      reset()
      onOpenChange(false)
    } catch (err) {
      setServerError(err instanceof Error ? err.message : '등급 변경에 실패했습니다.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>등급 변경</DialogTitle>
          <DialogDescription>
            <span className="font-medium">{userNickname}</span> 회원의 등급을 변경합니다.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>현재 등급</Label>
            <p className="text-sm font-medium text-muted-foreground">
              {USER_GRADES[currentGrade] || `Lv.${currentGrade}`}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="grade">변경할 등급</Label>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(USER_GRADES)
                .filter(([val]) => Number(val) !== currentGrade)
                .map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setValue('grade', Number(value))}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                      selectedGrade === Number(value)
                        ? 'bg-foreground text-background'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                    }`}
                  >
                    {label} (Lv.{value})
                  </button>
                ))}
            </div>
            {errors.grade && <p className="text-xs text-destructive">{errors.grade.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">변경 사유</Label>
            <Input
              id="reason"
              placeholder="등급 변경 사유를 입력하세요"
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
            <Button type="submit" disabled={changeGrade.isPending}>
              {changeGrade.isPending ? '변경 중...' : '등급 변경'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
