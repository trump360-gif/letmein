'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  Card,
  CardContent,
  Button,
  Input,
  Label,
} from '@letmein/ui'
import { ArrowLeft, Save } from 'lucide-react'
import { useUpdateHomepageSection } from '@/features/homepage-manage'
import type { HomepageSection, LatestPostsConfig } from '@letmein/types'

interface Props {
  section: HomepageSection
  onBack: () => void
}

export function LatestPostsEditor({ section, onBack }: Props) {
  const config = section.config as unknown as LatestPostsConfig
  const updateSection = useUpdateHomepageSection()
  const [saved, setSaved] = useState(false)

  const form = useForm<LatestPostsConfig>({
    defaultValues: {
      title: config?.title ?? '최신 게시글',
      moreHref: config?.moreHref ?? '/',
      boardId: config?.boardId ?? '',
      limit: config?.limit ?? 5,
      skin: config?.skin ?? 'list',
    },
  })

  function onSubmit(values: LatestPostsConfig) {
    const payload = { ...values }
    if (!payload.boardId) delete payload.boardId
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

  const isPopular = section.type === 'popular_posts'

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="mr-1 h-4 w-4" />
          목록으로
        </Button>
        <h3 className="text-lg font-semibold">
          {isPopular ? '인기 게시글' : '최신 게시글'} 편집
        </h3>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardContent className="space-y-4 p-6">
            <h4 className="font-semibold">게시글 섹션 설정</h4>

            <div className="space-y-2">
              <Label>섹션 제목</Label>
              <Input placeholder="최신 게시글" {...form.register('title')} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>더보기 링크</Label>
                <Input placeholder="/latest" {...form.register('moreHref')} />
              </div>
              <div className="space-y-2">
                <Label>표시 개수</Label>
                <Input
                  type="number"
                  min={1}
                  max={20}
                  {...form.register('limit', { valueAsNumber: true })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>게시판 ID (비워두면 전체)</Label>
              <Input placeholder="특정 게시판만 표시" {...form.register('boardId')} />
            </div>

            <div className="space-y-2">
              <Label>표시 형태</Label>
              <div className="flex gap-2">
                {(['list', 'card'] as const).map((skin) => (
                  <button
                    key={skin}
                    type="button"
                    onClick={() => form.setValue('skin', skin)}
                    className={`rounded-lg border px-4 py-2 text-sm ${
                      form.watch('skin') === skin
                        ? 'border-primary bg-primary/5 font-medium'
                        : 'border-border hover:bg-muted'
                    }`}
                  >
                    {skin === 'list' ? '리스트' : '카드'}
                  </button>
                ))}
              </div>
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
