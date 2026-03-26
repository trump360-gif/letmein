import Link from 'next/link'
import { HeartPulse } from 'lucide-react'
import { prisma } from '@letmein/db'

export async function SiteFooter() {
  const [footerMenus, settings] = await Promise.all([
    prisma.menu.findMany({
      where: { location: 'footer', isVisible: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        parentId: true,
        nameKey: true,
        linkType: true,
        linkUrl: true,
        openNewTab: true,
        board: { select: { slug: true } },
      },
    }),
    prisma.siteSetting.findMany({
      where: {
        key: {
          in: [
            'footer_description',
            'footer_copyright',
            'footer_bottom_links',
            'footer_contact_title',
            'footer_contact_items',
          ],
        },
      },
    }),
  ])

  const settingMap = Object.fromEntries(settings.map((s) => [s.key, s.value]))

  const description =
    settingMap['footer_description'] ??
    '성형 후기, 병원 정보, 시술 상담까지 — BEAUTI에서 나에게 맞는 정보를 찾아보세요.'
  const copyright = settingMap['footer_copyright'] ?? '© 2026 BEAUTI All Rights Reserved.'

  let bottomLinks: { label: string; href: string }[] = []
  try {
    bottomLinks = JSON.parse(settingMap['footer_bottom_links'] ?? '[]')
  } catch {
    bottomLinks = [
      { label: '개인정보처리방침', href: '/privacy' },
      { label: '이용약관', href: '/terms' },
    ]
  }

  const contactTitle = settingMap['footer_contact_title'] ?? '문의하기'
  let contactItems: string[] = []
  try {
    contactItems = JSON.parse(settingMap['footer_contact_items'] ?? '[]')
  } catch {
    contactItems = ['TEL: 03-1234-5678', '접수: 10:00~19:00', '휴진일: 수요일·공휴일']
  }

  const parentMenus = footerMenus.filter((m) => !m.parentId)
  const childMap = new Map<string, typeof footerMenus>()
  for (const menu of footerMenus) {
    if (menu.parentId) {
      const key = String(menu.parentId)
      if (!childMap.has(key)) childMap.set(key, [])
      childMap.get(key)!.push(menu)
    }
  }

  function getHref(menu: (typeof footerMenus)[number]) {
    if (menu.linkType === 'board' && menu.board) return `/${menu.board.slug}`
    if (menu.linkUrl) return menu.linkUrl
    return '#'
  }

  return (
    <footer className="bg-[#1A1918]">
      <div className="mx-auto max-w-[1200px] px-6 pb-8 pt-14 lg:px-10">
        <div className="mb-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* 브랜드 */}
          <div className="space-y-4 lg:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#3D8A5A]">
                <HeartPulse className="h-4 w-4 text-white" />
              </div>
              <span className="text-[15px] font-bold text-white" style={{ fontFamily: "'Cormorant Garamond', serif", letterSpacing: '0.15em' }}>BEAUTI</span>
            </div>
            <p className="text-[13px] leading-relaxed text-white/50">{description}</p>
          </div>

          {/* 메뉴 컬럼 */}
          {parentMenus.map((parent) => {
            const children = childMap.get(String(parent.id)) ?? []
            return (
              <div key={String(parent.id)} className="space-y-4">
                <h4 className="text-[13px] font-bold tracking-wide text-white/80">{parent.nameKey}</h4>
                <ul className="space-y-2.5">
                  {children.map((child) => (
                    <li key={String(child.id)}>
                      <Link
                        href={getHref(child)}
                        target={child.openNewTab ? '_blank' : undefined}
                        className="text-[13px] text-white/40 transition-colors hover:text-white/70"
                      >
                        {child.nameKey}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}

          {/* 연락처 */}
          {contactItems.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-[13px] font-bold tracking-wide text-white/80">{contactTitle}</h4>
              <ul className="space-y-2.5">
                {contactItems.map((item, i) => (
                  <li key={i} className="text-[13px] text-white/40">{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <hr className="mb-6 border-white/10" />

        <div className="flex flex-col items-center justify-between gap-3 text-[11px] text-white/30 sm:flex-row">
          <span>{copyright}</span>
          <div className="flex gap-6">
            {bottomLinks.map((link, i) => (
              <Link key={i} href={link.href} className="transition-colors hover:text-white/50">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
