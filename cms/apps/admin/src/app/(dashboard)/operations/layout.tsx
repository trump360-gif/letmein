'use client'

import { usePathname } from 'next/navigation'
import { TabLayout } from '@/widgets/tab-layout'
import { MenuActions } from '@/views/menus/components/menu-actions'
import { BannerActions } from '@/views/banners/components/banner-actions'
import { PopupActions } from '@/views/popups/components/popup-actions'

const tabs = [
  { label: '알림 관리', href: '/operations/notifications' },
  { label: '배너 관리', href: '/operations/banners' },
  { label: '팝업 관리', href: '/operations/popups' },
  { label: '메뉴 관리', href: '/operations/menus' },
]

function getActions(pathname: string) {
  if (pathname.startsWith('/operations/menus')) return <MenuActions />
  if (pathname.startsWith('/operations/banners')) return <BannerActions />
  if (pathname.startsWith('/operations/popups')) return <PopupActions />
  return undefined
}

export default function OperationsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? ''

  return (
    <TabLayout title="운영" description="알림, 배너, 팝업, 메뉴를 관리합니다." tabs={tabs} actions={getActions(pathname)}>
      {children}
    </TabLayout>
  )
}
