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
import type { HomepageSection, BoardPreviewConfig } from '@letmein/types'

interface Props {
  section: HomepageSection
  onBack: () => void
}

function SortableBoardItem({
  id,
  index,
  form,
  onRemove,
}: {
  id: string
  index: number
  form: ReturnType<typeof useForm<BoardPreviewConfig>>
  onRemove: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="flex items-end gap-3">
      <button
        type="button"
        className="cursor-grab self-center text-muted-foreground"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
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
        onClick={onRemove}
        className="text-destructive"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
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

  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: 'boards',
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
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-3">
                    {fields.map((field, index) => (
                      <SortableBoardItem
                        key={field.id}
                        id={field.id}
                        index={index}
                        form={form}
                        onRemove={() => remove(index)}
                      />
                    ))}
                    {fields.length === 0 && (
                      <p className="py-4 text-center text-sm text-muted-foreground">
                        게시판을 추가해주세요.
                      </p>
                    )}
                  </div>
                </SortableContext>
              </DndContext>
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
