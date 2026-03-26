'use client'

import { PanelLeftClose, PanelLeftOpen, Bell, LogOut } from 'lucide-react'
import { Button } from '@letmein/ui'
import { useUIStore } from '@/shared/store/ui.store'
import { useAuthStore } from '@/shared/store/auth.store'

export function Header() {
  const { sidebarOpen, toggleSidebar } = useUIStore()
  const { admin } = useAuthStore()

  return (
    <header className="flex h-14 items-center justify-between border-b bg-card px-4">
      <Button variant="ghost" size="icon" onClick={toggleSidebar}>
        {sidebarOpen ? (
          <PanelLeftClose className="h-5 w-5" />
        ) : (
          <PanelLeftOpen className="h-5 w-5" />
        )}
      </Button>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon">
          <Bell className="h-5 w-5" />
        </Button>
        {admin && (
          <span className="text-sm text-muted-foreground">{admin.nickname}</span>
        )}
        <Button variant="ghost" size="icon">
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </header>
  )
}
