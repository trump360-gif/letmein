'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@letmein/ui'
import { useCreateBanner } from '@/features/banner-editor'
import { BannerWizardModal } from './banner-wizard-modal'

export function BannerActions() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const createBanner = useCreateBanner()

  async function handleCreateBanner(values: Parameters<typeof createBanner.mutateAsync>[0]) {
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
    setCreateDialogOpen(false)
  }

  return (
    <>
      <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
        <Plus className="mr-1.5 h-3.5 w-3.5" />
        배너 추가
      </Button>
      <BannerWizardModal
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSubmit={handleCreateBanner}
        isPending={createBanner.isPending}
      />
    </>
  )
}
