import { NextResponse } from 'next/server'
import { prisma } from '@letmein/db'

export async function GET() {
  try {
    const [settingsRows, sections] = await Promise.all([
      prisma.siteSetting.findMany({
        where: {
          key: {
            in: [
              'header_logo_icon',
              'header_logo_text',
              'footer_description',
              'footer_copyright',
              'footer_columns',
              'footer_bottom_links',
            ],
          },
        },
      }),
      prisma.homepageSection.findMany({
        orderBy: { sortOrder: 'asc' },
      }),
    ])

    const settingsMap = Object.fromEntries(settingsRows.map((s) => [s.key, s.value]))

    const header = {
      id: 'header',
      logoIcon: settingsMap['header_logo_icon'] ?? 'heart-pulse',
      logoText: settingsMap['header_logo_text'] ?? '',
      navItems: [],
      actionIcons: [],
      updatedAt: new Date().toISOString(),
    }

    const footer = {
      id: 'footer',
      description: settingsMap['footer_description'] ?? '',
      columns: safeJsonParse(settingsMap['footer_columns'], []),
      copyright: settingsMap['footer_copyright'] ?? '',
      bottomLinks: safeJsonParse(settingsMap['footer_bottom_links'], []),
      updatedAt: new Date().toISOString(),
    }

    return NextResponse.json({
      success: true,
      data: {
        header,
        footer,
        sections: sections.map(serializeSection),
      },
    })
  } catch (error) {
    console.error('Failed to fetch homepage config:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '홈페이지 설정을 불러오는데 실패했습니다.' } },
      { status: 500 },
    )
  }
}

function serializeSection(s: { id: bigint; type: string; title: string; config: unknown; sortOrder: number; isActive: boolean; updatedAt: Date }) {
  return {
    id: s.id.toString(),
    type: s.type,
    title: s.title,
    config: s.config as Record<string, unknown>,
    sortOrder: s.sortOrder,
    isActive: s.isActive,
    updatedAt: s.updatedAt.toISOString(),
  }
}

function safeJsonParse(value: string | null | undefined, fallback: unknown) {
  if (!value) return fallback
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}
