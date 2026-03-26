import { cache } from 'react'
import { prisma } from '@letmein/db'

export const getBoard = cache(async (slug: string) => {
  return prisma.board.findUnique({ where: { slug, deletedAt: null } })
})

export const getBoardMeta = cache(async (slug: string) => {
  return prisma.board.findUnique({
    where: { slug, deletedAt: null },
    select: { id: true, nameKey: true, description: true },
  })
})

export const getHomepageSections = cache(async () => {
  return prisma.homepageSection.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  })
})

export const getHeaderSettings = cache(async () => {
  const settings = await prisma.siteSetting.findMany({
    where: { key: { in: ['header_logo_icon', 'header_logo_text', 'header_logo_image'] } },
  })
  const map = Object.fromEntries(settings.map((s) => [s.key, s.value]))
  return {
    logoIcon: map['header_logo_icon'] ?? 'heart-pulse',
    logoText: map['header_logo_text'] ?? '뷰티클리닉',
    logoImageUrl: map['header_logo_image'] ?? '',
  }
})

export const getGnbMenus = cache(async () => {
  return prisma.menu.findMany({
    where: { location: 'gnb', isVisible: true, parentId: null },
    orderBy: { sortOrder: 'asc' },
    select: {
      id: true,
      nameKey: true,
      linkType: true,
      linkUrl: true,
      openNewTab: true,
      board: { select: { slug: true } },
      children: {
        where: { isVisible: true },
        orderBy: { sortOrder: 'asc' },
        select: {
          id: true,
          nameKey: true,
          linkType: true,
          linkUrl: true,
          openNewTab: true,
          board: { select: { slug: true } },
        },
      },
    },
    take: 10,
  })
})
