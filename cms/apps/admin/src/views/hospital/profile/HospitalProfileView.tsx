'use client'

import { useState, useCallback } from 'react'
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
  arrayMove,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card, CardContent, CardHeader, CardTitle, Input, Label, Textarea, Button } from '@letmein/ui'
import { GripVertical, X, Plus, Loader2, Save } from 'lucide-react'
import {
  useProfileQuery,
  useUpdateProfileMutation,
  useImagesQuery,
  useUpdateImagesMutation,
  useSpecialtiesQuery,
  useAddSpecialtyMutation,
  useRemoveSpecialtyMutation,
} from '@/features/hospital-portal/profile'

// ─────────────────────────────────────────────
// 이미지 드래그 아이템
// ─────────────────────────────────────────────
function SortableImageItem({
  id,
  url,
  onRemove,
}: {
  id: string
  url: string
  onRemove: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group rounded-lg border border-border overflow-hidden w-28 h-28 flex-shrink-0"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="gallery" className="w-full h-full object-cover" />
      <button
        type="button"
        className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={onRemove}
        aria-label="이미지 삭제"
      >
        <X className="w-3 h-3" />
      </button>
      <button
        type="button"
        className="absolute bottom-1 left-1 bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center cursor-grab"
        {...attributes}
        {...listeners}
        aria-label="드래그 핸들"
      >
        <GripVertical className="w-3 h-3" />
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────
// 기본정보 섹션 (HPROF-01)
// ─────────────────────────────────────────────
function BasicInfoSection() {
  const { data: profile, isLoading } = useProfileQuery()
  const mutation = useUpdateProfileMutation()
  const [form, setForm] = useState<{
    address: string
    phone: string
    operatingHours: string
  } | null>(null)

  const current = form ?? {
    address: profile?.address ?? '',
    phone: profile?.phone ?? '',
    operatingHours: profile?.operatingHours ?? '',
  }

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({
      ...((prev ?? current) as { address: string; phone: string; operatingHours: string }),
      [field]: value,
    }))
  }

  const handleSave = () => {
    mutation.mutate(
      { address: current.address, phone: current.phone, operatingHours: current.operatingHours },
      { onSuccess: () => setForm(null) },
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>기본 정보</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <Label htmlFor="name">병원명</Label>
          <Input
            id="name"
            value={profile?.name ?? ''}
            disabled
            className="bg-muted cursor-not-allowed"
          />
          <p className="text-xs text-muted-foreground">병원명은 변경할 수 없습니다.</p>
        </div>
        <div className="space-y-1">
          <Label htmlFor="address">주소</Label>
          <Input
            id="address"
            value={current.address}
            onChange={(e) => handleChange('address', e.target.value)}
            placeholder="병원 주소를 입력하세요"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="phone">전화번호</Label>
          <Input
            id="phone"
            value={current.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            placeholder="02-0000-0000"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="operatingHours">영업시간</Label>
          <Input
            id="operatingHours"
            value={current.operatingHours}
            onChange={(e) => handleChange('operatingHours', e.target.value)}
            placeholder="예: 평일 09:00-18:00, 토 09:00-13:00"
          />
        </div>
        <div className="flex justify-end pt-2">
          <Button onClick={handleSave} disabled={mutation.isPending}>
            {mutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            저장
          </Button>
        </div>
        {mutation.isError && (
          <p className="text-sm text-destructive">
            {(mutation.error as Error)?.message ?? '저장에 실패했습니다.'}
          </p>
        )}
        {mutation.isSuccess && (
          <p className="text-sm text-green-600">저장되었습니다.</p>
        )}
      </CardContent>
    </Card>
  )
}

// ─────────────────────────────────────────────
// 이미지 관리 섹션 (HPROF-02)
// ─────────────────────────────────────────────
function ImagesSection() {
  const { data: profileData, isLoading: profileLoading } = useProfileQuery()
  const { data: imagesData, isLoading: imagesLoading } = useImagesQuery()
  const mutation = useUpdateImagesMutation()

  // 대표 이미지(profileImage)를 첫 번째로, 갤러리 이미지를 이어 붙인 통합 배열
  const [allImages, setAllImages] = useState<string[] | null>(null)
  const [newImageUrl, setNewImageUrl] = useState('')

  const profileImage = profileData?.profileImage ?? ''
  const galleryImages: string[] = (() => {
    try {
      return JSON.parse(imagesData?.images ? JSON.stringify(imagesData.images) : '[]')
    } catch {
      return imagesData?.images ?? []
    }
  })()

  // 통합 배열: [대표이미지?, ...갤러리]
  const combined = allImages ?? [
    ...(profileImage ? [profileImage] : []),
    ...galleryImages,
  ]

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (over && active.id !== over.id) {
        const oldIndex = combined.findIndex((_, i) => String(i) === active.id)
        const newIndex = combined.findIndex((_, i) => String(i) === over.id)
        if (oldIndex !== -1 && newIndex !== -1) {
          setAllImages(arrayMove(combined, oldIndex, newIndex))
        }
      }
    },
    [combined],
  )

  const handleRemove = (index: number) => {
    const next = combined.filter((_, i) => i !== index)
    setAllImages(next)
  }

  const handleAdd = () => {
    const trimmed = newImageUrl.trim()
    if (!trimmed) return
    if (combined.length >= 10) return
    setAllImages([...combined, trimmed])
    setNewImageUrl('')
  }

  const handleSave = () => {
    // 첫 번째 이미지가 대표 이미지로 간주되지만 gallery는 별도 저장
    // combined 배열 전체를 images API로 저장 (대표 + 갤러리 통합)
    mutation.mutate(combined, { onSuccess: () => setAllImages(null) })
  }

  const isLoading = profileLoading || imagesLoading

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>이미지 관리</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          최대 10장까지 등록할 수 있습니다. 드래그하여 순서를 변경하세요.
        </p>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={combined.map((_, i) => String(i))}
            strategy={horizontalListSortingStrategy}
          >
            <div className="flex flex-wrap gap-3">
              {combined.map((url, i) => (
                <SortableImageItem
                  key={`${url}-${i}`}
                  id={String(i)}
                  url={url}
                  onRemove={() => handleRemove(i)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
        {combined.length < 10 && (
          <div className="flex gap-2">
            <Input
              value={newImageUrl}
              onChange={(e) => setNewImageUrl(e.target.value)}
              placeholder="이미지 URL 입력"
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            <Button type="button" variant="outline" onClick={handleAdd} disabled={!newImageUrl.trim()}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        )}
        {combined.length >= 10 && (
          <p className="text-sm text-amber-600">이미지 최대 10장에 도달했습니다.</p>
        )}
        <div className="flex justify-end pt-2">
          <Button onClick={handleSave} disabled={mutation.isPending}>
            {mutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            순서 저장
          </Button>
        </div>
        {mutation.isError && (
          <p className="text-sm text-destructive">
            {(mutation.error as Error)?.message ?? '이미지 저장에 실패했습니다.'}
          </p>
        )}
        {mutation.isSuccess && (
          <p className="text-sm text-green-600">저장되었습니다.</p>
        )}
      </CardContent>
    </Card>
  )
}

// ─────────────────────────────────────────────
// 전문분야 섹션 (HPROF-03)
// ─────────────────────────────────────────────
function SpecialtiesSection() {
  const { data, isLoading } = useSpecialtiesQuery()
  const addMutation = useAddSpecialtyMutation()
  const removeMutation = useRemoveSpecialtyMutation()

  const selectedIds = new Set((data?.specialties ?? []).map((s) => s.categoryId))

  const handleToggle = (categoryId: number) => {
    if (selectedIds.has(categoryId)) {
      removeMutation.mutate(categoryId)
    } else {
      addMutation.mutate(categoryId)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>전문분야</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          전문분야를 클릭하여 추가하거나 제거할 수 있습니다.
        </p>
        <div className="flex flex-wrap gap-2">
          {(data?.allCategories ?? []).map((cat) => {
            const isSelected = selectedIds.has(cat.id)
            const isPending = addMutation.isPending || removeMutation.isPending
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => !isPending && handleToggle(cat.id)}
                disabled={isPending}
                className={[
                  'px-3 py-1.5 rounded-full text-sm font-medium border transition-colors',
                  isSelected
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-foreground border-border hover:border-primary hover:text-primary',
                  isPending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
                ].join(' ')}
              >
                {cat.name}
              </button>
            )
          })}
        </div>
        {(addMutation.isError || removeMutation.isError) && (
          <p className="text-sm text-destructive">
            {((addMutation.error ?? removeMutation.error) as Error)?.message ?? '전문분야 변경에 실패했습니다.'}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

// ─────────────────────────────────────────────
// 소개 섹션 (HPROF-04)
// ─────────────────────────────────────────────
function IntroductionSection() {
  const { data: profile, isLoading } = useProfileQuery()
  const mutation = useUpdateProfileMutation()
  const [text, setText] = useState<string | null>(null)

  const currentText = text ?? (profile?.detailedDescription ?? '')
  const charCount = currentText.length
  const MAX = 2000

  const handleSave = () => {
    mutation.mutate(
      { detailedDescription: currentText },
      { onSuccess: () => setText(null) },
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>병원 소개</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <Label htmlFor="detailedDescription">소개글</Label>
          <Textarea
            id="detailedDescription"
            value={currentText}
            onChange={(e) => setText(e.target.value.slice(0, MAX))}
            placeholder="병원을 소개하는 글을 입력하세요 (최대 2,000자)"
            rows={8}
            maxLength={MAX}
          />
          <p className="text-xs text-muted-foreground text-right">
            {charCount.toLocaleString()} / {MAX.toLocaleString()}
          </p>
        </div>
        <div className="flex justify-end pt-2">
          <Button onClick={handleSave} disabled={mutation.isPending}>
            {mutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            저장
          </Button>
        </div>
        {mutation.isError && (
          <p className="text-sm text-destructive">
            {(mutation.error as Error)?.message ?? '저장에 실패했습니다.'}
          </p>
        )}
        {mutation.isSuccess && (
          <p className="text-sm text-green-600">저장되었습니다.</p>
        )}
      </CardContent>
    </Card>
  )
}

// ─────────────────────────────────────────────
// 메인 뷰
// ─────────────────────────────────────────────
export default function HospitalProfileView() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">병원 프로필 편집</h1>
        <p className="text-sm text-muted-foreground mt-1">병원 정보를 수정하고 저장하세요.</p>
      </div>
      <BasicInfoSection />
      <ImagesSection />
      <SpecialtiesSection />
      <IntroductionSection />
    </div>
  )
}
