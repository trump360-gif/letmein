'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  Card,
  CardContent,
  Button,
  Label,
  Textarea,
} from '@letmein/ui'
import { ArrowLeft, Save } from 'lucide-react'
import { useUpdateHomepageSection } from '@/features/homepage-manage'
import type { HomepageSection, HtmlBlockConfig } from '@letmein/types'

interface Props {
  section: HomepageSection
  onBack: () => void
}

export function HtmlBlockEditor({ section, onBack }: Props) {
  const config = section.config as unknown as HtmlBlockConfig
  const updateSection = useUpdateHomepageSection()
  const [saved, setSaved] = useState(false)

  const form = useForm<HtmlBlockConfig>({
    defaultValues: {
      html: config?.html ?? '',
    },
  })

  function onSubmit(values: HtmlBlockConfig) {
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
        <h3 className="text-lg font-semibold">HTML 블록 편집</h3>
      </div>

      {/* 프리뷰 */}
      {form.watch('html') && (
        <Card>
          <CardContent className="p-6">
            <Label className="mb-2 block text-xs text-muted-foreground">미리보기</Label>
            <div
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: form.watch('html') }}
            />
          </CardContent>
        </Card>
      )}

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardContent className="space-y-4 p-6">
            <h4 className="font-semibold">HTML 콘텐츠</h4>
            <p className="text-xs text-muted-foreground">
              자유롭게 HTML을 입력할 수 있습니다. 스크립트 태그는 보안상 제거됩니다.
            </p>
            <div className="space-y-2">
              <Label>HTML 코드</Label>
              <Textarea
                rows={12}
                placeholder='<div class="text-center py-8">...</div>'
                className="font-mono text-sm"
                {...form.register('html')}
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
