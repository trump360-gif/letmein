'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Settings2, Plus, Trash2 } from 'lucide-react'
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
import { useGrades, useUpdateGrade } from '@/features/user-manage'
import type { UserGradeConfig, GradeConditions, GradeCondition } from '@letmein/types'

const editSchema = z.object({
  name: z.string().min(1, '등급명을 입력해주세요.'),
  autoUpgrade: z.boolean(),
  notifyUpgrade: z.boolean(),
  storageLimitMb: z.number().min(0),
})

type EditFormValues = z.infer<typeof editSchema>

function ConditionEditor({
  conditions,
  onChange,
}: {
  conditions: GradeConditions | null
  onChange: (conditions: GradeConditions) => void
}) {
  const current: GradeConditions = conditions || { operator: 'AND', rules: [] }

  const addRule = () => {
    onChange({
      ...current,
      rules: [...current.rules, { field: 'posts', operator: '>=', value: 0 }],
    })
  }

  const removeRule = (index: number) => {
    onChange({
      ...current,
      rules: current.rules.filter((_, i) => i !== index),
    })
  }

  const updateRule = (index: number, updates: Partial<GradeCondition>) => {
    onChange({
      ...current,
      rules: current.rules.map((r, i) => (i === index ? { ...r, ...updates } : r)),
    })
  }

  const fieldOptions = [
    { value: 'posts', label: '게시글 수' },
    { value: 'comments', label: '댓글 수' },
    { value: 'likes', label: '좋아요 수' },
    { value: 'points', label: '포인트' },
    { value: 'days_since_join', label: '가입 후 일수' },
    { value: 'login_count', label: '로그인 횟수' },
  ]

  const operatorOptions = [
    { value: '>=', label: '>=' },
    { value: '>', label: '>' },
    { value: '=', label: '=' },
    { value: '<=', label: '<=' },
    { value: '<', label: '<' },
  ]

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Label className="text-xs">조건 연산자</Label>
        <div className="flex flex-wrap gap-1.5">
          {[
            { value: 'AND' as const, label: 'AND (모두 충족)' },
            { value: 'OR' as const, label: 'OR (하나 이상 충족)' },
          ].map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange({ ...current, operator: opt.value })}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                current.operator === opt.value
                  ? 'bg-foreground text-background'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {current.rules.map((rule, index) => (
        <div key={index} className="space-y-2 rounded-lg border border-input p-2">
          <div className="flex flex-wrap gap-1.5">
            {fieldOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => updateRule(index, { field: opt.value as GradeCondition['field'] })}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  rule.field === opt.value
                    ? 'bg-foreground text-background'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex flex-wrap gap-1.5">
              {operatorOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => updateRule(index, { operator: opt.value as GradeCondition['operator'] })}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    rule.operator === opt.value
                      ? 'bg-foreground text-background'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <Input
              type="number"
              className="h-8 w-24 text-xs"
              value={rule.value}
              onChange={(e) => updateRule(index, { value: Number(e.target.value) })}
            />
            <Button type="button" variant="ghost" size="sm" onClick={() => removeRule(index)}>
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </Button>
          </div>
        </div>
      ))}

      <Button type="button" variant="outline" size="sm" onClick={addRule}>
        <Plus className="mr-1 h-3.5 w-3.5" />
        조건 추가
      </Button>
    </div>
  )
}

function GradeEditDialog({
  grade,
  open,
  onOpenChange,
}: {
  grade: UserGradeConfig
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [conditions, setConditions] = useState<GradeConditions | null>(grade.conditions)
  const [serverError, setServerError] = useState('')
  const updateGrade = useUpdateGrade()

  const { register, handleSubmit, formState: { errors } } = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      name: grade.name,
      autoUpgrade: grade.autoUpgrade,
      notifyUpgrade: grade.notifyUpgrade,
      storageLimitMb: grade.storageLimitMb,
    },
  })

  const onSubmit = async (data: EditFormValues) => {
    setServerError('')
    try {
      await updateGrade.mutateAsync({
        grade: grade.grade,
        data: {
          ...data,
          conditions: conditions,
        } as Partial<UserGradeConfig>,
      })
      onOpenChange(false)
    } catch (err) {
      setServerError(err instanceof Error ? err.message : '등급 설정 수정에 실패했습니다.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>등급 설정 편집 - {grade.name} (Lv.{grade.grade})</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">등급명</Label>
            <Input id="name" {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="storageLimitMb">저장 용량 제한 (MB)</Label>
            <Input
              id="storageLimitMb"
              type="number"
              {...register('storageLimitMb', { valueAsNumber: true })}
            />
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="rounded" {...register('autoUpgrade')} />
              자동 승급
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="rounded" {...register('notifyUpgrade')} />
              승급 알림
            </label>
          </div>

          {grade.grade > 1 && (
            <div className="space-y-2">
              <Label>승급 조건</Label>
              <ConditionEditor conditions={conditions} onChange={setConditions} />
            </div>
          )}

          {serverError && <p className="text-sm text-destructive">{serverError}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              취소
            </Button>
            <Button type="submit" disabled={updateGrade.isPending}>
              {updateGrade.isPending ? '저장 중...' : '저장'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

const GRADE_COLORS: Record<number, string> = {
  0: 'border-l-gray-400',
  1: 'border-l-blue-400',
  2: 'border-l-amber-500',
  3: 'border-l-slate-400',
  4: 'border-l-yellow-500',
  5: 'border-l-purple-500',
  9: 'border-l-red-500',
}

export function GradeSettings() {
  const { data: grades, isLoading } = useGrades()
  const [editGrade, setEditGrade] = useState<UserGradeConfig | null>(null)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">등급 관리</h2>
        <div className="rounded-lg border bg-card p-12 text-center text-muted-foreground">
          로딩 중...
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">등급 관리</h2>
          <p className="text-sm text-muted-foreground mt-1">
            회원 등급 구조와 자동 승급 조건을 설정합니다.
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        {grades?.map((grade) => (
          <div
            key={grade.grade}
            className={`rounded-lg border bg-card p-4 border-l-4 ${GRADE_COLORS[grade.grade] || 'border-l-gray-300'}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div>
                  <h3 className="font-semibold">
                    Lv.{grade.grade} - {grade.name}
                  </h3>
                  <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                    <span>저장 용량: {grade.storageLimitMb}MB</span>
                    <span className={grade.autoUpgrade ? 'text-green-600' : 'text-gray-400'}>
                      {grade.autoUpgrade ? '자동 승급 ON' : '자동 승급 OFF'}
                    </span>
                    <span className={grade.notifyUpgrade ? 'text-blue-600' : 'text-gray-400'}>
                      {grade.notifyUpgrade ? '알림 ON' : '알림 OFF'}
                    </span>
                  </div>
                  {grade.conditions && (grade.conditions as GradeConditions).rules?.length > 0 && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      <span className="font-medium">승급 조건 ({(grade.conditions as GradeConditions).operator}):</span>{' '}
                      {(grade.conditions as GradeConditions).rules.map((r, i) => (
                        <span key={i}>
                          {i > 0 && ` ${(grade.conditions as GradeConditions).operator} `}
                          {r.field} {r.operator} {r.value}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setEditGrade(grade)}>
                <Settings2 className="h-4 w-4 mr-1" />
                설정
              </Button>
            </div>
          </div>
        ))}
      </div>

      {editGrade && (
        <GradeEditDialog
          grade={editGrade}
          open={!!editGrade}
          onOpenChange={(open) => !open && setEditGrade(null)}
        />
      )}
    </div>
  )
}
