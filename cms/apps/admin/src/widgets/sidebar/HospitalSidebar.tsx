'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  HeartHandshake,
  MessageSquare,
  Crown,
  Megaphone,
  Building,
  Users,
  LogOut,
} from 'lucide-react'
import { cn } from '@letmein/utils'
import { useUIStore } from '@/shared/store/ui.store'
import { useRouter } from 'next/navigation'

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const navigation: NavItem[] = [
  { name: '대시보드', href: '/hospital/dashboard', icon: LayoutDashboard },
  { name: '상담 관리', href: '/hospital/consultations', icon: HeartHandshake },
  { name: '채팅', href: '/hospital/chat', icon: MessageSquare },
  { name: '프리미엄', href: '/hospital/premium', icon: Crown },
  { name: '광고 관리', href: '/hospital/ads', icon: Megaphone },
  { name: '프로필 관리', href: '/hospital/profile', icon: Building },
  { name: '의료진 관리', href: '/hospital/doctors', icon: Users },
]

export function HospitalSidebar() {
  const pathname = usePathname() ?? '/hospital/dashboard'
  const { sidebarOpen } = useUIStore()
  const router = useRouter()

  const handleLogout = async () => {
    await fetch('/api/v1/hospital/auth/signout', { method: 'POST' })
    router.replace('/hospital-login')
  }

  return (
    <aside
      className={cn(
        'sticky top-0 flex h-screen flex-col border-r bg-card transition-all duration-300 shrink-0',
        sidebarOpen ? 'w-56' : 'w-16',
      )}
    >
      <div className="flex h-14 items-center border-b px-4">
        <h1 className={cn('font-bold text-lg', !sidebarOpen && 'hidden')}>병원 포탈</h1>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-2">
        {navigation.map((item) => {
          const isActive = item.href === '/hospital/dashboard'
            ? pathname === '/hospital/dashboard'
            : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
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
