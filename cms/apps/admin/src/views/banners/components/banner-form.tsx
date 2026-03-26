'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button, Input, Label, Switch, Card, CardContent, CardHeader, CardTitle } from '@letmein/ui'
import { Link2, Image as ImageIcon, TestTube2 } from 'lucide-react'
import {
  BANNER_POSITION_VALUES,
  BANNER_POSITION_LABELS,
  BANNER_TYPE_VALUES,
  BANNER_TYPE_LABELS,
  TARGET_AUDIENCE_VALUES,
  TARGET_AUDIENCE_LABELS,
  DISMISS_OPTION_VALUES,
  DISMISS_OPTION_LABELS,
  GRADE_LABELS,
} from '@letmein/types'
import type { BannerItem, BannerPosition, BannerType, TargetAudience, DismissOption } from '@letmein/types'
import { useBannerGroups } from '@/features/banner-editor'
import { useMemo } from 'react'

const bannerSchema = z.object({
  name: z.string().min(1, '배너 이름을 입력하세요'),
  position: z.enum(BANNER_POSITION_VALUES),
  type: z.enum(BANNER_TYPE_VALUES),
  groupId: z.string().optional(),
  pcImageId: z.string().optional(),
  mobileImageId: z.string().optional(),
  tabletImageId: z.string().optional(),
  altText: z.string().optional(),
  textContent: z.string().optional(),
  bgColor: z.string().optional(),
  textColor: z.string().optional(),
  linkUrl: z.string().optional(),
  openNewTab: z.boolean(),
  utmCampaign: z.string().optional(),
  targetAudience: z.enum(TARGET_AUDIENCE_VALUES),
  minGrade: z.number().min(0).max(9),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
  sortOrder: z.number(),
  isActive: z.boolean(),
  dismissOptions: z.array(z.enum(DISMISS_OPTION_VALUES)),
  abGroup: z.string().optional(),
  abRatio: z.number().min(0).max(100),
})

export type BannerFormValues = z.infer<typeof bannerSchema>

interface BannerFormProps {
  banner?: BannerItem | null
  onSubmit: (values: BannerFormValues) => void
  isPending: boolean
}

function toDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return ''
  try {
    return new Date(iso).toISOString().slice(0, 16)
  } catch {
    return ''
  }
}

