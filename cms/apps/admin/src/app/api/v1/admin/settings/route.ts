import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@letmein/db'

export async function GET() {
  try {
    const settings = await prisma.siteSetting.findMany({
      orderBy: { key: 'asc' },
    })

    return NextResponse.json({
      success: true,
      data: {
        settings: settings.map((s) => ({
          id: s.id.toString(),
          key: s.key,
          value: s.value,
          valueType: s.value_type,
          description: s.description,
          updatedAt: s.updated_at?.toISOString() ?? null,
        })),
      },
    })
  } catch (error) {
    console.error('Failed to fetch settings:', error)
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '설정을 불러오는데 실패했습니다.' },
      },
      { status: 500 },
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { settings } = body as {
      settings: Array<{ key: string; value: string | null }>
    }

    if (!settings || !Array.isArray(settings)) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'INVALID_BODY', message: '잘못된 요청 형식입니다.' },
        },
        { status: 400 },
      )
    }

    const results = await prisma.$transaction(
      settings.map((s) =>
        prisma.siteSetting.upsert({
          where: { key: s.key },
          update: { value: s.value },
          create: {
            key: s.key,
            value: s.value,
            value_type: typeof s.value === 'string' ? 'string' : 'json',
          },
        }),
      ),
    )

    return NextResponse.json({
      success: true,
      data: {
        settings: results.map((s) => ({
          id: s.id.toString(),
          key: s.key,
          value: s.value,
          valueType: s.value_type,
          description: s.description,
          updatedAt: s.updated_at?.toISOString() ?? null,
        })),
      },
    })
  } catch (error) {
    console.error('Failed to update settings:', error)
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '설정 저장에 실패했습니다.' },
      },
      { status: 500 },
    )
  }
}
