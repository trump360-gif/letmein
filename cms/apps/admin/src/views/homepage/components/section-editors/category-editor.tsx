'use client'

import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Card,
  CardContent,
  Button,
  Input,
  Label,
} from '@letmein/ui'
import { ArrowLeft, Save, Plus, Trash2, GripVertical } from 'lucide-react'
import { useUpdateHomepageSection } from '@/features/homepage-manage'
import { InlineIconPicker } from '@/widgets/icon-picker'
import { BEAUTY_CATEGORY_PRESETS } from '@/shared/lib/icon-sets'
import type { HomepageSection, CategorySectionConfig } from '@letmein/types'

interface Props {
  section: HomepageSection
  onBack: () => void
}

function SortableCategoryItem({
  id,
  index,
  form,
  onRemove,
}: {
  id: string
  index: number
  form: ReturnType<typeof useForm<CategoryFormValues>>
  onRemove: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="grid grid-cols-[24px_56px_1fr_1fr_auto] items-end gap-3 rounded-lg border p-3">
      <button
        type="button"
        className="cursor-grab self-center text-muted-foreground"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
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
        <Label className="text-xs">카테고리명</Label>
        <Input placeholder="쌍꺼풀" {...form.register(`items.${index}.label`)} />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">링크</Label>
        <Input placeholder="/categories/eye" {...form.register(`items.${index}.href`)} />
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onRemove}
        className="text-destructive hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}

interface CategoryFormValues {
  title: string
  moreHref: string
  items: {
    icon: string
    iconBgColor: string
    label: string
    href: string
  }[]
}

export function CategoryEditor({ section, onBack }: Props) {
  const config = section.config as unknown as CategorySectionConfig
  const updateSection = useUpdateHomepageSection()
  const [saved, setSaved] = useState(false)

  const hasItems = config?.items && config.items.length > 0
  const form = useForm<CategoryFormValues>({
    defaultValues: {
      title: config?.title || '시술 카테고리',
      moreHref: config?.moreHref || '/categories',
      items: hasItems
        ? config.items.map((item) => ({
            icon: item.icon,
            iconBgColor: item.iconBgColor,
            label: item.label,
            href: item.href,
          }))
        : BEAUTY_CATEGORY_PRESETS.map((p) => ({
            icon: p.icon,
            iconBgColor: p.iconBgColor,
            label: p.label,
            href: p.href,
          })),
    },
  })

  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: 'items',
  })

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = fields.findIndex((f) => f.id === active.id)
    const newIndex = fields.findIndex((f) => f.id === over.id)
    if (oldIndex !== -1 && newIndex !== -1) move(oldIndex, newIndex)
  }

  function onSubmit(values: CategoryFormValues) {
    const payload: CategorySectionConfig = {
      title: values.title,
      moreHref: values.moreHref,
      items: values.items.map((item, i) => ({
        ...item,
        id: `cat-${i}`,
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
    form.setValue('items', BEAUTY_CATEGORY_PRESETS.map((p) => ({
      icon: p.icon,
      iconBgColor: p.iconBgColor,
      label: p.label,
      href: p.href,
    })))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="mr-1 h-4 w-4" />
          목록으로
        </Button>
        <h3 className="text-lg font-semibold">시술 카테고리 편집</h3>
      </div>

      {/* 프리뷰 */}
      <Card>
        <CardContent className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-lg font-bold">{form.watch('title') || '시술 카테고리'}</span>
            <span className="text-sm text-blue-600">전체보기 →</span>
          </div>
          <div className="grid grid-cols-4 gap-4">
            {fields.map((field, i) => (
              <div key={field.id} className="flex flex-col items-center gap-2">
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-xl text-lg"
                  style={{ backgroundColor: form.watch(`items.${i}.iconBgColor`) || '#EFF6FF' }}
                >
                  {form.watch(`items.${i}.icon`) || '?'}
                </div>
                <span className="text-xs text-zinc-600">
                  {form.watch(`items.${i}.label`) || `카테고리 ${i + 1}`}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardContent className="space-y-4 p-6">
            <h4 className="font-semibold">섹션 설정</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>섹션 제목</Label>
                <Input {...form.register('title')} />
              </div>
              <div className="space-y-2">
                <Label>전체보기 링크</Label>
                <Input {...form.register('moreHref')} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">카테고리 항목</h4>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={loadPresets}
                >
                  기본 프리셋 불러오기
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ icon: '', iconBgColor: '#EFF6FF', label: '', href: '' })}
                >
                  <Plus className="mr-1 h-4 w-4" />
                  항목 추가
                </Button>
              </div>
            </div>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
                  {fields.map((field, index) => (
                    <SortableCategoryItem
                      key={field.id}
                      id={field.id}
                      index={index}
                      form={form}
                      onRemove={() => remove(index)}
                    />
                  ))}
                  {fields.length === 0 && (
                    <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                      카테고리가 없습니다. "기본 프리셋 불러오기" 또는 "항목 추가"를 클릭하세요.
                    </div>
                  )}
                </div>
              </SortableContext>
            </DndContext>
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
