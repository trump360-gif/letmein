import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@letmein/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    const where = type ? { type } : {}

    const terms = await prisma.terms.findMany({
      where,
      orderBy: [{ type: 'asc' }, { createdAt: 'desc' }],
    })

    return NextResponse.json({
      success: true,
      data: {
        terms: terms.map((t) => ({
          id: t.id.toString(),
          type: t.type,
          version: t.version,
          title: t.title,
          content: t.content,
          isRequired: t.isRequired,
          enforcedAt: t.enforcedAt.toISOString(),
          createdAt: t.createdAt.toISOString(),
        })),
      },
    })
  } catch (error) {
    console.error('Failed to fetch terms:', error)
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '약관 목록을 불러오는데 실패했습니다.' },
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, version, title, content, isRequired, enforcedAt } = body

    if (!type || !version || !title || !content || !enforcedAt) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'INVALID_BODY', message: '필수 항목이 누락되었습니다.' },
        },
        { status: 400 },
      )
    }

    const term = await prisma.terms.create({
      data: {
        type,
        version,
        title,
        content,
        isRequired: isRequired ?? true,
        enforcedAt: new Date(enforcedAt),
      },
    })

    return NextResponse.json(
      {
        success: true,
        data: {
          id: term.id.toString(),
          type: term.type,
          version: term.version,
          title: term.title,
          content: term.content,
          isRequired: term.isRequired,
          enforcedAt: term.enforcedAt.toISOString(),
          createdAt: term.createdAt.toISOString(),
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error('Failed to create terms:', error)
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '약관 등록에 실패했습니다.' },
      },
      { status: 500 },
    )
  }
}
