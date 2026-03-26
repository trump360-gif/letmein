'use client'

import { type UseFormReturn } from 'react-hook-form'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Switch,
} from '@letmein/ui'
import { Image as ImageIcon, Link2, TestTube2 } from 'lucide-react'
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
import type { TargetAudience } from '@letmein/types'
import type { BannerFormValues } from './banner-wizard-types'

// ==================== Shared Pill Select ====================

function PillSelect<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => (
        <button
          key={String(opt.value)}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
            value === opt.value
              ? 'bg-foreground text-background'
              : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

// ==================== Step 1: Basic Info ====================

interface StepBasicInfoProps {
  form: UseFormReturn<BannerFormValues>
  groups: { id: string; name: string }[]
}

export function StepBasicInfo({ form, groups }: StepBasicInfoProps) {
  const watchPosition = form.watch('position')
  const watchType = form.watch('type')
  const watchGroupId = form.watch('groupId')
  const watchIsActive = form.watch('isActive')

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">기본 정보</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">배너 이름 *</Label>
          <Input id="name" {...form.register('name')} placeholder="배너 이름" />
          {form.formState.errors.name && (
            <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>위치 *</Label>
          <PillSelect
            options={BANNER_POSITION_VALUES.map((pos) => ({ value: pos, label: BANNER_POSITION_LABELS[pos] }))}
            value={watchPosition}
            onChange={(v) => form.setValue('position', v)}
          />
        </div>

        <div className="space-y-2">
          <Label>배너 타입</Label>
          <PillSelect
            options={BANNER_TYPE_VALUES.map((t) => ({ value: t, label: BANNER_TYPE_LABELS[t] }))}
            value={watchType}
            onChange={(v) => form.setValue('type', v)}
          />
        </div>

        <div className="space-y-2">
          <Label>배너 그룹</Label>
          <PillSelect
            options={[
              { value: '', label: '그룹 없음' },
              ...groups.map((g) => ({ value: g.id, label: g.name })),
            ]}
            value={watchGroupId || ''}
            onChange={(v) => form.setValue('groupId', v)}
          />
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
                checked={watchIsActive}
                onCheckedChange={(checked) => form.setValue('isActive', checked)}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ==================== Step 2: Content ====================

export function StepContent({ form }: { form: UseFormReturn<BannerFormValues> }) {
  const watchType = form.watch('type')

  return (
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
              </div>
              <div className="space-y-2">
                <Label htmlFor="mobileImageId">모바일 이미지 ID</Label>
                <Input id="mobileImageId" {...form.register('mobileImageId')} placeholder="미디어 ID" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tabletImageId">태블릿 이미지 ID</Label>
                <Input id="tabletImageId" {...form.register('tabletImageId')} placeholder="미디어 ID" />
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
  )
}

// ==================== Step 3: Link & UTM ====================

export function StepLinkUtm({ form, utmPreview }: { form: UseFormReturn<BannerFormValues>; utmPreview: string }) {
  const watchOpenNewTab = form.watch('openNewTab')

  return (
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
                checked={watchOpenNewTab}
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
  )
}

// ==================== Step 4: Schedule & Target ====================

export function StepScheduleTarget({ form }: { form: UseFormReturn<BannerFormValues> }) {
  const watchTargetAudience = form.watch('targetAudience')
  const watchMinGrade = form.watch('minGrade')
  const watchDismissOptions = form.watch('dismissOptions')

  return (
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

        <div className="space-y-2">
          <Label>노출 대상</Label>
          <PillSelect
            options={TARGET_AUDIENCE_VALUES.map((ta) => ({ value: ta, label: TARGET_AUDIENCE_LABELS[ta] }))}
            value={watchTargetAudience}
            onChange={(v) => form.setValue('targetAudience', v as TargetAudience)}
          />
        </div>

        {watchTargetAudience === 'grade' && (
          <div className="space-y-2">
            <Label>최소 등급</Label>
            <PillSelect
              options={Object.entries(GRADE_LABELS).map(([g, label]) => ({
                value: Number(g),
                label: `${label} (${g})`,
              }))}
              value={watchMinGrade}
              onChange={(v) => form.setValue('minGrade', v)}
            />
          </div>
        )}

        <div className="space-y-2">
          <Label>닫기 옵션</Label>
          <div className="flex flex-wrap gap-3">
            {DISMISS_OPTION_VALUES.map((opt) => (
              <label key={opt} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  value={opt}
                  checked={watchDismissOptions.includes(opt)}
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
                {DISMISS_OPTION_LABELS[opt]}
              </label>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ==================== Step 5: A/B Test ====================

export function StepAbTest({ form }: { form: UseFormReturn<BannerFormValues> }) {
  const watchAbGroup = form.watch('abGroup')
  const watchAbRatio = form.watch('abRatio')

  return (
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
          <PillSelect
            options={[
              { value: '', label: '사용 안함' },
              { value: 'A', label: 'A 그룹' },
              { value: 'B', label: 'B 그룹' },
            ]}
            value={watchAbGroup || ''}
            onChange={(v) => form.setValue('abGroup', v)}
          />
        </div>

        {watchAbGroup && (
          <div className="space-y-2">
            <Label htmlFor="abRatio">
              A/B 비율: {watchAbRatio}% / {100 - watchAbRatio}%
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
  )
}
