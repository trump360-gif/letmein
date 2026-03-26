'use client'

import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button, Input, Label } from '@letmein/ui'
import { cn } from '@letmein/utils'
import { Loader2 } from 'lucide-react'
import { useSettings, useUpdateSettings } from '@/features/settings'

// ==================== SEO Schema ====================

const seoSchema = z.object({
  titleFormat: z.string().min(1, '타이틀 포맷을 입력해주세요'),
  metaDescription: z.string().max(160, '160자 이내로 입력해주세요').optional().or(z.literal('')),
  ogImage: z.string().optional().or(z.literal('')),
  ga4MeasurementId: z.string().optional().or(z.literal('')),
  naverVerificationCode: z.string().optional().or(z.literal('')),
  googleVerificationCode: z.string().optional().or(z.literal('')),
})

type SeoForm = z.infer<typeof seoSchema>

const SEO_KEYS = [
  'titleFormat',
  'metaDescription',
  'ogImage',
  'ga4MeasurementId',
  'naverVerificationCode',
  'googleVerificationCode',
] as const

// ==================== AO Schema ====================

const aoSchema = z.object({
  siteIntroduction: z.string().optional().or(z.literal('')),
})

type AoForm = z.infer<typeof aoSchema>

const AO_KEYS = ['siteIntroduction'] as const

// ==================== GEO Schema ====================

const geoSchema = z.object({
  defaultSchemaType: z.string().optional().or(z.literal('')),
})

type GeoForm = z.infer<typeof geoSchema>

const GEO_KEYS = ['defaultSchemaType'] as const

// ==================== Inner Tab Types ====================

type InnerTab = 'seo' | 'ao' | 'geo'

const innerTabs = [
  { id: 'seo' as const, label: 'SEO' },
  { id: 'ao' as const, label: 'AO' },
  { id: 'geo' as const, label: 'GEO' },
]

