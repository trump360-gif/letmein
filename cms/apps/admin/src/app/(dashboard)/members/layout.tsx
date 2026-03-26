'use client'

import { usePathname } from 'next/navigation'
import { TabLayout } from '@/widgets/tab-layout'
import { UserActions } from '@/views/users/components/user-actions'
import { SanctionActions } from '@/views/sanctions/components/sanction-actions'
import { BannedWordActions } from '@/views/banned-words/components/banned-word-actions'

const tabs = [
  { label: '회원 관리', href: '/members/users' },
  { label: '신고 관리', href: '/members/reports' },
  { label: '제재 관리', href: '/members/sanctions' },
  { label: '금칙어 관리', href: '/members/banned-words' },
]

function getActions(pathname: string) {
  if (pathname === '/members/users' || pathname === '/members') return <UserActions />
  if (pathname.startsWith('/members/sanctions')) return <SanctionActions />
  if (pathname.startsWith('/members/banned-words')) return <BannedWordActions />
  return undefined
}

export default function MembersLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? ''

  return (
    <TabLayout title="사용자 관리" description="회원, 신고, 제재, 금칙어를 관리합니다." tabs={tabs} actions={getActions(pathname)}>
      {children}
    </TabLayout>
  )
}
