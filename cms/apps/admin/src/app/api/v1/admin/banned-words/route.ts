import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@letmein/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))
    const search = searchParams.get('search')

    const where: Record<string, unknown> = {}

    if (search) {
      where.word = { contains: search, mode: 'insensitive' }
    }

    const [words, total] = await Promise.all([
      prisma.bannedWord.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.bannedWord.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: words.map((w) => ({
        id: w.id.toString(),
        word: w.word,
        isRegex: w.is_regex,
        createdAt: w.created_at?.toISOString() ?? null,
      })),
      meta: {
        total,
        page,
        limit,
        hasNext: page * limit < total,
      },
    })
  } catch (error) {
    console.error('Failed to fetch banned words:', error)
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '금칙어 목록을 불러오는데 실패했습니다.' },
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { word, isRegex = false } = body

    if (!word) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'INVALID_BODY', message: '필수 항목이 누락되었습니다.' },
        },
        { status: 400 },
      )
    }

    // Validate regex pattern
    if (isRegex) {
      try {
        new RegExp(word)
      } catch {
        return NextResponse.json(
          {
            success: false,
            error: { code: 'INVALID_REGEX', message: '유효하지 않은 정규식 패턴입니다.' },
          },
          { status: 400 },
        )
      }
    }

    // Check duplicate
    const existing = await prisma.bannedWord.findFirst({
      where: { word },
    })

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'DUPLICATE', message: '이미 등록된 금칙어입니다.' },
        },
        { status: 409 },
      )
    }

    const bannedWord = await prisma.bannedWord.create({
      data: {
        word,
        is_regex: isRegex,
      },
    })

    return NextResponse.json(
      {
        success: true,
        data: {
          id: bannedWord.id.toString(),
          word: bannedWord.word,
          isRegex: bannedWord.is_regex,
          createdAt: bannedWord.created_at?.toISOString() ?? null,
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error('Failed to create banned word:', error)
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '금칙어 등록에 실패했습니다.' },
      },
      { status: 500 },
    )
  }
}