export function BannerForm({ banner, onSubmit, isPending }: BannerFormProps) {
  const isEdit = !!banner
  const { data: groupsData } = useBannerGroups()

  const form = useForm<BannerFormValues>({
    resolver: zodResolver(bannerSchema),
    defaultValues: {
      name: banner?.name ?? '',
      position: (banner?.position as BannerPosition) ?? 'main_top',
      type: (banner?.type as BannerType) ?? 'image',
      groupId: banner?.groupId ?? '',
      pcImageId: banner?.pcImageId ?? '',
      mobileImageId: banner?.mobileImageId ?? '',
      tabletImageId: banner?.tabletImageId ?? '',
      altText: banner?.altText ?? '',
      textContent: banner?.textContent ?? '',
      bgColor: banner?.bgColor ?? '#ffffff',
      textColor: banner?.textColor ?? '#000000',
      linkUrl: banner?.linkUrl ?? '',
      openNewTab: banner?.openNewTab ?? false,
      utmCampaign: banner?.utmCampaign ?? '',
      targetAudience: (banner?.targetAudience as TargetAudience) ?? 'all',
      minGrade: banner?.minGrade ?? 0,
      startsAt: toDatetimeLocal(banner?.startsAt),
      endsAt: toDatetimeLocal(banner?.endsAt),
      sortOrder: banner?.sortOrder ?? 0,
      isActive: banner?.isActive ?? true,
      dismissOptions: banner?.dismissOptions ?? ['today'],
      abGroup: banner?.abGroup ?? '',
      abRatio: banner?.abRatio ?? 50,
    },
  })

  const watchType = form.watch('type')
  const watchLinkUrl = form.watch('linkUrl')
  const watchUtmCampaign = form.watch('utmCampaign')
  const watchAbGroup = form.watch('abGroup')
  const watchTargetAudience = form.watch('targetAudience')

  const utmPreview = useMemo(() => {
    if (!watchLinkUrl || !watchUtmCampaign) return ''
    const sep = watchLinkUrl.includes('?') ? '&' : '?'
    return `${watchLinkUrl}${sep}utm_source=admin&utm_medium=banner&utm_campaign=${watchUtmCampaign}`
  }, [watchLinkUrl, watchUtmCampaign])

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* 기본 정보 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">기본 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">배너 이름 *</Label>
              <Input id="name" {...form.register('name')} placeholder="배너 이름" />
              {form.formState.errors.name && (
                <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>위치 *</Label>
              <div className="flex flex-wrap gap-1.5">
                {BANNER_POSITION_VALUES.map((pos) => (
                  <button
                    key={pos}
                    type="button"
                    onClick={() => form.setValue('position', pos)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                      form.watch('position') === pos
                        ? 'bg-foreground text-background'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                    }`}
                  >
                    {BANNER_POSITION_LABELS[pos]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>배너 타입</Label>
              <div className="flex flex-wrap gap-1.5">
                {BANNER_TYPE_VALUES.map((t) => (
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
                    {BANNER_TYPE_LABELS[t]}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>배너 그룹</Label>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => form.setValue('groupId', '')}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    !form.watch('groupId')
                      ? 'bg-foreground text-background'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                  }`}
                >
                  그룹 없음
                </button>
                {groupsData?.groups.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => form.setValue('groupId', g.id)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                      form.watch('groupId') === g.id
                        ? 'bg-foreground text-background'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                    }`}
                  >
                    {g.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sortOrder">정렬 순서</Label>
              <Input
                id="sortOrder"
                type="number"
                {...form.register('sortOrder', { valueAsNumber: true })}
              />
            </div>
            <div className="flex items-end gap-4 pb-1">
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
        </CardContent>
      </Card>

      {/* 이미지 / 콘텐츠 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ImageIcon className="h-4 w-4" />
            콘텐츠
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {watchType === 'image' && (
            <>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pcImageId">PC 이미지 ID</Label>
                  <Input id="pcImageId" {...form.register('pcImageId')} placeholder="미디어 ID" />
                  {banner?.pcImage && (
                    <p className="text-xs text-muted-foreground">{banner.pcImage.originalName}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mobileImageId">모바일 이미지 ID</Label>
                  <Input id="mobileImageId" {...form.register('mobileImageId')} placeholder="미디어 ID" />
                  {banner?.mobileImage && (
                    <p className="text-xs text-muted-foreground">{banner.mobileImage.originalName}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tabletImageId">태블릿 이미지 ID</Label>
                  <Input id="tabletImageId" {...form.register('tabletImageId')} placeholder="미디어 ID" />
                  {banner?.tabletImage && (
                    <p className="text-xs text-muted-foreground">{banner.tabletImage.originalName}</p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="altText">대체 텍스트 (alt)</Label>
                <Input id="altText" {...form.register('altText')} placeholder="이미지 설명" />
              </div>
            </>
          )}

          {watchType === 'html' && (
            <div className="space-y-2">
              <Label htmlFor="textContent">HTML 콘텐츠</Label>
              <textarea
                id="textContent"
                className="flex min-h-[160px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                {...form.register('textContent')}
                placeholder="<div>배너 HTML</div>"
              />
            </div>
          )}

          {watchType === 'text' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="textContent">텍스트 내용</Label>
                <Input id="textContent" {...form.register('textContent')} placeholder="배너 텍스트" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bgColor">배경색</Label>
                  <div className="flex gap-2">
                    <Input type="color" className="h-10 w-14 p-1" {...form.register('bgColor')} />
                    <Input {...form.register('bgColor')} className="flex-1" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="textColor">텍스트색</Label>
                  <div className="flex gap-2">
                    <Input type="color" className="h-10 w-14 p-1" {...form.register('textColor')} />
                    <Input {...form.register('textColor')} className="flex-1" />
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* 링크 & UTM */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Link2 className="h-4 w-4" />
            링크 & UTM
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="linkUrl">링크 URL</Label>
              <Input id="linkUrl" {...form.register('linkUrl')} placeholder="https://..." />
            </div>
            <div className="flex items-end gap-4 pb-1">
              <div className="flex items-center gap-2">
                <Label htmlFor="openNewTab">새 탭</Label>
                <Switch
                  id="openNewTab"
                  checked={form.watch('openNewTab')}
                  onCheckedChange={(checked) => form.setValue('openNewTab', checked)}
                />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="utmCampaign">UTM Campaign</Label>
            <Input id="utmCampaign" {...form.register('utmCampaign')} placeholder="spring_sale_2026" />
          </div>
          {utmPreview && (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">UTM 미리보기</Label>
              <div className="rounded-md bg-muted p-2 text-xs break-all">{utmPreview}</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 기간 & 대상 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">기간 & 대상</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
                        form.setValue(
                          'dismissOptions',
                          current.filter((o: string) => o !== opt),
                        )
                      }
                    }}
                    className="rounded"
                  />
                  {DISMISS_OPTION_LABELS[opt]}
                </label>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* A/B 테스트 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TestTube2 className="h-4 w-4" />
            A/B 테스트
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
              <Label htmlFor="abRatio">
                A/B 비율: {form.watch('abRatio')}% / {100 - form.watch('abRatio')}%
              </Label>
              <input
                id="abRatio"
                type="range"
                min={0}
                max={100}
                step={5}
                className="w-full"
                {...form.register('abRatio', { valueAsNumber: true })}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>A 그룹 0%</span>
                <span>50%</span>
                <span>B 그룹 100%</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 제출 */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => window.history.back()}>
          취소
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? '저장 중...' : isEdit ? '수정' : '생성'}
        </Button>
      </div>
    </form>
  )
}
