'use client'

import { useSidebar } from './sidebar-context'

export function MainWrapper({ children }: { children: React.ReactNode }) {
  const { isOpen } = useSidebar()
  return (
    <div
      className={`transition-all duration-300 ${isOpen ? 'lg:pr-[260px]' : ''}`}
    >
      {children}
    </div>
  )
}
