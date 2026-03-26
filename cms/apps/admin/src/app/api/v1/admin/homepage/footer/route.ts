import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@letmein/db'

const FOOTER_KEYS = [
  'footer_description',
  'footer_copyright',
  'footer_columns',
  'footer_bottom_links',
] as const

export async function GET() {
  try {
    const settings = await prisma.siteSetting.findMany({
      where: { key: { in: [...FOOTER_KEYS] } },
    })
    const map = Object.fromEntries(settings.map((s) => [s.key, s.value]))

    return NextResponse.json({
      success: true,
      data: {
        id: 'footer',
        description: map['footer_description'] ?? '',
        columns: safeJsonParse(map['footer_columns'], []),
        copyright: map['footer_copyright'] ?? '',
        bottomLinks: safeJsonParse(map['footer_bottom_links'], []),
        updatedAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('Failed to fetch footer:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '푸터 설정을 불러오는데 실패했습니다.' } },
      { status: 500 },
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { description, columns, copyright, bottomLinks } = body as {
      description?: string
      columns?: unknown[]
      copyright?: string
      bottomLinks?: unknown[]
    }

    const updates: { key: string; value: string; valueType: string }[] = []
    if (description !== undefined) updates.push({ key: 'footer_description', value: description, valueType: 'string' })
    if (copyright !== undefined) updates.push({ key: 'footer_copyright', value: copyright, valueType: 'string' })
    if (columns !== undefined) updates.push({ key: 'footer_columns', value: JSON.stringify(columns), valueType: 'json' })
    if (bottomLinks !== undefined) updates.push({ key: 'footer_bottom_links', value: JSON.stringify(bottomLinks), valueType: 'json' })

    if (updates.length > 0) {
      await prisma.$transaction(
        updates.map((u) =>
          prisma.siteSetting.upsert({
            where: { key: u.key },
            update: { value: u.value },
            create: { key: u.key, value: u.value, valueType: u.valueType },
          }),
        ),
      )
    }

    const settings = await prisma.siteSetting.findMany({
      where: { key: { in: [...FOOTER_KEYS] } },
    })
    const map = Object.fromEntries(settings.map((s) => [s.key, s.value]))

    return NextResponse.json({
      success: true,
      data: {
        id: 'footer',
        description: map['footer_description'] ?? '',
        columns: safeJsonParse(map['footer_columns'], []),
        copyright: map['footer_copyright'] ?? '',
        bottomLinks: safeJsonParse(map['footer_bottom_links'], []),
        updatedAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('Failed to update footer:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '푸터 설정 저장에 실패했습니다.' } },
      { status: 500 },
    )
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
