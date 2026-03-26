'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Input,
  Label,
} from '@letmein/ui'
import type { BoardGroup } from '@letmein/types'
import { useCreateBoardGroup, useUpdateBoardGroup } from '@/features/board-manage'

const schema = z.object({
  nameKey: z.string().min(1, '대분류 이름은 필수입니다.'),
  isVisible: z.boolean(),
})

type FormValues = z.infer<typeof schema>

interface BoardGroupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  group?: BoardGroup | null
}

export function BoardGroupDialog({ open, onOpenChange, group }: BoardGroupDialogProps) {
  const isEdit = !!group

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      nameKey: '',
      isVisible: true,
    },
  })

  const createMutation = useCreateBoardGroup()
  const updateMutation = useUpdateBoardGroup()

  useEffect(() => {
    if (group) {
      reset({
        nameKey: group.nameKey,
        isVisible: group.isVisible,
      })
    } else {
      reset({ nameKey: '', isVisible: true })
    }
  }, [group, reset])

  const onSubmit = async (values: FormValues) => {
    try {
      if (isEdit && group) {
        await updateMutation.mutateAsync({
          id: group.id,
          data: values,
        })
      } else {
        await createMutation.mutateAsync(values)
      }
      onOpenChange(false)
      reset()
    } catch (error) {
      console.error('Board group save error:', error)
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending
  const isVisibleValue = watch('isVisible')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? '대분류 수정' : '대분류 추가'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nameKey">대분류 이름</Label>
            <Input
              id="nameKey"
              placeholder="예: 커뮤니티, 고객센터"
              {...register('nameKey')}
            />
            {errors.nameKey && (
              <p className="text-sm text-destructive">{errors.nameKey.message}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isVisible"
              checked={isVisibleValue}
              onChange={(e) => setValue('isVisible', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="isVisible">표시 여부</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              취소
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? '저장 중...' : isEdit ? '대분류 수정' : '대분류 추가'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
