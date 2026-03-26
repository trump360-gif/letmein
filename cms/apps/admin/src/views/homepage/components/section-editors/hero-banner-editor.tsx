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
import { ArrowLeft, Save } from 'lucide-react'
import { useUpdateHomepageSection } from '@/features/homepage-manage'
import type { HomepageSection, HeroBannerConfig } from '@letmein/types'

interface Props {
  section: HomepageSection
  onBack: () => void
}

export function HeroBannerEditor({ section, onBack }: Props) {
  const config = section.config as unknown as HeroBannerConfig
  const updateSection = useUpdateHomepageSection()
  const [saved, setSaved] = useState(false)

  const form = useForm<HeroBannerConfig>({
    defaultValues: {
      badge: config?.badge || 'NEW OPEN',
      title: config?.title || '나에게 맞는\n성형 정보를 찾아보세요',
      description: config?.description || '검증된 전문의 상담부터 실제 후기까지\n뷰티톡에서 한번에 확인하세요.',
      buttonText: config?.buttonText || '후기 보러가기',
      buttonHref: config?.buttonHref || '/community/reviews',
      imageUrl: config?.imageUrl || '',
    },
  })

  function onSubmit(values: HeroBannerConfig) {
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
        <h3 className="text-lg font-semibold">히어로 배너 편집</h3>
      </div>

      {/* 프리뷰 */}
      <Card>
        <CardContent className="p-0">
          <div className="relative flex h-[240px] overflow-hidden rounded-lg bg-zinc-100">
            {form.watch('imageUrl') && (
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${form.watch('imageUrl')})` }}
              />
            )}
            <div className="relative z-10 flex w-[400px] flex-col justify-center gap-3 bg-white/90 p-8">
              {form.watch('badge') && (
                <span className="inline-block self-start rounded-full bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white">
                  {form.watch('badge')}
                </span>
              )}
              <h2 className="whitespace-pre-line text-xl font-extrabold leading-snug text-zinc-900">
                {form.watch('title') || '배너 제목'}
              </h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-zinc-500">
                {form.watch('description') || '배너 설명'}
              </p>
              {form.watch('buttonText') && (
                <span className="inline-block self-start rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white">
                  {form.watch('buttonText')}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardContent className="space-y-4 p-6">
            <h4 className="font-semibold">배너 콘텐츠</h4>

            <div className="space-y-2">
              <Label>뱃지 텍스트</Label>
              <Input placeholder="봄맞이 이벤트" {...form.register('badge')} />
            </div>

            <div className="space-y-2">
              <Label>제목</Label>
              <Textarea rows={2} placeholder="봄맞이 리프팅 시술\n특별 프로모션" {...form.register('title')} />
            </div>

            <div className="space-y-2">
              <Label>설명</Label>
              <Textarea rows={2} placeholder="자연스러운 V라인을 위한..." {...form.register('description')} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>버튼 텍스트</Label>
                <Input placeholder="자세히 보기" {...form.register('buttonText')} />
              </div>
              <div className="space-y-2">
                <Label>버튼 링크</Label>
                <Input placeholder="/events/spring" {...form.register('buttonHref')} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>배경 이미지 URL</Label>
              <Input placeholder="https://..." {...form.register('imageUrl')} />
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
