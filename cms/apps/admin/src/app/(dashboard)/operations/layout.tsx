'use client'

import { TabLayout } from '@/widgets/tab-layout'

const tabs = [{ label: '알림 관리', href: '/operations/notifications' }]

export default function OperationsLayout({ children }: { children: React.ReactNode }) {
  return (
    <TabLayout title="운영" description="알림을 관리합니다." tabs={tabs}>
      {children}
    </TabLayout>
  )
}
