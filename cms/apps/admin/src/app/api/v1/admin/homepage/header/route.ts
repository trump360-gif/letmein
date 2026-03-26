import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@letmein/db'

const HEADER_KEYS = ['header_logo_icon', 'header_logo_text', 'header_logo_image'] as const

export async function GET() {
  try {
    const settings = await prisma.siteSetting.findMany({
      where: { key: { in: [...HEADER_KEYS] } },
    })
    const map = Object.fromEntries(settings.map((s) => [s.key, s.value]))

    const menus = await prisma.menu.findMany({
      where: { location: 'gnb', parentId: null, isVisible: true },
      orderBy: { sortOrder: 'asc' },
      take: 10,
    })

    return NextResponse.json({
      success: true,
      data: {
        id: 'header',
        logoIcon: map['header_logo_icon'] ?? 'heart-pulse',
        logoText: map['header_logo_text'] ?? '',
        logoImageUrl: map['header_logo_image'] ?? '',
        navItems: menus.map((m) => ({
          id: m.id.toString(),
          label: m.nameKey,
          href: m.linkUrl ?? `/${m.boardId ?? ''}`,
          isActive: m.isVisible,
          sortOrder: m.sortOrder,
        })),
        actionIcons: ['search'],
        updatedAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('Failed to fetch header:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '헤더 설정을 불러오는데 실패했습니다.' } },
      { status: 500 },
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { logoIcon, logoText, logoImageUrl } = body as { logoIcon?: string; logoText?: string; logoImageUrl?: string }

    const updates: { key: string; value: string }[] = []
    if (logoIcon !== undefined) updates.push({ key: 'header_logo_icon', value: logoIcon })
    if (logoText !== undefined) updates.push({ key: 'header_logo_text', value: logoText })
    if (logoImageUrl !== undefined) updates.push({ key: 'header_logo_image', value: logoImageUrl })

    if (updates.length > 0) {
      await prisma.$transaction(
        updates.map((u) =>
          prisma.siteSetting.upsert({
            where: { key: u.key },
            update: { value: u.value },
            create: { key: u.key, value: u.value, valueType: 'string' },
          }),
        ),
      )
    }

    const settings = await prisma.siteSetting.findMany({
      where: { key: { in: [...HEADER_KEYS] } },
    })
    const map = Object.fromEntries(settings.map((s) => [s.key, s.value]))

    return NextResponse.json({
      success: true,
      data: {
        id: 'header',
        logoIcon: map['header_logo_icon'] ?? 'heart-pulse',
        logoText: map['header_logo_text'] ?? '',
        logoImageUrl: map['header_logo_image'] ?? '',
        navItems: [],
        actionIcons: ['search'],
        updatedAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('Failed to update header:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '헤더 설정 저장에 실패했습니다.' } },
      { status: 500 },
    )
  }
}
