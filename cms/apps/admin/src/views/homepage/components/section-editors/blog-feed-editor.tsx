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
import type { HomepageSection, BlogFeedConfig } from '@letmein/types'

interface Props {
  section: HomepageSection
  onBack: () => void
}

const SKIN_LABELS: Record<string, { label: string; description: string }> = {
  blog_magazine: {
    label: '매거진',
    description: '왼쪽 대형 피처 + 오른쪽 리스트',
  },
  blog_grid: {
    label: '그리드',
    description: '3열 카드 그리드 레이아웃',
  },
  blog_full: {
    label: '풀와이드',
    description: '가로형 카드 리스트',
  },
}

export function BlogFeedEditor({ section, onBack }: Props) {
  const config = section.config as unknown as BlogFeedConfig
  const updateSection = useUpdateHomepageSection()
  const [saved, setSaved] = useState(false)

  const skinInfo = SKIN_LABELS[section.type] ?? { label: '블로그', description: '' }

  const form = useForm<BlogFeedConfig>({
    defaultValues: {
      title: config?.title || skinInfo.label,
      moreHref: config?.moreHref || '/',
      boardId: config?.boardId || '',
      limit: config?.limit || 6,
    },
  })

  function onSubmit(values: BlogFeedConfig) {
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="mr-1 h-4 w-4" />
          목록으로
        </Button>
        <h3 className="text-lg font-semibold">블로그 피드 편집 ({skinInfo.label})</h3>
      </div>

      {/* 레이아웃 미리보기 */}
      <Card>
        <CardContent className="p-6">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-lg font-bold">{form.watch('title') || skinInfo.label}</span>
            <span className="text-sm text-blue-600">더보기 →</span>
          </div>

          {section.type === 'blog_magazine' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="h-32 rounded-lg bg-gradient-to-br from-[#e8d5c4] to-[#c9a88a]" />
                <div className="h-3 w-3/4 rounded bg-zinc-200" />
                <div className="h-2 w-1/2 rounded bg-zinc-100" />
              </div>
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-3 rounded-lg bg-zinc-50 p-2">
                    <div className="h-12 w-12 shrink-0 rounded bg-zinc-200" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-2.5 w-3/4 rounded bg-zinc-200" />
                      <div className="h-2 w-1/2 rounded bg-zinc-100" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {section.type === 'blog_grid' && (
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2 rounded-lg bg-zinc-50 p-2">
                  <div className="h-20 rounded bg-zinc-200" />
                  <div className="h-2.5 w-3/4 rounded bg-zinc-200" />
                  <div className="h-2 w-1/2 rounded bg-zinc-100" />
                </div>
              ))}
            </div>
          )}

          {section.type === 'blog_full' && (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="flex gap-4 rounded-lg bg-zinc-50 p-3">
                  <div className="h-20 w-32 shrink-0 rounded-lg bg-zinc-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-2.5 w-1/4 rounded bg-blue-100" />
                    <div className="h-3 w-3/4 rounded bg-zinc-200" />
                    <div className="h-2 w-full rounded bg-zinc-100" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardContent className="space-y-4 p-6">
            <h4 className="font-semibold">블로그 피드 설정</h4>

            <div className="space-y-2">
              <Label>섹션 제목</Label>
              <Input placeholder="뷰티 매거진" {...form.register('title')} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>더보기 링크</Label>
                <Input placeholder="/blog" {...form.register('moreHref')} />
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

            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground">
                레이아웃: <strong>{skinInfo.label}</strong> — {skinInfo.description}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                레이아웃을 변경하려면 다른 블로그 섹션 유형을 추가하세요.
              </p>
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
