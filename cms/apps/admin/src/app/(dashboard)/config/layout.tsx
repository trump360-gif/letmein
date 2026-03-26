'use client'

import { TabLayout } from '@/widgets/tab-layout'

const tabs = [
  { label: '통계', href: '/config/analytics' },
  { label: 'API 설정', href: '/config/api-settings' },
  { label: '사이트 설정', href: '/config/settings' },
  { label: '시스템 관리', href: '/config/system' },
]

export default function ConfigLayout({ children }: { children: React.ReactNode }) {
  return (
    <TabLayout title="분석/설정" description="통계, API, 사이트 설정, 시스템을 관리합니다." tabs={tabs}>
      {children}
    </TabLayout>
  )
}
