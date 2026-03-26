'use client'

import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@letmein/ui'
import { Loader2, Check, BookOpen, Users } from 'lucide-react'
import { useSettings, useUpdateSettings } from '@/features/settings'

const SITE_THEMES = ['blog', 'community'] as const
type SiteTheme = (typeof SITE_THEMES)[number]

const themeSchema = z.object({
  siteTheme: z.enum(SITE_THEMES),
})
type ThemeForm = z.infer<typeof themeSchema>

const THEMES: {
  value: SiteTheme
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  preview: React.ReactNode
}[] = [
  {
    value: 'blog',
    label: '블로그 테마',
    description: '매거진 스타일의 블로그 레이아웃. 피처드 카드, 카드 그리드, 사이드바 구성',
    icon: BookOpen,
    preview: (
      <div className="h-44 w-full overflow-hidden rounded-md bg-[#F5F4F1]">
        {/* NavBar */}
        <div className="flex h-6 items-center justify-between border-b border-[#E5E4E1] bg-white px-3">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-[#3D8A5A]" />
            <div className="h-1.5 w-14 rounded bg-[#1A1918]/70" />
          </div>
          <div className="h-4 w-16 rounded-full bg-[#3D8A5A]" />
        </div>
        {/* Hero Banner */}
        <div className="relative h-14 bg-[#3D8A5A]/20">
          <div className="absolute inset-0 flex flex-col justify-end gap-1 bg-gradient-to-t from-black/40 to-transparent px-3 pb-2">
            <div className="h-1.5 w-24 rounded bg-white/90" />
            <div className="h-1 w-32 rounded bg-white/60" />
            <div className="mt-0.5 h-3 w-20 rounded-full bg-[#3D8A5A]" />
          </div>
        </div>
        {/* Content + Sidebar */}
        <div className="flex gap-2 px-3 pt-2">
          <div className="flex flex-1 flex-col gap-1.5">
            {/* Featured */}
            <div className="flex h-8 gap-1.5 rounded-md bg-white shadow-sm">
              <div className="h-full w-12 rounded-l-md bg-[#EDECEA]" />
              <div className="flex flex-col justify-center gap-1 p-1.5">
                <div className="h-1 w-16 rounded bg-[#D89575]" />
                <div className="h-1.5 w-24 rounded bg-[#1A1918]/70" />
              </div>
            </div>
            {/* Card Grid */}
            <div className="grid grid-cols-2 gap-1.5">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="flex h-10 flex-col rounded-md bg-white shadow-sm">
                  <div className="h-5 w-full rounded-t-md bg-[#EDECEA]" />
                  <div className="flex flex-col gap-0.5 p-1">
                    <div className="h-1 w-full rounded bg-[#1A1918]/50" />
                    <div className="h-1 w-3/4 rounded bg-[#6D6C6A]/40" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Sidebar */}
          <div className="flex w-10 flex-col gap-1.5">
            <div className="flex h-12 flex-col gap-1 rounded-md bg-white p-1.5 shadow-sm">
              <div className="h-1 w-full rounded bg-[#1A1918]/60" />
              <div className="h-1 w-3/4 rounded bg-[#6D6C6A]/40" />
              <div className="h-1 w-5/6 rounded bg-[#6D6C6A]/40" />
            </div>
            <div className="flex h-10 flex-col items-center justify-center gap-1 rounded-md bg-[#3D8A5A] p-1.5">
              <div className="h-1 w-full rounded bg-white/80" />
              <div className="h-3 w-8 rounded-full bg-white" />
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    value: 'community',
    label: '커뮤니티 테마',
    description: '게시판 중심의 커뮤니티 레이아웃. 탭 네비게이션, 글 목록, 랭킹 위젯 구성',
    icon: Users,
    preview: (
      <div className="h-44 w-full overflow-hidden rounded-md bg-white">
        {/* NavBar */}
        <div className="flex h-6 items-center justify-between border-b border-[#E4E4E7] bg-white px-3">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-blue-500" />
            <div className="h-1.5 w-16 rounded bg-[#18181B]/70" />
          </div>
          <div className="flex gap-2">
            {['전체', '인기', '최신'].map((t) => (
              <div key={t} className="h-3 w-5 rounded bg-[#F4F4F5]" />
            ))}
          </div>
        </div>
        {/* Tab Bar */}
        <div className="flex h-5 items-end gap-3 border-b border-[#E4E4E7] px-3">
          <div className="border-b-2 border-blue-500 pb-0.5">
            <div className="h-1.5 w-8 rounded bg-blue-500" />
          </div>
          <div className="h-1.5 w-8 rounded bg-[#A1A1AA]" />
          <div className="h-1.5 w-8 rounded bg-[#A1A1AA]" />
        </div>
        {/* Content */}
        <div className="flex gap-2 p-2">
          <div className="flex flex-1 flex-col gap-0.5">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="flex flex-col gap-0.5 border-b border-[#F4F4F5] py-1.5">
                <div className="h-1.5 w-full rounded bg-[#18181B]/70" />
                <div className="h-1 w-3/4 rounded bg-[#71717A]/50" />
                <div className="h-1 w-1/2 rounded bg-[#A1A1AA]/40" />
              </div>
            ))}
          </div>
          <div className="flex w-14 flex-col gap-1.5">
            <div className="flex flex-col gap-1 rounded-md border border-[#F4F4F5] p-1.5">
              <div className="h-1.5 w-full rounded bg-[#18181B]/60" />
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-[#E4E4E7] text-[4px] font-bold" />
                  <div className="h-1 flex-1 rounded bg-[#71717A]/40" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    ),
  },
]

