'use client'

import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button, Input, Label } from '@letmein/ui'
import { Loader2 } from 'lucide-react'
import { useSettings, useUpdateSettings } from '@/features/settings'

const basicInfoSchema = z.object({
  siteName: z.string().min(1, '사이트명을 입력해주세요'),
  siteUrl: z.string().url('올바른 URL을 입력해주세요'),
  logoUrl: z.string().optional().or(z.literal('')),
  faviconUrl: z.string().optional().or(z.literal('')),
  contactEmail: z.string().email('올바른 이메일을 입력해주세요'),
  businessName: z.string().optional().or(z.literal('')),
  businessNumber: z.string().optional().or(z.literal('')),
  businessRepresentative: z.string().optional().or(z.literal('')),
  businessAddress: z.string().optional().or(z.literal('')),
  copyrightText: z.string().optional().or(z.literal('')),
})

type BasicInfoForm = z.infer<typeof basicInfoSchema>

const BASIC_INFO_KEYS = [
  'siteName',
  'siteUrl',
  'logoUrl',
  'faviconUrl',
  'contactEmail',
  'businessName',
  'businessNumber',
  'businessRepresentative',
  'businessAddress',
  'copyrightText',
] as const

export function BasicInfoTab() {
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

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<BasicInfoForm>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: {
      siteName: '',
      siteUrl: '',
      logoUrl: '',
      faviconUrl: '',
      contactEmail: '',
      businessName: '',
      businessNumber: '',
      businessRepresentative: '',
      businessAddress: '',
      copyrightText: '',
    },
  })

  useEffect(() => {
    if (Object.keys(settingsMap).length > 0) {
      reset({
        siteName: settingsMap.siteName || '',
        siteUrl: settingsMap.siteUrl || '',
        logoUrl: settingsMap.logoUrl || '',
        faviconUrl: settingsMap.faviconUrl || '',
        contactEmail: settingsMap.contactEmail || '',
        businessName: settingsMap.businessName || '',
        businessNumber: settingsMap.businessNumber || '',
        businessRepresentative: settingsMap.businessRepresentative || '',
        businessAddress: settingsMap.businessAddress || '',
        copyrightText: settingsMap.copyrightText || '',
      })
    }
  }, [settingsMap, reset])

  const onSubmit = (formData: BasicInfoForm) => {
    const settings = BASIC_INFO_KEYS.map((key) => ({
      key,
      value: formData[key] || null,
    }))

    updateMutation.mutate(
      { settings },
      {
        onSuccess: () => alert('기본 정보가 저장되었습니다.'),
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
      <h3 className="text-lg font-semibold">기본 정보</h3>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="siteName">사이트명 *</Label>
          <Input id="siteName" {...register('siteName')} placeholder="My Site" />
          {errors.siteName && (
            <p className="text-sm text-destructive">{errors.siteName.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="siteUrl">사이트 URL *</Label>
          <Input id="siteUrl" {...register('siteUrl')} placeholder="https://example.com" />
          {errors.siteUrl && (
            <p className="text-sm text-destructive">{errors.siteUrl.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="logoUrl">대표 로고 URL</Label>
          <Input id="logoUrl" {...register('logoUrl')} placeholder="https://example.com/logo.png" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="faviconUrl">파비콘 URL</Label>
          <Input id="faviconUrl" {...register('faviconUrl')} placeholder="https://example.com/favicon.ico" />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="contactEmail">대표 이메일 *</Label>
          <Input id="contactEmail" type="email" {...register('contactEmail')} placeholder="admin@example.com" />
          {errors.contactEmail && (
            <p className="text-sm text-destructive">{errors.contactEmail.message}</p>
          )}
        </div>
      </div>

      <div className="border-t pt-4">
        <h4 className="mb-4 text-sm font-medium text-muted-foreground">사업자 정보</h4>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="businessName">상호명</Label>
            <Input id="businessName" {...register('businessName')} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="businessNumber">사업자등록번호</Label>
            <Input id="businessNumber" {...register('businessNumber')} placeholder="000-00-00000" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="businessRepresentative">대표자</Label>
            <Input id="businessRepresentative" {...register('businessRepresentative')} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="businessAddress">사업장 주소</Label>
            <Input id="businessAddress" {...register('businessAddress')} />
          </div>
        </div>
      </div>

      <div className="border-t pt-4">
        <div className="space-y-2">
          <Label htmlFor="copyrightText">저작권 문구</Label>
          <Input
            id="copyrightText"
            {...register('copyrightText')}
            placeholder="&copy; 2024 My Company. All rights reserved."
          />
        </div>
      </div>

      <div className="flex justify-end border-t pt-4">
        <Button type="submit" disabled={!isDirty || updateMutation.isPending}>
          {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          기본 정보 저장
        </Button>
      </div>
    </form>
  )
}
