'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'

interface GnbTab {
  id: string
  nameKey: string
  href: string
}

export function GnbTabs({ menus }: { menus: GnbTab[] }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* Desktop GNB — hidden on mobile */}
      <div className="hidden md:flex h-[44px] items-center bg-[#111111] px-[60px]">
        {menus.map((menu) => {
          const isActive = menu.href !== '/' && pathname.startsWith(menu.href)
          return (
            <Link
              key={menu.id}
              href={menu.href}
              className={`rounded-sm px-4 py-1.5 text-[13px] font-medium transition-colors ${
                isActive
                  ? 'bg-white/15 text-white'
                  : 'text-[#AAAAAA] hover:bg-white/10 hover:text-white'
              }`}
            >
              {menu.nameKey}
            </Link>
          )
        })}
      </div>

      {/* Mobile GNB — horizontal scrollable + hamburger */}
      <div className="flex md:hidden h-[44px] items-center bg-[#111111]">
        {/* Hamburger */}
        <button
          onClick={() => setMobileOpen(true)}
          className="flex h-full w-[44px] shrink-0 items-center justify-center text-white/70 hover:text-white"
          aria-label="메뉴 열기"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Scrollable category tabs */}
        <div
          className="flex flex-1 items-center overflow-x-auto"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {menus.map((menu) => {
            const isActive = menu.href !== '/' && pathname.startsWith(menu.href)
            return (
              <Link
                key={menu.id}
                href={menu.href}
                className={`shrink-0 px-3 py-1.5 text-[12px] font-medium whitespace-nowrap transition-colors ${
                  isActive ? 'text-white' : 'text-[#777777]'
                }`}
              >
                {menu.nameKey}
              </Link>
            )
          })}
        </div>
      </div>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[100] md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer */}
          <div className="absolute inset-y-0 left-0 flex w-[280px] flex-col bg-[#0A0A0A]">
            {/* Drawer header */}
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <span
                className="text-[20px] font-semibold tracking-[0.15em] text-white"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                BEAUTI
              </span>
              <button
                onClick={() => setMobileOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-sm text-white/60 hover:text-white"
                aria-label="메뉴 닫기"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {/* Nav items */}
            <nav className="flex flex-col overflow-y-auto py-1">
              {menus.map((menu) => {
                const isActive = menu.href !== '/' && pathname.startsWith(menu.href)
                return (
                  <Link
                    key={menu.id}
                    href={menu.href}
                    onClick={() => setMobileOpen(false)}
                    className={`border-b border-white/5 px-6 py-4 text-[15px] font-medium transition-colors ${
                      isActive
                        ? 'bg-white/10 text-white'
                        : 'text-white/60 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {menu.nameKey}
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>
      )}
    </>
  )
}
