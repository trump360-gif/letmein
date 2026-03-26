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
import { InlineIconPicker } from '@/widgets/icon-picker'
import { TRUST_STAT_PRESETS } from '@/shared/lib/icon-sets'
import type { HomepageSection, TrustStatsConfig } from '@letmein/types'

interface Props {
  section: HomepageSection
  onBack: () => void
}

interface StatsFormValues {
  items: {
    icon: string
    iconBgColor: string
    label: string
    value: string
  }[]
}

export function TrustStatsEditor({ section, onBack }: Props) {
  const config = section.config as unknown as TrustStatsConfig
  const updateSection = useUpdateHomepageSection()
  const [saved, setSaved] = useState(false)

  const hasItems = config?.items && config.items.length > 0
  const form = useForm<StatsFormValues>({
    defaultValues: {
      items: hasItems
        ? config.items.map((item) => ({
            icon: item.icon,
            iconBgColor: item.iconBgColor,
            label: item.label,
            value: item.value,
          }))
        : TRUST_STAT_PRESETS.map((p) => ({
            icon: p.icon,
            iconBgColor: p.iconBgColor,
            label: p.label,
            value: p.value,
          })),
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  })

  function onSubmit(values: StatsFormValues) {
    const payload: TrustStatsConfig = {
      items: values.items.map((item, i) => ({
        ...item,
        id: `stat-${i}`,
        sortOrder: i + 1,
      })),
    }
    updateSection.mutate(
      { id: section.id, payload: { config: payload as unknown as Record<string, unknown> } },
      {
        onSuccess: () => {
          setSaved(true)
          setTimeout(() => setSaved(false), 2000)
        },
      },
    )
  }

  function loadPresets() {
    const current = form.getValues('items')
    if (current.length > 0 && !confirm('현재 항목을 기본 프리셋으로 교체할까요?')) return
    form.setValue('items', TRUST_STAT_PRESETS.map((p) => ({
      icon: p.icon,
      iconBgColor: p.iconBgColor,
      label: p.label,
      value: p.value,
    })))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="mr-1 h-4 w-4" />
          목록으로
        </Button>
        <h3 className="text-lg font-semibold">신뢰 통계 편집</h3>
      </div>

      {/* 프리뷰 */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-around">
            {fields.map((field, i) => (
              <div key={field.id} className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-sm"
                  style={{ backgroundColor: form.watch(`items.${i}.iconBgColor`) || '#EFF6FF' }}
                >
                  {form.watch(`items.${i}.icon`) || '?'}
                </div>
                <div>
                  <p className="text-xs text-zinc-500">{form.watch(`items.${i}.label`) || '라벨'}</p>
                  <p className="text-sm font-bold">{form.watch(`items.${i}.value`) || '0'}</p>
                </div>
                {i < fields.length - 1 && <div className="mx-4 h-9 w-px bg-zinc-200" />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">통계 항목</h4>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={loadPresets}>
                  기본 프리셋 불러오기
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ icon: '', iconBgColor: '#EFF6FF', label: '', value: '' })}
                >
                  <Plus className="mr-1 h-4 w-4" />
                  항목 추가
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-[56px_1fr_1fr_auto] items-end gap-3 rounded-lg border p-3">
                  <div className="space-y-1">
                    <Label className="text-xs">아이콘</Label>
                    <InlineIconPicker
                      value={form.watch(`items.${index}.icon`)}
                      bgColor={form.watch(`items.${index}.iconBgColor`)}
                      onSelect={(v) => form.setValue(`items.${index}.icon`, v)}
                      onBgColorChange={(v) => form.setValue(`items.${index}.iconBgColor`, v)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">라벨</Label>
                    <Input placeholder="누적 시술 건수" {...form.register(`items.${index}.label`)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">값</Label>
                    <Input placeholder="15,000+" {...form.register(`items.${index}.value`)} />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(index)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {fields.length === 0 && (
                <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                  통계 항목이 없습니다. "기본 프리셋 불러오기" 또는 "항목 추가"를 클릭하세요.
                </div>
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
