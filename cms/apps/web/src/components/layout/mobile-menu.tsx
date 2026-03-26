'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, ChevronDown } from 'lucide-react'
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle } from '@letmein/ui'

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

interface MobileMenuProps {
  menus: MenuData[]
  logoText: string
}

export function MobileMenu({ menus, logoText }: MobileMenuProps) {
  const [open, setOpen] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const pathname = usePathname()

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          className="lg:hidden rounded-md p-2 text-[#6D6C6A] hover:bg-[#F5F5F3]"
          aria-label="메뉴 열기"
        >
          <Menu className="h-6 w-6" />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] p-0">
        <SheetHeader className="border-b px-5 py-4">
          <SheetTitle className="text-left text-lg font-bold">{logoText}</SheetTitle>
        </SheetHeader>

        <nav className="flex flex-col py-2" aria-label="모바일 메뉴">
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className={`px-5 py-3 text-sm font-medium transition-colors ${
              pathname === '/'
                ? 'bg-[#F0F7F2] text-[#3D8A5A]'
                : 'text-[#1A1918] hover:bg-[#F5F5F3]'
            }`}
          >
            홈
          </Link>

          {menus.map((menu) => {
            const hasChildren = menu.children.length > 0
            const menuActive = isActive(menu.href) || menu.children.some((c) => isActive(c.href))
            const isExpanded = expandedId === menu.id

            if (!hasChildren) {
              return (
                <Link
                  key={menu.id}
                  href={menu.href}
                  target={menu.openNewTab ? '_blank' : undefined}
                  onClick={() => setOpen(false)}
                  className={`px-5 py-3 text-sm font-medium transition-colors ${
                    menuActive
                      ? 'bg-[#F0F7F2] text-[#3D8A5A]'
                      : 'text-[#1A1918] hover:bg-[#F5F5F3]'
                  }`}
                >
                  {menu.nameKey}
                </Link>
              )
            }

            return (
              <div key={menu.id}>
                <button
                  onClick={() => toggleExpand(menu.id)}
                  className={`flex w-full items-center justify-between px-5 py-3 text-sm font-medium transition-colors ${
                    menuActive
                      ? 'text-[#3D8A5A]'
                      : 'text-[#1A1918] hover:bg-[#F5F5F3]'
                  }`}
                  aria-expanded={isExpanded}
                >
                  {menu.nameKey}
                  <ChevronDown
                    className={`h-4 w-4 transition-transform duration-200 ${
                      isExpanded ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {isExpanded && (
                  <div className="bg-[#FAFAF9]">
                    {menu.children.map((child) => (
                      <Link
                        key={child.id}
                        href={child.href}
                        target={child.openNewTab ? '_blank' : undefined}
                        onClick={() => setOpen(false)}
                        className={`block py-2.5 pl-9 pr-5 text-sm transition-colors ${
                          isActive(child.href)
                            ? 'font-medium text-[#3D8A5A]'
                            : 'text-[#6D6C6A] hover:text-[#1A1918]'
                        }`}
                      >
                        {child.nameKey}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </nav>
      </SheetContent>
    </Sheet>
  )
}