export function ThemeTab() {
  const { data, isLoading } = useSettings()
  const updateMutation = useUpdateSettings()

  const settingsMap = useMemo(() => {
    if (!data?.settings) return {}
    const map: Record<string, string> = {}
    for (const s of data.settings) {
      map[s.key] = s.value || ''
    }
    return map
  }, [data])

  const { handleSubmit, watch, setValue, reset, formState: { isDirty } } = useForm<ThemeForm>({
    resolver: zodResolver(themeSchema),
    defaultValues: { siteTheme: 'blog' },
  })

  useEffect(() => {
    if (settingsMap.siteTheme) {
      reset({ siteTheme: (settingsMap.siteTheme as SiteTheme) || 'blog' })
    }
  }, [settingsMap, reset])

  const selectedTheme = watch('siteTheme')

  const onSubmit = (formData: ThemeForm) => {
    updateMutation.mutate(
      { settings: [{ key: 'siteTheme', value: formData.siteTheme }] },
      {
        onSuccess: () => alert('테마가 저장되었습니다.'),
        onError: () => alert('저장에 실패했습니다.'),
      },
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center rounded-lg border bg-card p-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 rounded-lg border bg-card p-6">
      <div>
        <h3 className="text-lg font-semibold">사이트 테마</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          사이트의 전체 레이아웃과 디자인 테마를 선택하세요. 테마를 변경하면 방문자에게 보이는 사이트 모습이 달라집니다.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {THEMES.map((theme) => {
          const isSelected = selectedTheme === theme.value
          return (
            <button
              key={theme.value}
              type="button"
              onClick={() => setValue('siteTheme', theme.value, { shouldDirty: true })}
              className={`overflow-hidden rounded-xl border-2 text-left transition-all ${
                isSelected
                  ? 'border-primary shadow-md'
                  : 'border-border hover:border-muted-foreground/40'
              }`}
            >
              {/* 미리보기 */}
              <div className="border-b p-3">{theme.preview}</div>

              {/* 정보 */}
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className={`rounded-lg p-1.5 ${isSelected ? 'bg-primary/10' : 'bg-muted'}`}>
                    <theme.icon className={`h-4 w-4 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{theme.label}</p>
                    <p className="text-xs text-muted-foreground">{theme.description}</p>
                  </div>
                </div>
                {isSelected && (
                  <span className="flex shrink-0 items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                    <Check className="h-3 w-3" />
                    사용 중
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>

      <div className="flex justify-end border-t pt-4">
        <Button type="submit" disabled={!isDirty || updateMutation.isPending}>
          {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          테마 저장
        </Button>
      </div>
    </form>
  )
}
