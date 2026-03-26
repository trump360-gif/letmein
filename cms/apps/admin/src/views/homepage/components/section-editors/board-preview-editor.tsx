'use client'

import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import {
  Card,
  CardContent,
  Button,
  Input,
  Label,
} from '@letmein/ui'
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react'
import { useUpdateHomepageSection } from '@/features/homepage-manage'
import type { HomepageSection, BoardPreviewConfig } from '@letmein/types'

interface Props {
  section: HomepageSection
  onBack: () => void
}

export function BoardPreviewEditor({ section, onBack }: Props) {
  const config = section.config as unknown as BoardPreviewConfig
  const updateSection = useUpdateHomepageSection()
  const [saved, setSaved] = useState(false)

  const form = useForm<BoardPreviewConfig>({
    defaultValues: {
      title: config?.title ?? '게시판',
      boards: config?.boards ?? [],
      columns: config?.columns ?? 2,
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'boards',
  })

  function onSubmit(values: BoardPreviewConfig) {
    updateSection.mutate(
      { id: section.id, payload: { config: values as unknown as Record<string, unknown> } },
      {
        onSuccess: () => {
          setSaved(true)
          setTimeout(() => setSaved(false), 2000)
        },
      },
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="mr-1 h-4 w-4" />
          목록으로
        </Button>
        <h3 className="text-lg font-semibold">게시판 미리보기 편집</h3>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardContent className="space-y-4 p-6">
            <h4 className="font-semibold">게시판 미리보기 설정</h4>

            <div className="space-y-2">
              <Label>섹션 제목</Label>
              <Input placeholder="게시판" {...form.register('title')} />
            </div>

            <div className="space-y-2">
              <Label>컬럼 수</Label>
              <div className="flex gap-2">
                {[2, 3, 4].map((col) => (
                  <button
                    key={col}
                    type="button"
                    onClick={() => form.setValue('columns', col)}
                    className={`rounded-lg border px-4 py-2 text-sm ${
                      form.watch('columns') === col
                        ? 'border-primary bg-primary/5 font-medium'
                        : 'border-border hover:bg-muted'
                    }`}
                  >
                    {col}열
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>게시판 목록</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ boardId: '', limit: 5 })}
                >
                  <Plus className="mr-1 h-3 w-3" />
                  추가
                </Button>
              </div>
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-end gap-3">
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs">게시판 ID</Label>
                    <Input
                      placeholder="게시판 ID"
                      {...form.register(`boards.${index}.boardId`)}
                    />
                  </div>
                  <div className="w-24 space-y-1">
                    <Label className="text-xs">표시 수</Label>
                    <Input
                      type="number"
                      min={1}
                      max={10}
                      {...form.register(`boards.${index}.limit`, { valueAsNumber: true })}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(index)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {fields.length === 0 && (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  게시판을 추가해주세요.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={updateSection.isPending}>
            <Save className="mr-2 h-4 w-4" />
            {updateSection.isPending ? '저장 중...' : saved ? '저장 완료!' : '저장'}
          </Button>
        </div>
      </form>
    </div>
  )
}
