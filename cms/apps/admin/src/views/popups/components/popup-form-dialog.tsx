'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Input,
  Label,
  Switch,
  Textarea,
} from '@letmein/ui'
import {
  POPUP_TYPE_VALUES,
  POPUP_TYPE_LABELS,
  POPUP_DISPLAY_SCOPE_VALUES,
  POPUP_DISPLAY_SCOPE_LABELS,
  POPUP_ANIMATION_VALUES,
  POPUP_ANIMATION_LABELS,
  TARGET_AUDIENCE_VALUES,
  TARGET_AUDIENCE_LABELS,
  DISMISS_OPTION_VALUES,
  DISMISS_OPTION_LABELS,
  GRADE_LABELS,
} from '@letmein/types'
import type { PopupItem, PopupType, PopupDisplayScope, PopupAnimation, TargetAudience, DismissOption } from '@letmein/types'
import { useCreatePopup, useUpdatePopup } from '@/features/popup-manage'

const popupSchema = z.object({
  name: z.string().min(1, '팝업 이름을 입력하세요'),
  type: z.enum(POPUP_TYPE_VALUES),
  imageId: z.string().optional(),
  htmlContent: z.string().optional(),
  displayScope: z.enum(POPUP_DISPLAY_SCOPE_VALUES),
  boardId: z.string().optional(),
  widthPx: z.number().min(100).max(2000),
  heightPx: z.number().min(100).max(2000),
  posX: z.number().min(0).max(100),
  posY: z.number().min(0).max(100),
  dismissOptions: z.array(z.string()),
  targetAudience: z.enum(TARGET_AUDIENCE_VALUES),
  minGrade: z.number().min(0).max(9),
  targetNewDays: z.number().nullable().optional(),
  targetRegion: z.string().optional(),
  animation: z.enum(POPUP_ANIMATION_VALUES),
  abGroup: z.string().optional(),
  abRatio: z.number().min(0).max(100),
  priority: z.number(),
  maxDisplay: z.number().min(1),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
  isActive: z.boolean(),
})

type PopupFormValues = z.infer<typeof popupSchema>

interface PopupFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  popup?: PopupItem | null
}

function toDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return ''
  try {
    return new Date(iso).toISOString().slice(0, 16)
  } catch {
    return ''
  }
}

