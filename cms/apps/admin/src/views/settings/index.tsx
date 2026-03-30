'use client'

import { useState } from 'react'
import { cn } from '@letmein/utils'
import {
  Settings,
  Search,
  Shield,
  Monitor,
} from 'lucide-react'
import { BasicInfoTab } from './components/basic-info-tab'
import { SeoTab } from './components/seo-tab'
import { SecurityTab } from './components/security-tab'
import { EnvironmentTab } from './components/environment-tab'

const tabs = [
  { id: 'basic', label: '기본 정보', icon: Settings },
  { id: 'seo', label: 'SEO / AO / GEO', icon: Search },
  { id: 'security', label: '보안 설정', icon: Shield },
  { id: 'environment', label: '환경 설정', icon: Monitor },
] as const

type TabId = (typeof tabs)[number]['id']

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('basic')

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
          {activeTab === 'basic' && <BasicInfoTab />}
          {activeTab === 'seo' && <SeoTab />}
          {activeTab === 'security' && <SecurityTab />}
          {activeTab === 'environment' && <EnvironmentTab />}
        </div>
      </div>
    </div>
  )
}
