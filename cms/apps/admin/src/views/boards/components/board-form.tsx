'use client'

import { useEffect, useMemo, useCallback } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Button,
  Input,
  Label,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Textarea,
} from '@letmein/ui'
import { RefreshCw } from 'lucide-react'
import type { Board, BoardType, BoardSkin, BoardGroup } from '@letmein/types'
import {
  BOARD_TYPE_VALUES,
  BOARD_TYPE_LABELS,
  BOARD_TYPE_DESCRIPTIONS,
  BOARD_SKIN_LABELS,
  GRADE_LABELS,
} from '@letmein/types'
import { koreanToSlug } from '@/features/board-manage'
import {
  BOARD_TYPE_ICONS,
  BOARD_TYPE_COLORS,
  BOARD_TYPE_PRESETS,
  BOARD_TYPE_FORM_PRESETS,
  GRADE_FIELDS,
  POST_TOGGLES,
  INTERACTION_TOGGLES,
  FILTER_LEVEL_OPTIONS,
} from './board-form.constants'

// ==================== Schema ====================

const boardFormSchema = z.object({
  nameKey: z.string().min(1, '게시판 이름은 필수입니다.'),
  slug: z.string().min(1, '슬러그는 필수입니다.')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, '영소문자, 숫자, 하이픈만 사용할 수 있습니다.'),
  type: z.string(),
  description: z.string().optional().nullable(),
  groupId: z.string().optional().nullable(),
  parentId: z.string().optional().nullable(),
  isVisible: z.boolean(),
  readGrade: z.number().min(0).max(9),
  writeGrade: z.number().min(0).max(9),
  commentGrade: z.number().min(0).max(9),
  uploadGrade: z.number().min(0).max(9),
  likeGrade: z.number().min(0).max(9),
  allowAnonymous: z.boolean(),
  allowSecret: z.boolean(),
  allowAttachment: z.boolean(),
  minLength: z.number().min(0),
  maxLength: z.number().nullable().optional(),
  allowSchedule: z.boolean(),
  reportThreshold: z.number().min(1),
  autoBlind: z.boolean(),
  filterLevel: z.string(),
  useLike: z.boolean(),
  useDislike: z.boolean(),
  useComment: z.boolean(),
  useReply: z.boolean(),
  useShare: z.boolean(),
  useViewCount: z.boolean(),
  preventCopy: z.boolean(),
  watermark: z.boolean(),
  skin: z.string(),
  perPage: z.number().min(5).max(100),
})

export type BoardFormValues = z.infer<typeof boardFormSchema>

// ==================== Sub Components ====================

function GradeSelect({ value, onChange }: { value: number; onChange: (v: number) => void; id?: string }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {Object.entries(GRADE_LABELS).map(([grade, label]) => (
        <button key={grade} type="button" onClick={() => onChange(Number(grade))}
          className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
            value === Number(grade)
              ? 'bg-foreground text-background'
              : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
          }`}>
          Lv.{grade} {label}
        </button>
      ))}
    </div>
  )
}

function ToggleField({ label, description, checked, onChange }: {
  label: string; description?: string; checked: boolean; onChange: (v: boolean) => void
}) {
  return (
    <label className="flex items-start gap-3 rounded-md border p-3 cursor-pointer hover:bg-accent/50 transition-colors">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-gray-300" />
      <div className="flex-1">
        <div className="text-sm font-medium">{label}</div>
        {description && <div className="text-xs text-muted-foreground">{description}</div>}
      </div>
    </label>
  )
}

function PillSelect({ options, value, onChange }: {
  options: { value: string; label: string }[]; value: string | null | undefined; onChange: (v: string | null) => void
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => (
        <button key={opt.value} type="button" onClick={() => onChange(opt.value || null)}
          className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
            (value ?? '') === opt.value
              ? 'bg-foreground text-background'
              : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
          }`}>
          {opt.label}
        </button>
      ))}
    </div>
  )
}

// ==================== Main Form ====================

interface BoardFormProps {
  board?: Board | null
  groups: BoardGroup[]
  boards: Array<{ id: string; nameKey: string; slug: string }>
  onSubmit: (data: BoardFormValues) => void
  isLoading?: boolean
}

