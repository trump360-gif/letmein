import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@letmein/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '50', 10)

    const where = search
      ? {
          OR: [
            { key: { contains: search, mode: 'insensitive' as const } },
            { ko: { contains: search, mode: 'insensitive' as const } },
            { en: { contains: search, mode: 'insensitive' as const } },
            { ja: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}

    const [translations, total] = await Promise.all([
      prisma.translation.findMany({
        where,
        orderBy: { key: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.translation.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        translations: translations.map((t) => ({
          id: t.id.toString(),
          key: t.key,
          ko: t.ko,
          ja: t.ja,
          en: t.en,
          createdAt: t.createdAt.toISOString(),
          updatedAt: t.updatedAt.toISOString(),
        })),
        total,
      },
      meta: {
        total,
        page,
        limit,
        hasNext: page * limit < total,
      },
    })
  } catch (error) {
    console.error('Failed to fetch translations:', error)
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '번역 목록을 불러오는데 실패했습니다.' },
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { key, ko, ja, en } = body

    if (!key || !ko) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'INVALID_BODY', message: '키와 한국어 값은 필수입니다.' },
        },
        { status: 400 },
      )
    }

    const existing = await prisma.translation.findUnique({ where: { key } })
    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'DUPLICATE_KEY', message: '이미 존재하는 키입니다.' },
        },
        { status: 409 },
      )
    }

    const translation = await prisma.translation.create({
      data: { key, ko, ja: ja || null, en: en || null },
    })

    return NextResponse.json(
      {
        success: true,
        data: {
          id: translation.id.toString(),
          key: translation.key,
          ko: translation.ko,
          ja: translation.ja,
          en: translation.en,
          createdAt: translation.createdAt.toISOString(),
          updatedAt: translation.updatedAt.toISOString(),
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error('Failed to create translation:', error)
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '번역 등록에 실패했습니다.' },
      },
      { status: 500 },
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ko, ja, en } = body

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'INVALID_BODY', message: 'ID는 필수입니다.' },
        },
        { status: 400 },
      )
    }

    const data: Record<string, string | null> = {}
    if (ko !== undefined) data.ko = ko
    if (ja !== undefined) data.ja = ja || null
    if (en !== undefined) data.en = en || null

    const translation = await prisma.translation.update({
      where: { id: BigInt(id) },
      data,
    })

    return NextResponse.json({
      success: true,
      data: {
        id: translation.id.toString(),
        key: translation.key,
        ko: translation.ko,
        ja: translation.ja,
        en: translation.en,
        createdAt: translation.createdAt.toISOString(),
        updatedAt: translation.updatedAt.toISOString(),
      },
    })
  } catch (error) {
    console.error('Failed to update translation:', error)
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '번역 수정에 실패했습니다.' },
      },
      { status: 500 },
    )
  }
}
