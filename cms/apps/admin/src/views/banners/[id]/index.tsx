'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button, Tabs, TabsList, TabsTrigger, TabsContent } from '@letmein/ui'
import { useBanner, useUpdateBanner } from '@/features/banner-editor'
import { BannerForm, type BannerFormValues } from '../components/banner-form'
import { BannerStats } from '../components/banner-stats'

interface BannerEditPageProps {
  bannerId: string
}

export function BannerEditPage({ bannerId }: BannerEditPageProps) {
  const router = useRouter()
  const { data: banner, isLoading } = useBanner(bannerId)
  const updateBanner = useUpdateBanner()

  async function handleSubmit(values: BannerFormValues) {
    try {
      await updateBanner.mutateAsync({
        id: bannerId,
        payload: {
          ...values,
          groupId: values.groupId || null,
          pcImageId: values.pcImageId || null,
          mobileImageId: values.mobileImageId || null,
          tabletImageId: values.tabletImageId || null,
          altText: values.altText || null,
          textContent: values.textContent || null,
          bgColor: values.bgColor || null,
          textColor: values.textColor || null,
          linkUrl: values.linkUrl || null,
          utmCampaign: values.utmCampaign || null,
          startsAt: values.startsAt || null,
          endsAt: values.endsAt || null,
          abGroup: values.abGroup || null,
        },
      })
      router.push('/operations/banners')
    } catch {
      // error handled by mutation
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!banner) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground">배너를 찾을 수 없습니다.</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/operations/banners')}>
          목록으로
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-2xl font-bold">배너 수정: {banner.name}</h2>
      </div>

      <Tabs defaultValue="edit">
        <TabsList>
          <TabsTrigger value="edit">수정</TabsTrigger>
          <TabsTrigger value="stats">통계</TabsTrigger>
        </TabsList>

        <TabsContent value="edit" className="mt-4">
          <BannerForm
            banner={banner}
            onSubmit={handleSubmit}
            isPending={updateBanner.isPending}
          />
        </TabsContent>

        <TabsContent value="stats" className="mt-4">
          <BannerStats bannerId={bannerId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
