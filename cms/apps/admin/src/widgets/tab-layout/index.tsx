'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@letmein/utils'

export interface TabItem {
  label: string
  href: string
}

interface TabLayoutProps {
  title: string
  description?: string
  tabs: TabItem[]
  actions?: React.ReactNode
  children: React.ReactNode
}

export function TabLayout({ title, description, tabs, actions, children }: TabLayoutProps) {
  const pathname = usePathname() ?? ''

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">{title}</h2>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>

      <div className="border-b">
        <nav className="-mb-px flex gap-6" aria-label="Tabs">
          {tabs.map((tab) => {
            const isActive =
              pathname === tab.href || pathname.startsWith(tab.href + '/')
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  'whitespace-nowrap border-b-2 px-1 pb-3 text-sm font-medium transition-colors',
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:border-muted-foreground/30 hover:text-foreground',
                )}
              >
                {tab.label}
              </Link>
            )
          })}
        </nav>
      </div>

      <div>{children}</div>
    </div>
  )
}
