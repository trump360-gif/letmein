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
  Textarea,
} from '@letmein/ui'
import { ArrowLeft, Save, Plus, Trash2, UserCircle, GripVertical } from 'lucide-react'
import { useUpdateHomepageSection } from '@/features/homepage-manage'
import type { HomepageSection, DoctorSectionConfig } from '@letmein/types'

interface Props {
  section: HomepageSection
  onBack: () => void
}

interface DoctorFormValues {
  title: string
  moreHref: string
  items: {
    name: string
    specialty: string
    description: string
    imageUrl: string
  }[]
}

function SortableDoctorItem({
  id,
  index,
  form,
  onRemove,
}: {
  id: string
  index: number
  form: ReturnType<typeof useForm<DoctorFormValues>>
  onRemove: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="rounded-lg border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="cursor-grab text-muted-foreground"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <span className="text-sm font-medium">
            {form.watch(`items.${index}.name`) || `의료진 ${index + 1}`}
          </span>
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

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">이름</Label>
          <Input placeholder="김OO 원장" {...form.register(`items.${index}.name`)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">전문분야</Label>
          <Input placeholder="안면윤곽 전문" {...form.register(`items.${index}.specialty`)} />
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">소개</Label>
        <Textarea
          rows={2}
          placeholder="경력 및 소개..."
          {...form.register(`items.${index}.description`)}
        />
      </div>

      <div className="space-y-1">
        <Label className="text-xs">프로필 이미지 URL</Label>
        <Input placeholder="https://..." {...form.register(`items.${index}.imageUrl`)} />
      </div>
    </div>
  )
}

export function DoctorEditor({ section, onBack }: Props) {
  const config = section.config as unknown as DoctorSectionConfig
  const updateSection = useUpdateHomepageSection()
  const [saved, setSaved] = useState(false)

  const hasItems = config?.items && config.items.length > 0
  const form = useForm<DoctorFormValues>({
    defaultValues: {
      title: config?.title || '전문 의료진',
      moreHref: config?.moreHref || '/doctors',
      items: hasItems
        ? config.items.map((item) => ({
            name: item.name,
            specialty: item.specialty,
            description: item.description,
            imageUrl: item.imageUrl,
          }))
        : [
            { name: '김민수 원장', specialty: '안면윤곽 전문의', description: '서울대학교 의과대학 졸업\n성형외과 전문의 15년 경력', imageUrl: '' },
            { name: '이지현 원장', specialty: '피부과 전문의', description: '연세대학교 의과대학 졸업\n피부레이저 시술 전문', imageUrl: '' },
          ],
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

  function onSubmit(values: DoctorFormValues) {
    const payload: DoctorSectionConfig = {
      title: values.title,
      moreHref: values.moreHref,
      items: values.items.map((item, i) => ({
        ...item,
        id: `doc-${i}`,
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="mr-1 h-4 w-4" />
          목록으로
        </Button>
        <h3 className="text-lg font-semibold">전문 의료진 편집</h3>
      </div>

      {/* 프리뷰 */}
      <Card>
        <CardContent className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-lg font-bold">{form.watch('title') || '전문 의료진'}</span>
            <span className="text-sm text-blue-600">전체보기 →</span>
          </div>
          <div className="grid grid-cols-4 gap-5">
            {fields.map((field, i) => (
              <div key={field.id} className="flex flex-col items-center gap-3 rounded-xl bg-zinc-50 p-5">
                {form.watch(`items.${i}.imageUrl`) ? (
                  <img
                    src={form.watch(`items.${i}.imageUrl`)}
                    alt={form.watch(`items.${i}.name`)}
                    className="h-16 w-16 rounded-full object-cover"
                  />
                ) : (
                  <UserCircle className="h-16 w-16 text-zinc-300" />
                )}
                <div className="text-center">
                  <p className="font-semibold text-sm">{form.watch(`items.${i}.name`) || '이름'}</p>
                  <p className="text-xs text-zinc-500">{form.watch(`items.${i}.specialty`) || '전문분야'}</p>
                </div>
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
              <h4 className="font-semibold">의료진 목록</h4>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const current = form.getValues('items')
                    if (current.length > 0 && !confirm('현재 항목을 샘플 데이터로 교체할까요?')) return
                    form.setValue('items', [
                      { name: '김민수 원장', specialty: '안면윤곽 전문의', description: '서울대학교 의과대학 졸업\n성형외과 전문의 15년 경력', imageUrl: '' },
                      { name: '이지현 원장', specialty: '피부과 전문의', description: '연세대학교 의과대학 졸업\n피부레이저 시술 전문', imageUrl: '' },
                      { name: '박준혁 원장', specialty: '코성형 전문의', description: '고려대학교 의과대학 졸업\n코성형 10,000건+ 수술 경력', imageUrl: '' },
                    ])
                  }}
                >
                  샘플 데이터 불러오기
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    append({ name: '', specialty: '', description: '', imageUrl: '' })
                  }
                >
                  <Plus className="mr-1 h-4 w-4" />
                  의료진 추가
                </Button>
              </div>
            </div>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <SortableDoctorItem
                      key={field.id}
                      id={field.id}
                      index={index}
                      form={form}
                      onRemove={() => remove(index)}
                    />
                  ))}
                  {fields.length === 0 && (
                    <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                      등록된 의료진이 없습니다. &quot;샘플 데이터 불러오기&quot; 또는 &quot;의료진 추가&quot;를 클릭하세요.
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