export function PopupFormDialog({ open, onOpenChange, popup }: PopupFormDialogProps) {
  const isEdit = !!popup
  const createPopup = useCreatePopup()
  const updatePopup = useUpdatePopup()

  const form = useForm<PopupFormValues>({
    resolver: zodResolver(popupSchema),
    defaultValues: {
      name: popup?.name ?? '',
      type: (popup?.type as PopupType) ?? 'image',
      imageId: popup?.imageId ?? '',
      htmlContent: popup?.htmlContent ?? '',
      displayScope: (popup?.displayScope as PopupDisplayScope) ?? 'all',
      boardId: popup?.boardId ?? '',
      widthPx: popup?.widthPx ?? 500,
      heightPx: popup?.heightPx ?? 400,
      posX: popup?.posX ?? 50,
      posY: popup?.posY ?? 50,
      dismissOptions: popup?.dismissOptions ?? ['today'],
      targetAudience: (popup?.targetAudience as TargetAudience) ?? 'all',
      minGrade: popup?.minGrade ?? 0,
      targetNewDays: popup?.targetNewDays ?? null,
      targetRegion: popup?.targetRegion ?? '',
      animation: (popup?.animation as PopupAnimation) ?? 'fade',
      abGroup: popup?.abGroup ?? '',
      abRatio: popup?.abRatio ?? 50,
      priority: popup?.priority ?? 0,
      maxDisplay: popup?.maxDisplay ?? 1,
      startsAt: toDatetimeLocal(popup?.startsAt),
      endsAt: toDatetimeLocal(popup?.endsAt),
      isActive: popup?.isActive ?? true,
    },
  })

  const watchType = form.watch('type')
  const watchDisplayScope = form.watch('displayScope')
  const watchTargetAudience = form.watch('targetAudience')
  const watchAbGroup = form.watch('abGroup')

  async function onSubmit(values: PopupFormValues) {
    try {
      const payload = {
        ...values,
        imageId: values.imageId || null,
        htmlContent: values.htmlContent || null,
        boardId: values.boardId || null,
        targetRegion: values.targetRegion || null,
        abGroup: values.abGroup || null,
        startsAt: values.startsAt || null,
        endsAt: values.endsAt || null,
      }

      if (isEdit && popup) {
        await updatePopup.mutateAsync({ id: popup.id, payload })
      } else {
        await createPopup.mutateAsync(payload)
      }
      onOpenChange(false)
      form.reset()
    } catch {
      // error handled by mutation
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? '팝업 수정' : '팝업 추가'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* 기본 정보 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">팝업 이름 *</Label>
              <Input id="name" {...form.register('name')} placeholder="팝업 이름" />
              {form.formState.errors.name && (
                <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>타입</Label>
              <div className="flex flex-wrap gap-1.5">
                {POPUP_TYPE_VALUES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => form.setValue('type', t)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                      form.watch('type') === t
                        ? 'bg-foreground text-background'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                    }`}
                  >
                    {POPUP_TYPE_LABELS[t]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 콘텐츠 */}
          {watchType === 'image' && (
            <div className="space-y-2">
              <Label htmlFor="imageId">이미지 ID</Label>
              <Input id="imageId" {...form.register('imageId')} placeholder="미디어 ID" />
              {popup?.image && (
                <p className="text-xs text-muted-foreground">{popup.image.originalName}</p>
              )}
            </div>
          )}
          {watchType === 'html' && (
            <div className="space-y-2">
              <Label htmlFor="htmlContent">HTML 콘텐츠</Label>
              <Textarea
                id="htmlContent"
                {...form.register('htmlContent')}
                placeholder="<div>팝업 HTML</div>"
                className="min-h-[120px]"
              />
            </div>
          )}

          {/* 표시 범위 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>표시 범위</Label>
              <div className="flex flex-wrap gap-1.5">
                {POPUP_DISPLAY_SCOPE_VALUES.map((ds) => (
                  <button
                    key={ds}
                    type="button"
                    onClick={() => form.setValue('displayScope', ds)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                      form.watch('displayScope') === ds
                        ? 'bg-foreground text-background'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                    }`}
                  >
                    {POPUP_DISPLAY_SCOPE_LABELS[ds]}
                  </button>
                ))}
              </div>
            </div>
            {watchDisplayScope === 'board' && (
              <div className="space-y-2">
                <Label htmlFor="boardId">게시판 ID</Label>
                <Input id="boardId" {...form.register('boardId')} placeholder="게시판 ID" />
              </div>
            )}
          </div>

          {/* 크기 & 위치 */}
          <div className="grid grid-cols-4 gap-3">
            <div className="space-y-2">
              <Label htmlFor="widthPx">너비 (px)</Label>
              <Input
                id="widthPx"
                type="number"
                {...form.register('widthPx', { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="heightPx">높이 (px)</Label>
              <Input
                id="heightPx"
                type="number"
                {...form.register('heightPx', { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="posX">X 위치 (%)</Label>
              <Input
                id="posX"
                type="number"
                {...form.register('posX', { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="posY">Y 위치 (%)</Label>
              <Input
                id="posY"
                type="number"
                {...form.register('posY', { valueAsNumber: true })}
              />
            </div>
          </div>

          {/* 위치 미리보기 */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">위치 미리보기</Label>
            <div className="relative h-32 rounded-md border bg-muted">
              <div
                className="absolute rounded border-2 border-primary bg-primary/10"
                style={{
                  left: `${form.watch('posX')}%`,
                  top: `${form.watch('posY')}%`,
                  transform: 'translate(-50%, -50%)',
                  width: `${Math.min(form.watch('widthPx') / 10, 80)}%`,
                  height: `${Math.min(form.watch('heightPx') / 10, 80)}%`,
                }}
              >
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                  {form.watch('widthPx')} x {form.watch('heightPx')}
                </div>
              </div>
            </div>
          </div>

          {/* 애니메이션 */}
          <div className="space-y-2">
            <Label>애니메이션</Label>
            <div className="flex flex-wrap gap-1.5">
              {POPUP_ANIMATION_VALUES.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => form.setValue('animation', a)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    form.watch('animation') === a
                      ? 'bg-foreground text-background'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                  }`}
                >
                  {POPUP_ANIMATION_LABELS[a]}
                </button>
              ))}
            </div>
          </div>

          {/* 기간 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startsAt">시작 일시</Label>
              <Input id="startsAt" type="datetime-local" {...form.register('startsAt')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endsAt">종료 일시</Label>
              <Input id="endsAt" type="datetime-local" {...form.register('endsAt')} />
            </div>
          </div>

          {/* 대상 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>노출 대상</Label>
              <div className="flex flex-wrap gap-1.5">
                {TARGET_AUDIENCE_VALUES.map((ta) => (
                  <button
                    key={ta}
                    type="button"
                    onClick={() => form.setValue('targetAudience', ta)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                      form.watch('targetAudience') === ta
                        ? 'bg-foreground text-background'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                    }`}
                  >
                    {TARGET_AUDIENCE_LABELS[ta]}
                  </button>
                ))}
              </div>
            </div>
            {watchTargetAudience === 'grade' && (
              <div className="space-y-2">
                <Label>최소 등급</Label>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(GRADE_LABELS).map(([g, label]) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => form.setValue('minGrade', Number(g))}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                        form.watch('minGrade') === Number(g)
                          ? 'bg-foreground text-background'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                      }`}
                    >
                      {label} ({g})
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {watchTargetAudience === 'new_user' && (
            <div className="space-y-2">
              <Label htmlFor="targetNewDays">신규 회원 기준 (일)</Label>
              <Input
                id="targetNewDays"
                type="number"
                {...form.register('targetNewDays', { valueAsNumber: true })}
                placeholder="예: 7"
              />
            </div>
          )}

          {/* 닫기 옵션 */}
          <div className="space-y-2">
            <Label>닫기 옵션</Label>
            <div className="flex flex-wrap gap-3">
              {DISMISS_OPTION_VALUES.map((opt) => (
                <label key={opt} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    value={opt}
                    checked={form.watch('dismissOptions').includes(opt)}
                    onChange={(e) => {
                      const current = form.getValues('dismissOptions')
                      if (e.target.checked) {
                        form.setValue('dismissOptions', [...current, opt])
                      } else {
                        form.setValue('dismissOptions', current.filter((o: string) => o !== opt))
                      }
                    }}
                    className="rounded"
                  />
                  {DISMISS_OPTION_LABELS[opt as DismissOption]}
                </label>
              ))}
            </div>
          </div>

          {/* A/B 테스트 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>A/B 그룹</Label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { value: '', label: '사용 안함' },
                  { value: 'A', label: 'A 그룹' },
                  { value: 'B', label: 'B 그룹' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => form.setValue('abGroup', opt.value)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                      form.watch('abGroup') === opt.value
                        ? 'bg-foreground text-background'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            {watchAbGroup && (
              <div className="space-y-2">
                <Label>A/B 비율: {form.watch('abRatio')}% / {100 - form.watch('abRatio')}%</Label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  className="mt-3 w-full"
                  {...form.register('abRatio', { valueAsNumber: true })}
                />
              </div>
            )}
          </div>

          {/* 기타 설정 */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">우선순위</Label>
              <Input
                id="priority"
                type="number"
                {...form.register('priority', { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxDisplay">최대 표시 횟수</Label>
              <Input
                id="maxDisplay"
                type="number"
                {...form.register('maxDisplay', { valueAsNumber: true })}
              />
            </div>
            <div className="flex items-end pb-1">
              <div className="flex items-center gap-2">
                <Label htmlFor="isActive">활성화</Label>
                <Switch
                  id="isActive"
                  checked={form.watch('isActive')}
                  onCheckedChange={(checked) => form.setValue('isActive', checked)}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              취소
            </Button>
            <Button type="submit" disabled={createPopup.isPending || updatePopup.isPending}>
              {createPopup.isPending || updatePopup.isPending
                ? '저장 중...'
                : isEdit
                  ? '팝업 수정'
                  : '팝업 추가'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
