'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  FileText,
  Users,
  Megaphone,
  SlidersHorizontal,
  Menu,
  Globe,
  LogOut,
  HeartHandshake,
  Building2,
  Star,
  Video,
  Crown,
  BadgeCheck,
  BookOpen,
} from 'lucide-react'
import { cn } from '@letmein/utils'
import { useUIStore } from '@/shared/store/ui.store'
import { useAuthStore } from '@/shared/store/auth.store'
import { useRouter } from 'next/navigation'

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  section?: string
}

const navigation: NavItem[] = [
  { name: '대시보드', href: '/', icon: LayoutDashboard },
  { name: '콘텐츠 관리', href: '/contents', icon: FileText },

  // LetMeIn 섹션
  { name: '코디네이터 매칭', href: '/coordinator', icon: HeartHandshake, section: 'LetMeIn' },
  { name: '병원 관리', href: '/hospitals', icon: Building2, section: 'LetMeIn' },
  { name: '출연자 관리', href: '/cast-members', icon: Star, section: 'LetMeIn' },
  { name: '에피소드 관리', href: '/episodes', icon: Video, section: 'LetMeIn' },
  { name: '스토리 관리', href: '/cast-stories', icon: BookOpen, section: 'LetMeIn' },
  { name: '프리미엄 관리', href: '/premium', icon: Crown, section: 'LetMeIn' },
  { name: '광고 심사', href: '/ads', icon: BadgeCheck, section: 'LetMeIn' },

  // 공통 섹션
  { name: '메뉴 관리', href: '/operations/menus', icon: Menu, section: '공통' },
  { name: '사용자 관리', href: '/members', icon: Users, section: '공통' },
  { name: '운영', href: '/operations', icon: Megaphone, section: '공통' },
  { name: '분석/설정', href: '/config', icon: SlidersHorizontal, section: '공통' },
]

export function Sidebar() {
  const pathname = usePathname() ?? '/'
  const { sidebarOpen } = useUIStore()
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const router = useRouter()

  const handleLogout = async () => {
    await fetch('/api/v1/admin/auth/signout', { method: 'POST' })
    clearAuth()
    router.replace('/login')
  }

  let lastSection: string | undefined

  return (
    <aside
      className={cn(
        'sticky top-0 flex h-screen flex-col border-r bg-card transition-all duration-300 shrink-0',
        sidebarOpen ? 'w-56' : 'w-16',
      )}
    >
      <div className="flex h-14 items-center border-b px-4">
        <h1 className={cn('font-bold text-lg', !sidebarOpen && 'hidden')}>LetMeIn Admin</h1>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-2">
        {navigation.map((item) => {
          const showSectionHeader = sidebarOpen && item.section && item.section !== lastSection
          if (item.section) lastSection = item.section

          const isActive =
            item.href === '/'
              ? pathname === '/'
              : item.href === '/operations'
                ? pathname.startsWith('/operations') && !pathname.startsWith('/operations/menus')
                : pathname.startsWith(item.href)

          return (
            <div key={item.href}>
              {showSectionHeader && (
                <div className="mt-4 mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                  {item.section}
                </div>
              )}
              <Link
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" aria-hidden />
                {sidebarOpen && <span>{item.name}</span>}
              </Link>
            </div>
          )
        })}
      </nav>
      <div className="border-t p-2">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {sidebarOpen && <span>로그아웃</span>}
        </button>
      </div>
    </aside>
  )
}
