'use client'

import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  Card,
  CardContent,
  Button,
  Input,
  Label,
} from '@letmein/ui'
import { Save, HeartPulse, Info, Upload, X, ImageIcon } from 'lucide-react'
import { useSiteHeader, useUpdateSiteHeader } from '@/features/homepage-manage'
import { useMenus } from '@/features/menu-manage'
import { uploadMedia } from '@/features/media'
import type { SiteHeaderUpdateInput } from '@letmein/types'

interface HeaderFormValues {
  logoIcon: string
  logoText: string
  logoImageUrl: string
}

export function HeaderManage() {
  const { data: header, isLoading } = useSiteHeader()
  const { data: gnbMenus } = useMenus('gnb')
  const updateHeader = useUpdateSiteHeader()
  const [saved, setSaved] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const form = useForm<HeaderFormValues>({
    values: header
      ? {
          logoIcon: header.logoIcon,
          logoText: header.logoText,
          logoImageUrl: header.logoImageUrl ?? '',
        }
      : undefined,
  })

  const logoImageUrl = form.watch('logoImageUrl')

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const result = await uploadMedia(file, { altText: '헤더 로고 이미지' })
      if (result.success && result.data) {
        form.setValue('logoImageUrl', result.data.fullUrl, { shouldDirty: true })
      }
    } catch (error) {
      console.error('Failed to upload logo image:', error)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  function handleRemoveImage() {
    form.setValue('logoImageUrl', '', { shouldDirty: true })
  }

  function onSubmit(values: HeaderFormValues) {
    const payload: SiteHeaderUpdateInput = {
      logoIcon: values.logoIcon,
      logoText: values.logoText,
      logoImageUrl: values.logoImageUrl,
    }
    updateHeader.mutate(payload, {
      onSuccess: () => {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      },
    })
  }

  const visibleMenus = (gnbMenus?.menus ?? []).filter((m) => m.isVisible && !m.parentId)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* 프리뷰 */}
      <Card>
        <CardContent className="p-0">
          <div className="flex h-16 items-center justify-between border-b bg-white px-10">
            <div className="flex items-center gap-2">
              {logoImageUrl ? (
                <img
                  src={logoImageUrl}
                  alt="로고"
                  className="h-8 max-w-[120px] object-contain"
                />
              ) : (
                <HeartPulse className="h-6 w-6 text-blue-600" />
              )}
              <span className="text-lg font-extrabold">
                {form.watch('logoText') || '뷰티클리닉'}
              </span>
            </div>
            <div className="flex items-center gap-9">
              {visibleMenus.length > 0 ? (
                visibleMenus.map((menu, i) => (
                  <span
                    key={menu.id}
                    className={`text-sm ${i === 0 ? 'font-semibold text-blue-600' : 'font-medium text-zinc-500'}`}
                  >
                    {menu.nameKey}
                  </span>
                ))
              ) : (
                <span className="text-sm text-zinc-400">메뉴관리 탭에서 GNB 메뉴를 추가하세요</span>
              )}
            </div>
            <div className="flex items-center gap-4 text-zinc-400">
              <span className="text-xs">검색</span>
              <span className="text-xs">알림</span>
              <span className="text-xs">프로필</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 로고 이미지 설정 */}
      <Card>
        <CardContent className="space-y-4 p-6">
          <h3 className="font-semibold">로고 이미지</h3>
          <p className="text-sm text-muted-foreground">
            로고 이미지를 업로드하면 아이콘 대신 이미지가 표시됩니다. 이미지를 제거하면 아이콘이 다시 표시됩니다.
          </p>

          {logoImageUrl ? (
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-40 items-center justify-center rounded-lg border bg-zinc-50 p-2">
                <img
                  src={logoImageUrl}
                  alt="로고 미리보기"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRemoveImage}
              >
                <X className="mr-1 h-4 w-4" />
                이미지 제거
              </Button>
            </div>
          ) : (
            <div
              className="flex h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-zinc-300 bg-zinc-50 transition-colors hover:border-blue-400 hover:bg-blue-50"
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? (
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
              ) : (
                <>
                  <ImageIcon className="h-8 w-8 text-zinc-400" />
                  <span className="text-sm text-zinc-500">클릭하여 로고 이미지 업로드</span>
                  <span className="text-xs text-zinc-400">PNG, JPG, SVG, WebP (최대 20MB)</span>
                </>
              )}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
            className="hidden"
            onChange={handleImageUpload}
          />
        </CardContent>
      </Card>

      {/* 로고 설정 */}
      <Card>
        <CardContent className="space-y-4 p-6">
          <h3 className="font-semibold">로고 텍스트 & 아이콘</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="logoIcon">로고 아이콘 (Lucide 아이콘명)</Label>
              <Input
                id="logoIcon"
                placeholder="heart-pulse"
                {...form.register('logoIcon')}
              />
              <p className="text-xs text-muted-foreground">
                로고 이미지가 없을 때 표시됩니다
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="logoText">로고 텍스트</Label>
              <Input
                id="logoText"
                placeholder="뷰티클리닉"
                {...form.register('logoText')}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 네비게이션 안내 */}
      <Card>
        <CardContent className="flex items-start gap-3 p-6">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-500" />
          <div>
            <h3 className="font-semibold">네비게이션 메뉴</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              헤더에 표시되는 네비게이션 메뉴는 <strong>메뉴관리</strong> 탭의 GNB(상단 메뉴)에서 관리됩니다.
              메뉴 추가/수정/순서 변경은 메뉴관리 탭에서 진행해주세요.
            </p>
            {visibleMenus.length > 0 && (
              <p className="mt-2 text-sm text-muted-foreground">
                현재 GNB에 {visibleMenus.length}개 메뉴가 등록되어 있습니다.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 저장 */}
      <div className="flex justify-end">
        <Button type="submit" disabled={updateHeader.isPending}>
          <Save className="mr-2 h-4 w-4" />
          {updateHeader.isPending ? '저장 중...' : saved ? '저장 완료!' : '저장'}
        </Button>
      </div>
    </form>
  )
}
