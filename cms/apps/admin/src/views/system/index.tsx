'use client'

import { useState } from 'react'
import { cn } from '@letmein/utils'
import {
  Activity,
  LogIn,
  Shield,
  Users,
  AlertTriangle,
} from 'lucide-react'
import { ActivityLogs } from './components/activity-logs'
import { LoginHistory } from './components/login-history'
import { RoleManagement } from './components/role-management'
import { AdminList } from './components/admin-list'
import { SystemLogs } from './components/system-logs'

const tabs = [
  { id: 'activity-logs', label: '활동 로그', icon: Activity },
  { id: 'login-history', label: '로그인 이력', icon: LogIn },
  { id: 'roles', label: '역할 관리', icon: Shield },
  { id: 'admins', label: '관리자 목록', icon: Users },
  { id: 'system-logs', label: '시스템 로그', icon: AlertTriangle },
] as const

type TabId = (typeof tabs)[number]['id']

export function SystemPage() {
  const [activeTab, setActiveTab] = useState<TabId>('activity-logs')

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Tab Navigation - Sidebar style */}
        <nav className="w-full shrink-0 lg:w-56">
          <div className="rounded-lg border bg-card">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors first:rounded-t-lg last:rounded-b-lg',
                    activeTab === tab.id
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </nav>

        {/* Tab Content */}
        <div className="min-w-0 flex-1">
          {activeTab === 'activity-logs' && <ActivityLogs />}
          {activeTab === 'login-history' && <LoginHistory />}
          {activeTab === 'roles' && <RoleManagement />}
          {activeTab === 'admins' && <AdminList />}
          {activeTab === 'system-logs' && <SystemLogs />}
        </div>
      </div>
    </div>
  )
}
