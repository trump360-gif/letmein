import Link from 'next/link'
import { Search, Bell } from 'lucide-react'
import { prisma } from '@letmein/db'
import { GnbTabs } from './gnb-tabs'
import { getSession } from '@/lib/auth'
import { AuthButton } from './auth-button'
import { SidebarToggle } from '@/components/demo/sidebar-toggle'

export async function SiteHeader() {
  const [menus, session] = await Promise.all([
    prisma.menu.findMany({
    where: { location: 'gnb', isVisible: true, parentId: null },
    orderBy: { sortOrder: 'asc' },
    select: {
      id: true,
      nameKey: true,
      linkType: true,
      linkUrl: true,
      board: { select: { slug: true } },
    },
      take: 10,
    }).catch(() => []),
    getSession(),
  ])

  function getHref(menu: { linkType: string; linkUrl: string | null; board: { slug: string } | null }) {
    if (menu.linkType === 'board' && menu.board) return `/${menu.board.slug}`
    if (menu.linkUrl) return menu.linkUrl
    return '#'
  }

  return (
    <header className="w-full">
      {/* Top bar */}
      <div className="flex h-[56px] md:h-[64px] items-center justify-between bg-[#0A0A0A] pl-4 pr-4 md:pl-[60px] md:pr-3">
        {/* Logo */}
        <Link
          href="/"
          className="text-[20px] md:text-[22px] font-semibold tracking-[0.15em] text-white"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          BEAUTI
        </Link>

        {/* Desktop: search bar */}
        <form
          action="/search"
          method="GET"
          className="hidden md:flex w-[420px] items-center gap-3 rounded-sm bg-[#1A1A1A] px-4 py-2.5 focus-within:bg-[#222222]"
        >
          <Search className="h-4 w-4 shrink-0 text-[#666666]" aria-hidden="true" />
          <input
            name="q"
            type="search"
            placeholder="성형 후기, 병원, 시술 검색..."
            className="flex-1 bg-transparent text-[13px] text-white placeholder:text-[#555555] outline-none"
            autoComplete="off"
          />
        </form>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Mobile: search icon → goes to /search page */}
          <Link
            href="/search"
            className="flex md:hidden h-9 w-9 items-center justify-center rounded-sm text-[#999999] hover:text-white"
            aria-label="검색"
          >
            <Search className="h-5 w-5" />
          </Link>
          {/* Bell — desktop only */}
          <button className="hidden md:flex h-9 w-9 items-center justify-center rounded-sm bg-[#1A1A1A] text-[#999999] hover:text-white">
            <Bell className="h-4 w-4" aria-hidden="true" />
          </button>
          {/* Auth */}
          <AuthButton user={session ? { nickname: session.nickname } : null} />
          {/* Bot sidebar toggle */}
          <SidebarToggle />
        </div>
      </div>

      {/* GNB tabs — handles both desktop and mobile */}
      <GnbTabs menus={menus.map((m) => ({ id: String(m.id), nameKey: m.nameKey, href: getHref(m) }))} />
    </header>
  )
}