export function BoardForm({ board, groups, boards, onSubmit, isLoading = false }: BoardFormProps) {
  const isEdit = !!board

  const defaultValues: BoardFormValues = useMemo(() => ({
    nameKey: board?.nameKey ?? '', slug: board?.slug ?? '', type: board?.type ?? 'general',
    description: board?.description ?? '', groupId: board?.groupId ?? null, parentId: board?.parentId ?? null,
    isVisible: board?.isVisible ?? true, readGrade: board?.readGrade ?? 0, writeGrade: board?.writeGrade ?? 1,
    commentGrade: board?.commentGrade ?? 1, uploadGrade: board?.uploadGrade ?? 1, likeGrade: board?.likeGrade ?? 1,
    allowAnonymous: board?.allowAnonymous ?? false, allowSecret: board?.allowSecret ?? false,
    allowAttachment: board?.allowAttachment ?? true, minLength: board?.minLength ?? 0,
    maxLength: board?.maxLength ?? null, allowSchedule: board?.allowSchedule ?? false,
    reportThreshold: board?.reportThreshold ?? 5, autoBlind: board?.autoBlind ?? true,
    filterLevel: board?.filterLevel ?? 'normal', useLike: board?.useLike ?? true,
    useDislike: board?.useDislike ?? false, useComment: board?.useComment ?? true,
    useReply: board?.useReply ?? true, useShare: board?.useShare ?? true,
    useViewCount: board?.useViewCount ?? true, preventCopy: board?.preventCopy ?? false,
    watermark: board?.watermark ?? false, skin: board?.skin ?? 'list', perPage: board?.perPage ?? 20,
  }), [board])

  const { register, handleSubmit, control, watch, setValue, formState: { errors }, reset } = useForm<BoardFormValues>({
    resolver: zodResolver(boardFormSchema),
    defaultValues,
  })

  useEffect(() => { reset(defaultValues) }, [defaultValues, reset])

  const nameKeyValue = watch('nameKey')
  const slugValue = watch('slug')
  const watchGroupId = watch('groupId')
  const watchParentId = watch('parentId')
  const watchFilterLevel = watch('filterLevel')
  const watchMaxLength = watch('maxLength')

  const handleGenerateSlug = useCallback(() => {
    if (nameKeyValue) setValue('slug', koreanToSlug(nameKeyValue), { shouldValidate: true })
  }, [nameKeyValue, setValue])

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Tabs defaultValue="basic">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="basic">기본 설정</TabsTrigger>
          <TabsTrigger value="permissions">권한 설정</TabsTrigger>
          <TabsTrigger value="post-settings">게시물 설정</TabsTrigger>
          <TabsTrigger value="interaction">인터랙션</TabsTrigger>
          <TabsTrigger value="skin">스킨 설정</TabsTrigger>
        </TabsList>

        {/* 기본 설정 */}
        <TabsContent value="basic" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nameKey">게시판 이름 *</Label>
              <Input id="nameKey" placeholder="예: 자유게시판" {...register('nameKey')} />
              {errors.nameKey && <p className="text-sm text-destructive">{errors.nameKey.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">슬러그 *</Label>
              <div className="flex gap-2">
                <Input id="slug" placeholder="예: free-board" {...register('slug')} className="flex-1" />
                <Button type="button" variant="outline" size="icon" onClick={handleGenerateSlug} title="한글 이름에서 슬러그 자동 생성">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
              {errors.slug && <p className="text-sm text-destructive">{errors.slug.message}</p>}
              {slugValue && <p className="text-xs text-muted-foreground">URL: /boards/{slugValue}</p>}
            </div>
          </div>

          {/* 게시판 타입 선택 */}
          <div className="space-y-3">
            <Label>게시판 타입 *</Label>
            <Controller name="type" control={control} render={({ field }) => (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                {BOARD_TYPE_VALUES.map((type) => {
                  const Icon = BOARD_TYPE_ICONS[type]
                  const colors = BOARD_TYPE_COLORS[type]
                  const presets = BOARD_TYPE_PRESETS[type]
                  const isSelected = field.value === type
                  return (
                    <button key={type} type="button"
                      onClick={() => {
                        field.onChange(type)
                        if (!isEdit) {
                          const formPreset = BOARD_TYPE_FORM_PRESETS[type]
                          Object.entries(formPreset).forEach(([key, value]) => setValue(key as keyof BoardFormValues, value))
                        }
                      }}
                      className={`group relative flex flex-col items-start gap-2 rounded-xl border-2 p-4 text-left transition-all ${
                        isSelected ? `${colors.border} ${colors.bg} shadow-sm` : 'border-transparent bg-muted/30 hover:bg-muted/60 hover:border-muted-foreground/20'
                      }`}>
                      <div className={`rounded-lg p-2 ${isSelected ? colors.bg : 'bg-muted'}`}>
                        <Icon className={`h-6 w-6 ${isSelected ? colors.icon : 'text-muted-foreground'}`} />
                      </div>
                      <div>
                        <span className={`text-sm font-semibold ${isSelected ? colors.text : 'text-foreground'}`}>{BOARD_TYPE_LABELS[type]}</span>
                        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{BOARD_TYPE_DESCRIPTIONS[type]}</p>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {presets.map((tag) => (
                          <span key={tag} className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${isSelected ? colors.badge : 'bg-muted text-muted-foreground'}`}>{tag}</span>
                        ))}
                      </div>
                    </button>
                  )
                })}
              </div>
            )} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">설명</Label>
            <Textarea id="description" placeholder="게시판에 대한 간단한 설명" rows={3} {...register('description')} />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label>대분류</Label>
              <PillSelect
                options={[{ value: '', label: '미분류' }, ...groups.map((g) => ({ value: g.id, label: g.nameKey }))]}
                value={watchGroupId ?? ''} onChange={(v) => setValue('groupId', v)}
              />
            </div>
            <div className="space-y-2">
              <Label>상위 게시판</Label>
              <PillSelect
                options={[{ value: '', label: '없음 (최상위)' }, ...boards.filter((b) => b.id !== board?.id).map((b) => ({ value: b.id, label: `${b.nameKey} (/${b.slug})` }))]}
                value={watchParentId ?? ''} onChange={(v) => setValue('parentId', v)}
              />
            </div>
          </div>

          <Controller name="isVisible" control={control} render={({ field }) => (
            <ToggleField label="표시 여부" description="비활성화하면 프론트에서 게시판이 숨겨집니다." checked={field.value} onChange={field.onChange} />
          )} />
        </TabsContent>

        {/* 권한 설정 */}
        <TabsContent value="permissions" className="space-y-6">
          <p className="text-sm text-muted-foreground">각 기능별로 최소 등급을 설정합니다. 해당 등급 이상의 회원만 이용할 수 있습니다.</p>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {GRADE_FIELDS.map((g) => (
              <div key={g.name} className="space-y-2">
                <Label htmlFor={g.name}>{g.label}</Label>
                <Controller name={g.name} control={control} render={({ field }) => (
                  <GradeSelect id={g.name} value={field.value} onChange={field.onChange} />
                )} />
                <p className="text-xs text-muted-foreground">{g.desc}</p>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* 게시물 설정 */}
        <TabsContent value="post-settings" className="space-y-6">
          <div className="grid gap-3 md:grid-cols-2">
            {POST_TOGGLES.map((t) => (
              <Controller key={t.name} name={t.name} control={control} render={({ field }) => (
                <ToggleField label={t.label} description={t.desc} checked={field.value as boolean} onChange={field.onChange} />
              )} />
            ))}
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="minLength">최소 글자 수</Label>
              <Input id="minLength" type="number" min={0} {...register('minLength', { valueAsNumber: true })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxLength">최대 글자 수</Label>
              <Input id="maxLength" type="number" min={0} placeholder="제한 없음"
                value={watchMaxLength ?? ''} onChange={(e) => setValue('maxLength', e.target.value ? Number(e.target.value) : null)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reportThreshold">신고 임계치</Label>
              <Input id="reportThreshold" type="number" min={1} {...register('reportThreshold', { valueAsNumber: true })} />
              <p className="text-xs text-muted-foreground">이 횟수 이상 신고되면 자동 블라인드됩니다.</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>필터 수준</Label>
            <PillSelect
              options={FILTER_LEVEL_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
              value={watchFilterLevel} onChange={(v) => setValue('filterLevel', v ?? 'normal')}
            />
          </div>
        </TabsContent>

        {/* 인터랙션 */}
        <TabsContent value="interaction" className="space-y-6">
          <p className="text-sm text-muted-foreground">게시판에서 사용할 인터랙션 기능을 선택합니다.</p>
          <div className="grid gap-3 md:grid-cols-2">
            {INTERACTION_TOGGLES.map((t) => (
              <Controller key={t.name} name={t.name} control={control} render={({ field }) => (
                <ToggleField label={t.label} description={t.desc} checked={field.value as boolean} onChange={field.onChange} />
              )} />
            ))}
          </div>
        </TabsContent>

        {/* 스킨 설정 */}
        <TabsContent value="skin" className="space-y-6">
          <div className="space-y-3">
            <Label>목록 스킨</Label>
            <Controller name="skin" control={control} render={({ field }) => (
              <div className="flex gap-3">
                {(Object.entries(BOARD_SKIN_LABELS) as [BoardSkin, string][]).map(([skinType, label]) => (
                  <button key={skinType} type="button" onClick={() => field.onChange(skinType)}
                    className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors ${
                      field.value === skinType ? 'border-primary bg-primary/5' : 'border-transparent bg-muted/50 hover:bg-accent'
                    }`}>
                    <div className="flex h-12 w-16 items-center justify-center rounded bg-muted">
                      {skinType === 'list' && (
                        <div className="space-y-0.5">
                          {[1,2,3].map(i => <div key={i} className="h-1 w-10 rounded bg-muted-foreground/30" />)}
                        </div>
                      )}
                      {skinType === 'card' && (
                        <div className="grid grid-cols-2 gap-0.5">
                          {[1,2,3,4].map(i => <div key={i} className="h-4 w-4 rounded bg-muted-foreground/30" />)}
                        </div>
                      )}
                      {skinType === 'album' && (
                        <div className="grid grid-cols-3 gap-0.5">
                          {[1,2,3,4,5,6].map(i => <div key={i} className="h-3 w-3 rounded bg-muted-foreground/30" />)}
                        </div>
                      )}
                    </div>
                    <span className="text-xs font-medium">{label}</span>
                  </button>
                ))}
              </div>
            )} />
          </div>
          <div className="space-y-2 md:w-64">
            <Label htmlFor="perPage">페이지당 게시물 수</Label>
            <Input id="perPage" type="number" min={5} max={100} {...register('perPage', { valueAsNumber: true })} />
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex items-center justify-end gap-3 border-t pt-6">
        <Button type="button" variant="outline" onClick={() => window.history.back()}>취소</Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? '저장 중...' : isEdit ? '게시판 수정' : '게시판 생성'}
        </Button>
      </div>
    </form>
  )
}
