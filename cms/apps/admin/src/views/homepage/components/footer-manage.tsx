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
import { Plus, Trash2, Save, GripVertical } from 'lucide-react'
import { useSiteFooter, useUpdateSiteFooter } from '@/features/homepage-manage'
import type { SiteFooterUpdateInput } from '@letmein/types'

interface FooterColumnForm {
  title: string
  items: { label: string; href: string }[]
  sortOrder: number
}

interface FooterFormValues {
  description: string
  columns: FooterColumnForm[]
  copyright: string
  bottomLinks: { label: string; href: string }[]
}

export function FooterManage() {
  const { data: footer, isLoading } = useSiteFooter()
  const updateFooter = useUpdateSiteFooter()
  const [saved, setSaved] = useState(false)

  const form = useForm<FooterFormValues>({
    values: footer
      ? {
          description: footer.description,
          columns: footer.columns.map((col) => ({
            title: col.title,
            items: col.items.map((item) => ({
              label: item.label,
              href: item.href,
            })),
            sortOrder: col.sortOrder,
          })),
          copyright: footer.copyright,
          bottomLinks: footer.bottomLinks.map((link) => ({
            label: link.label,
            href: link.href,
          })),
        }
      : undefined,
  })

  const { fields: columnFields, append: appendColumn, remove: removeColumn, move: moveColumn } = useFieldArray({
    control: form.control,
    name: 'columns',
  })

  const { fields: linkFields, append: appendLink, remove: removeLink } = useFieldArray({
    control: form.control,
    name: 'bottomLinks',
  })

  const columnSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function handleColumnDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = columnFields.findIndex((f) => f.id === active.id)
    const newIndex = columnFields.findIndex((f) => f.id === over.id)
    if (oldIndex !== -1 && newIndex !== -1) moveColumn(oldIndex, newIndex)
  }

  function onSubmit(values: FooterFormValues) {
    const payload: SiteFooterUpdateInput = {
      description: values.description,
      columns: values.columns.map((col, i) => ({
        title: col.title,
        items: col.items.map((item) => ({
          label: item.label,
          href: item.href,
        })),
        sortOrder: i + 1,
      })),
      copyright: values.copyright,
      bottomLinks: values.bottomLinks.map((link) => ({
        label: link.label,
        href: link.href,
      })),
    }
    updateFooter.mutate(payload, {
      onSuccess: () => {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      },
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* 프리뷰 */}
      <Card>
        <CardContent className="p-0">
          <div className="space-y-5 rounded-lg bg-zinc-900 p-8">
            <div className="flex justify-between">
              <div className="w-64 space-y-2">
                <div className="flex items-center gap-2 text-white">
                  <span className="text-sm font-bold">뷰티클리닉</span>
                </div>
                <p className="text-[11px] leading-relaxed text-white/50">
                  {form.watch('description') || '설명을 입력하세요'}
                </p>
              </div>
              {columnFields.map((col, i) => (
                <div key={col.id} className="space-y-2">
                  <p className="text-xs font-semibold text-white">
                    {form.watch(`columns.${i}.title`) || `컬럼 ${i + 1}`}
                  </p>
                  {(form.watch(`columns.${i}.items`) || []).map((item, j) => (
                    <p key={j} className="text-[11px] text-white/50">
                      {item.label || '항목명'}
                    </p>
                  ))}
                </div>
              ))}
            </div>
            <div className="border-t border-white/10 pt-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-white/30">
                  {form.watch('copyright') || '© 2026 뷰티클리닉'}
                </span>
                <div className="flex gap-4">
                  {linkFields.map((link, i) => (
                    <span key={link.id} className="text-[11px] text-white/30">
                      {form.watch(`bottomLinks.${i}.label`) || '링크'}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 기본 정보 */}
      <Card>
        <CardContent className="space-y-4 p-6">
          <h3 className="font-semibold">기본 정보</h3>
          <div className="space-y-2">
            <Label htmlFor="footerDesc">사이트 설명</Label>
            <Textarea
              id="footerDesc"
              rows={3}
              placeholder="미용성형에 관한 올바른 지식과 최신 정보를 전달하는 뷰티클리닉입니다."
              {...form.register('description')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="copyright">저작권 표기</Label>
            <Input
              id="copyright"
              placeholder="© 2026 뷰티클리닉 All Rights Reserved."
              {...form.register('copyright')}
            />
          </div>
        </CardContent>
      </Card>

      {/* 컬럼별 메뉴 */}
      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">푸터 컬럼 관리</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                appendColumn({
                  title: '',
                  items: [{ label: '', href: '' }],
                  sortOrder: columnFields.length + 1,
                })
              }
            >
              <Plus className="mr-1 h-4 w-4" />
              컬럼 추가
            </Button>
          </div>

          <DndContext sensors={columnSensors} collisionDetection={closestCenter} onDragEnd={handleColumnDragEnd}>
            <SortableContext items={columnFields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-3">
                {columnFields.map((column, colIndex) => (
                  <SortableColumnEditor
                    key={column.id}
                    id={column.id}
                    colIndex={colIndex}
                    form={form}
                    onRemove={() => removeColumn(colIndex)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {columnFields.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              푸터 컬럼이 없습니다.
            </p>
          )}
        </CardContent>
      </Card>

      {/* 하단 링크 */}
      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">하단 링크</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => appendLink({ label: '', href: '' })}
            >
              <Plus className="mr-1 h-4 w-4" />
              링크 추가
            </Button>
          </div>

          <div className="space-y-2">
            {linkFields.map((link, index) => (
              <div key={link.id} className="flex items-center gap-3">
                <Input
                  placeholder="링크 텍스트 (예: 개인정보처리방침)"
                  {...form.register(`bottomLinks.${index}.label`)}
                />
                <Input
                  placeholder="URL (예: /privacy)"
                  {...form.register(`bottomLinks.${index}.href`)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeLink(index)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 저장 */}
      <div className="flex justify-end">
        <Button type="submit" disabled={updateFooter.isPending}>
          <Save className="mr-2 h-4 w-4" />
          {updateFooter.isPending ? '저장 중...' : saved ? '저장 완료!' : '저장'}
        </Button>
      </div>
    </form>
  )
}

function SortableColumnEditor({
  id,
  colIndex,
  form,
  onRemove,
}: {
  id: string
  colIndex: number
  form: ReturnType<typeof useForm<FooterFormValues>>
  onRemove: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const columnStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: `columns.${colIndex}.items`,
  })

  const itemSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function handleItemDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = fields.findIndex((f) => f.id === active.id)
    const newIndex = fields.findIndex((f) => f.id === over.id)
    if (oldIndex !== -1 && newIndex !== -1) move(oldIndex, newIndex)
  }

  return (
    <div ref={setNodeRef} style={columnStyle} className="rounded-lg border p-4 space-y-3">
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="cursor-grab text-muted-foreground"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <Input
          placeholder="컬럼 제목 (예: 시술 메뉴)"
          className="max-w-xs"
          {...form.register(`columns.${colIndex}.title`)}
        />
        <div className="flex-1" />
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

      <div className="ml-7">
        <DndContext sensors={itemSensors} collisionDetection={closestCenter} onDragEnd={handleItemDragEnd}>
          <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {fields.map((item, itemIndex) => (
                <SortableFooterLinkItem
                  key={item.id}
                  id={item.id}
                  colIndex={colIndex}
                  itemIndex={itemIndex}
                  form={form}
                  onRemove={() => remove(itemIndex)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => append({ label: '', href: '' })}
          className="mt-2"
        >
          <Plus className="mr-1 h-4 w-4" />
          항목 추가
        </Button>
      </div>
    </div>
  )
}

function SortableFooterLinkItem({
  id,
  colIndex,
  itemIndex,
  form,
  onRemove,
}: {
  id: string
  colIndex: number
  itemIndex: number
  form: ReturnType<typeof useForm<FooterFormValues>>
  onRemove: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2">
      <button
        type="button"
        className="cursor-grab text-muted-foreground shrink-0"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <Input
        placeholder="항목명"
        {...form.register(`columns.${colIndex}.items.${itemIndex}.label`)}
      />
      <Input
        placeholder="URL"
        {...form.register(`columns.${colIndex}.items.${itemIndex}.href`)}
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onRemove}
        className="text-destructive hover:text-destructive shrink-0"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}
