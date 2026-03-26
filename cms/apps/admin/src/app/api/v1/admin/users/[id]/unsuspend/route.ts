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
      select: { status: true },
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

    if (user.status !== 'suspended') {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_SUSPENDED', message: '정지 상태가 아닌 계정입니다.' },
        },
        { status: 400 },
      )
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        status: 'active',
        suspendedUntil: null,
        suspensionReason: null,
      },
    })

    return NextResponse.json({
      success: true,
      data: { message: '정지가 해제되었습니다.' },
    })
  } catch (error) {
    console.error('Failed to unsuspend user:', error)
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '정지 해제에 실패했습니다.' },
      },
      { status: 500 },
    )
  }
}
