'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronDown } from 'lucide-react'

interface MenuChild {
  id: string
  nameKey: string
  href: string
  openNewTab: boolean
}

interface MenuData {
  id: string
  nameKey: string
  href: string
  openNewTab: boolean
  children: MenuChild[]
}

export function GnbMenuItem({ menu }: { menu: MenuData }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hasChildren = menu.children.length > 0

  const isActive =
    pathname === menu.href ||
    pathname.startsWith(menu.href + '/') ||
    menu.children.some((c) => pathname === c.href || pathname.startsWith(c.href + '/'))

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  function handleMouseEnter() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setOpen(true)
  }

  function handleMouseLeave() {
    timeoutRef.current = setTimeout(() => setOpen(false), 150)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setOpen((prev) => !prev)
    }
    if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  if (!hasChildren) {
    return (
      <Link
        href={menu.href}
        target={menu.openNewTab ? '_blank' : undefined}
        className={`relative rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-[#F5F4F1] hover:text-[#3D8A5A] ${
          isActive ? 'text-[#3D8A5A]' : 'text-[#6D6C6A]'
        }`}
        aria-current={isActive ? 'page' : undefined}
      >
        {menu.nameKey}
        {isActive && (
          <span className="absolute -bottom-1 left-1/2 h-0.5 w-5 -translate-x-1/2 rounded-full bg-[#3D8A5A]" />
        )}
      </Link>
    )
  }

  return (
    <div
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        className={`relative flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-[#F5F4F1] hover:text-[#3D8A5A] ${
          isActive ? 'text-[#3D8A5A]' : 'text-[#6D6C6A]'
        }`}
        onClick={() => setOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
        aria-expanded={open}
        aria-haspopup="true"
      >
        {menu.nameKey}
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
        {isActive && (
          <span className="absolute -bottom-1 left-1/2 h-0.5 w-5 -translate-x-1/2 rounded-full bg-[#3D8A5A]" />
        )}
      </button>

      {open && (
        <div
          className="absolute left-1/2 top-full z-50 -translate-x-1/2"
          role="menu"
          aria-label={menu.nameKey}
        >
          {/* 드롭다운과 버튼 사이 간격을 투명 영역으로 채워 마우스 이탈 방지 */}
          <div className="h-2" />
          <div className="min-w-[180px] rounded-lg border border-[#E5E4E1] bg-white py-1.5 shadow-lg">
            {menu.children.map((child) => {
              const childActive = pathname === child.href || pathname.startsWith(child.href + '/')
              return (
                <Link
                  key={child.id}
                  href={child.href}
                  target={child.openNewTab ? '_blank' : undefined}
                  role="menuitem"
                  className={`block px-4 py-2.5 text-sm transition-colors hover:bg-[#F5F5F3] hover:text-[#3D8A5A] ${
                    childActive
                      ? 'bg-[#F0F7F2] font-medium text-[#3D8A5A]'
                      : 'text-[#6D6C6A]'
                  }`}
                  onClick={() => setOpen(false)}
                >
                  {child.nameKey}
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
