'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  Card,
  CardContent,
  Button,
  Input,
  Label,
  Textarea,
} from '@letmein/ui'
import { ArrowLeft, Save, ArrowRight } from 'lucide-react'
import { useUpdateHomepageSection } from '@/features/homepage-manage'
import { InlineIconPicker } from '@/widgets/icon-picker'
import type { HomepageSection, CtaBannerConfig } from '@letmein/types'

interface Props {
  section: HomepageSection
  onBack: () => void
}

export function CtaBannerEditor({ section, onBack }: Props) {
  const config = section.config as unknown as CtaBannerConfig
  const updateSection = useUpdateHomepageSection()
  const [saved, setSaved] = useState(false)

  const form = useForm<CtaBannerConfig>({
    defaultValues: {
      title: config?.title || '지금 가입하고 무료 상담 받아보세요',
      description: config?.description || '회원가입 시 100포인트 즉시 지급!',
      buttonText: config?.buttonText || '무료 가입하기',
      buttonHref: config?.buttonHref || '/signup',
      bgColor: config?.bgColor || '#2563EB',
      textColor: config?.textColor || '#ffffff',
      icon: config?.icon || '🎁',
    },
  })

  function onSubmit(values: CtaBannerConfig) {
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
        <h3 className="text-lg font-semibold">CTA 배너 편집</h3>
      </div>

      {/* 프리뷰 */}
      <Card>
        <CardContent className="p-6">
          <div
            className="flex flex-col items-center gap-3 rounded-xl px-6 py-7 text-center"
            style={{
              backgroundColor: form.watch('bgColor'),
              color: form.watch('textColor'),
            }}
          >
            <p className="text-base font-bold leading-snug">
              {form.watch('title') || 'CTA 제목'}
            </p>
            <p className="text-sm leading-snug opacity-80">
              {form.watch('description') || 'CTA 설명'}
            </p>
            {form.watch('buttonText') && (
              <span
                className="flex items-center gap-2 rounded-lg px-7 py-2.5 text-sm font-semibold"
                style={{
                  backgroundColor: form.watch('textColor'),
                  color: form.watch('bgColor'),
                }}
              >
                {form.watch('buttonText')}
                <ArrowRight className="h-4 w-4" />
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardContent className="space-y-4 p-6">
            <h4 className="font-semibold">CTA 배너 설정</h4>

            <div className="space-y-2">
              <Label>제목</Label>
              <Input placeholder="무료 상담 예약" {...form.register('title')} />
            </div>

            <div className="space-y-2">
              <Label>설명</Label>
              <Textarea rows={2} placeholder="경험 풍부한 전문의가..." {...form.register('description')} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>버튼 텍스트</Label>
                <Input placeholder="예약하기" {...form.register('buttonText')} />
              </div>
              <div className="space-y-2">
                <Label>버튼 링크</Label>
                <Input placeholder="/contact" {...form.register('buttonHref')} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>배경색</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={form.watch('bgColor')}
                    onChange={(e) => form.setValue('bgColor', e.target.value)}
                    className="h-10 w-10 cursor-pointer rounded border"
                  />
                  <Input {...form.register('bgColor')} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>텍스트색</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={form.watch('textColor')}
                    onChange={(e) => form.setValue('textColor', e.target.value)}
                    className="h-10 w-10 cursor-pointer rounded border"
                  />
                  <Input {...form.register('textColor')} />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>아이콘</Label>
              <InlineIconPicker
                value={form.watch('icon')}
                onSelect={(v) => form.setValue('icon', v)}
              />
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
