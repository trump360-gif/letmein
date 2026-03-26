'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@letmein/ui'
import { useCreateBanner } from '@/features/banner-editor'
import { BannerForm, type BannerFormValues } from '../components/banner-form'

export function BannerCreatePage() {
  const router = useRouter()
  const createBanner = useCreateBanner()

  async function handleSubmit(values: BannerFormValues) {
    try {
      await createBanner.mutateAsync({
        ...values,
        groupId: values.groupId || undefined,
        pcImageId: values.pcImageId || undefined,
        mobileImageId: values.mobileImageId || undefined,
        tabletImageId: values.tabletImageId || undefined,
        altText: values.altText || undefined,
        textContent: values.textContent || undefined,
        bgColor: values.bgColor || undefined,
        textColor: values.textColor || undefined,
        linkUrl: values.linkUrl || undefined,
        utmCampaign: values.utmCampaign || undefined,
        startsAt: values.startsAt || undefined,
        endsAt: values.endsAt || undefined,
        abGroup: values.abGroup || undefined,
      })
      router.push('/operations/banners')
    } catch {
      // error handled by mutation
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-2xl font-bold">배너 추가</h2>
      </div>

      <BannerForm onSubmit={handleSubmit} isPending={createBanner.isPending} />
    </div>
  )
}
