'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Coins, Settings2, ToggleLeft, ToggleRight } from 'lucide-react'
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
import { usePointRules, useUpdatePointRule } from '@/features/user-manage'
import { POINT_RULE_TYPES } from '@/shared/lib/constants'
import type { PointRuleItem } from '@letmein/types'

const editSchema = z.object({
  amount: z.number(),
  dailyLimit: z.number().nullable(),
  minLength: z.number().nullable(),
  isActive: z.boolean(),
})

type EditFormValues = z.infer<typeof editSchema>

function PointRuleEditDialog({
  rule,
  open,
  onOpenChange,
}: {
  rule: PointRuleItem
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [serverError, setServerError] = useState('')
  const updateRule = useUpdatePointRule()

  const { register, handleSubmit, formState: { errors } } = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      amount: rule.amount,
      dailyLimit: rule.dailyLimit,
      minLength: rule.minLength,
      isActive: rule.isActive,
    },
  })

  const onSubmit = async (data: EditFormValues) => {
    setServerError('')
    try {
      await updateRule.mutateAsync({
        type: rule.type,
        data: {
          amount: data.amount,
          dailyLimit: data.dailyLimit,
          minLength: data.minLength,
          isActive: data.isActive,
        },
      })
      onOpenChange(false)
    } catch (err) {
      setServerError(err instanceof Error ? err.message : '규칙 수정에 실패했습니다.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            포인트 규칙 편집 - {POINT_RULE_TYPES[rule.type] || rule.type}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">지급 포인트</Label>
            <Input
              id="amount"
              type="number"
              {...register('amount', { valueAsNumber: true })}
            />
            {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="dailyLimit">일일 제한 (0 = 무제한)</Label>
            <Input
              id="dailyLimit"
              type="number"
              min={0}
              {...register('dailyLimit', {
                setValueAs: (v: string) => (v === '' ? null : Number(v)),
              })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="minLength">최소 글자수 (선택)</Label>
            <Input
              id="minLength"
              type="number"
              min={0}
              {...register('minLength', {
                setValueAs: (v: string) => (v === '' ? null : Number(v)),
              })}
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="rounded" {...register('isActive')} />
              활성화
            </label>
          </div>

          {serverError && <p className="text-sm text-destructive">{serverError}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              취소
            </Button>
            <Button type="submit" disabled={updateRule.isPending}>
              {updateRule.isPending ? '저장 중...' : '저장'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function PointRules() {
  const { data: rules, isLoading } = usePointRules()
  const [editRule, setEditRule] = useState<PointRuleItem | null>(null)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">포인트 규칙 관리</h2>
        <div className="rounded-lg border bg-card p-12 text-center text-muted-foreground">
          로딩 중...
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">포인트 규칙 관리</h2>
        <p className="text-sm text-muted-foreground mt-1">
          포인트 지급 규칙과 제한을 설정합니다.
        </p>
      </div>

      <div className="rounded-lg border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">규칙</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">타입</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">지급 포인트</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">일일 제한</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">최소 글자수</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">상태</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">관리</th>
              </tr>
            </thead>
            <tbody>
              {(!rules || rules.length === 0) ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    등록된 규칙이 없습니다.
                  </td>
                </tr>
              ) : (
                rules.map((rule) => (
                  <tr key={rule.type} className="border-b last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Coins className="h-4 w-4 text-yellow-500" />
                        <span className="font-medium">
                          {POINT_RULE_TYPES[rule.type] || rule.type}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {rule.type}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {rule.amount > 0 ? '+' : ''}{rule.amount} P
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {rule.dailyLimit ? `${rule.dailyLimit}회` : '무제한'}
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {rule.minLength ? `${rule.minLength}자` : '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {rule.isActive ? (
                        <ToggleRight className="h-5 w-5 text-green-500 mx-auto" />
                      ) : (
                        <ToggleLeft className="h-5 w-5 text-gray-400 mx-auto" />
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Button variant="ghost" size="sm" onClick={() => setEditRule(rule)}>
                        <Settings2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editRule && (
        <PointRuleEditDialog
          rule={editRule}
          open={!!editRule}
          onOpenChange={(open) => !open && setEditRule(null)}
        />
      )}
    </div>
  )
}
