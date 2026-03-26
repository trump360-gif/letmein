import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@letmein/db'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const wordId = BigInt(id)

    const word = await prisma.bannedWord.findUnique({
      where: { id: wordId },
    })

    if (!word) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: '금칙어를 찾을 수 없습니다.' },
        },
        { status: 404 },
      )
    }

    await prisma.bannedWord.delete({
      where: { id: wordId },
    })

    return NextResponse.json({
      success: true,
      data: { message: '금칙어가 삭제되었습니다.' },
    })
  } catch (error) {
    console.error('Failed to delete banned word:', error)
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '금칙어 삭제에 실패했습니다.' },
      },
      { status: 500 },
    )
  }
}
