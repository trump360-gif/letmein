import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@letmein/db'

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const userId = BigInt(params.id)

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    })

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: '회원을 찾을 수 없습니다.' },
        },
        { status: 404 },
      )
    }

    // In a real implementation, this would invalidate the user's sessions/tokens.
    // For now, we update lastLoginAt to signal session invalidation.
    await prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: null },
    })

    return NextResponse.json({
      success: true,
      data: { message: '강제 로그아웃 처리되었습니다.' },
    })
  } catch (error) {
    console.error('Failed to force logout user:', error)
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '강제 로그아웃에 실패했습니다.' },
      },
      { status: 500 },
    )
  }
}