export function SeoTab() {
  const [innerTab, setInnerTab] = useState<InnerTab>('seo')
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

  // SEO Form
  const seoForm = useForm<SeoForm>({
    resolver: zodResolver(seoSchema),
    defaultValues: {
      titleFormat: '',
      metaDescription: '',
      ogImage: '',
      ga4MeasurementId: '',
      naverVerificationCode: '',
      googleVerificationCode: '',
    },
  })

  // AO Form
  const aoForm = useForm<AoForm>({
    resolver: zodResolver(aoSchema),
    defaultValues: { siteIntroduction: '' },
  })

  // GEO Form
  const geoForm = useForm<GeoForm>({
    resolver: zodResolver(geoSchema),
    defaultValues: { defaultSchemaType: '' },
  })

  useEffect(() => {
    if (Object.keys(settingsMap).length > 0) {
      seoForm.reset({
        titleFormat: settingsMap.titleFormat || '%s | My Site',
        metaDescription: settingsMap.metaDescription || '',
        ogImage: settingsMap.ogImage || '',
        ga4MeasurementId: settingsMap.ga4MeasurementId || '',
        naverVerificationCode: settingsMap.naverVerificationCode || '',
        googleVerificationCode: settingsMap.googleVerificationCode || '',
      })
      aoForm.reset({
        siteIntroduction: settingsMap.siteIntroduction || '',
      })
      geoForm.reset({
        defaultSchemaType: settingsMap.defaultSchemaType || 'Organization',
      })
    }
  }, [settingsMap]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSaveSeo = (formData: SeoForm) => {
    const settings = SEO_KEYS.map((key) => ({
      key,
      value: formData[key] || null,
    }))
    updateMutation.mutate(
      { settings },
      {
        onSuccess: () => alert('SEO 설정이 저장되었습니다.'),
        onError: () => alert('저장에 실패했습니다.'),
      },
    )
  }

  const handleSaveAo = (formData: AoForm) => {
    const settings = AO_KEYS.map((key) => ({
      key,
      value: formData[key] || null,
    }))
    updateMutation.mutate(
      { settings },
      {
        onSuccess: () => alert('AO 설정이 저장되었습니다.'),
        onError: () => alert('저장에 실패했습니다.'),
      },
    )
  }

  const handleSaveGeo = (formData: GeoForm) => {
    const settings = GEO_KEYS.map((key) => ({
      key,
      value: formData[key] || null,
    }))
    updateMutation.mutate(
      { settings },
      {
        onSuccess: () => alert('GEO 설정이 저장되었습니다.'),
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
    <div className="space-y-4 rounded-lg border bg-card p-6">
      <h3 className="text-lg font-semibold">SEO / AO / GEO</h3>

      {/* Inner tabs */}
      <div className="flex gap-1 rounded-md border bg-muted p-1">
        {innerTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setInnerTab(tab.id)}
            className={cn(
              'flex-1 rounded-sm px-3 py-1.5 text-sm font-medium transition-colors',
              innerTab === tab.id
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* SEO Tab Content */}
      {innerTab === 'seo' && (
        <form onSubmit={seoForm.handleSubmit(handleSaveSeo)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="titleFormat">기본 타이틀 포맷 *</Label>
              <Input
                id="titleFormat"
                {...seoForm.register('titleFormat')}
                placeholder="%s | My Site"
              />
              <p className="text-xs text-muted-foreground">%s 부분이 페이지 제목으로 대체됩니다</p>
              {seoForm.formState.errors.titleFormat && (
                <p className="text-sm text-destructive">{seoForm.formState.errors.titleFormat.message}</p>
              )}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="metaDescription">기본 Meta Description</Label>
              <Input
                id="metaDescription"
                {...seoForm.register('metaDescription')}
                placeholder="사이트에 대한 간단한 설명 (160자 이내)"
              />
              {seoForm.formState.errors.metaDescription && (
                <p className="text-sm text-destructive">{seoForm.formState.errors.metaDescription.message}</p>
              )}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="ogImage">기본 OG Image URL</Label>
              <Input
                id="ogImage"
                {...seoForm.register('ogImage')}
                placeholder="https://example.com/og-image.png"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ga4MeasurementId">GA4 측정 ID</Label>
              <Input
                id="ga4MeasurementId"
                {...seoForm.register('ga4MeasurementId')}
                placeholder="G-XXXXXXXXXX"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="naverVerificationCode">네이버 사이트 인증코드</Label>
              <Input
                id="naverVerificationCode"
                {...seoForm.register('naverVerificationCode')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="googleVerificationCode">구글 사이트 인증코드</Label>
              <Input
                id="googleVerificationCode"
                {...seoForm.register('googleVerificationCode')}
              />
            </div>
          </div>

          <div className="flex justify-end border-t pt-4">
            <Button type="submit" disabled={!seoForm.formState.isDirty || updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              SEO 설정 저장
            </Button>
          </div>
        </form>
      )}

      {/* AO Tab Content */}
      {innerTab === 'ao' && (
        <form onSubmit={aoForm.handleSubmit(handleSaveAo)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="siteIntroduction">사이트 핵심 소개문</Label>
            <textarea
              id="siteIntroduction"
              {...aoForm.register('siteIntroduction')}
              className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="AI 검색 엔진 최적화를 위한 사이트 핵심 소개문을 작성하세요."
            />
            <p className="text-xs text-muted-foreground">
              AI 검색 엔진(ChatGPT, Bing 등)이 사이트를 이해하는 데 사용됩니다.
            </p>
          </div>

          <div className="flex justify-end border-t pt-4">
            <Button type="submit" disabled={!aoForm.formState.isDirty || updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              AO 설정 저장
            </Button>
          </div>
        </form>
      )}

      {/* GEO Tab Content */}
      {innerTab === 'geo' && (
        <form onSubmit={geoForm.handleSubmit(handleSaveGeo)} className="space-y-4">
          <div className="space-y-2">
            <Label>기본 구조화 데이터 타입</Label>
            <div className="flex flex-wrap gap-1.5">
              {[
                { value: 'Organization', label: 'Organization' },
                { value: 'WebSite', label: 'WebSite' },
                { value: 'LocalBusiness', label: 'LocalBusiness' },
                { value: 'Person', label: 'Person' },
                { value: 'Product', label: 'Product' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => geoForm.setValue('defaultSchemaType', opt.value, { shouldDirty: true })}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    geoForm.watch('defaultSchemaType') === opt.value
                      ? 'bg-foreground text-background'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Google 검색 결과에 구조화된 데이터로 표시될 기본 스키마 타입입니다.
            </p>
          </div>

          <div className="flex justify-end border-t pt-4">
            <Button type="submit" disabled={!geoForm.formState.isDirty || updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              GEO 설정 저장
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
