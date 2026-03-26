import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@letmein/db'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const id = BigInt(params.id)

    const term = await prisma.terms.findUnique({
      where: { id },
      include: {
        agreements: {
          select: { id: true },
        },
      },
    })

    if (!term) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: '약관을 찾을 수 없습니다.' },
        },
        { status: 404 },
      )
    }

    return NextResponse.json({
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
        agreementCount: term.agreements.length,
      },
    })
  } catch (error) {
    console.error('Failed to fetch term:', error)
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '약관 상세를 불러오는데 실패했습니다.' },
      },
      { status: 500 },
    )
  }
}
