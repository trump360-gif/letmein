'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useSidebar } from './sidebar-context'

export function SidebarToggle() {
  const { isOpen, setIsOpen } = useSidebar()
  return (
    <button
      onClick={() => setIsOpen(!isOpen)}
      className="hidden lg:flex h-9 w-9 items-center justify-center rounded-sm bg-[#1A1A1A] text-[#999999] hover:text-white"
      title="AI 봇 활동"
    >
      {isOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
    </button>
  )
}
