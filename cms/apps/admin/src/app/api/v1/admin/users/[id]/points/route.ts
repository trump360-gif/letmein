import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@letmein/db'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const userId = BigInt(params.id)
    const body = await request.json()
    const { amount, type, note, expiresAt } = body as {
      amount: number
      type: 'admin_give' | 'admin_deduct'
      note: string
      expiresAt?: string
    }

    if (!amount || amount === 0) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'INVALID_BODY', message: '포인트 수량을 입력해주세요.' },
        },
        { status: 400 },
      )
    }

    if (!type || !['admin_give', 'admin_deduct'].includes(type)) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'INVALID_BODY', message: '유효하지 않은 포인트 타입입니다.' },
        },
        { status: 400 },
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { points: true },
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

    const actualAmount = type === 'admin_deduct' ? -Math.abs(amount) : Math.abs(amount)
    const newBalance = user.points + actualAmount

    if (newBalance < 0) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'INSUFFICIENT_POINTS', message: '포인트가 부족합니다.' },
        },
        { status: 400 },
      )
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { points: newBalance },
      }),
      prisma.point.create({
        data: {
          userId,
          amount: actualAmount,
          balance: newBalance,
          type,
          note: note || (type === 'admin_give' ? '어드민 지급' : '어드민 차감'),
          expiresAt: expiresAt ? new Date(expiresAt) : null,
        },
      }),
    ])

    return NextResponse.json({
      success: true,
      data: { message: '포인트가 처리되었습니다.', balance: newBalance },
    })
  } catch (error) {
    console.error('Failed to process points:', error)
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '포인트 처리에 실패했습니다.' },
      },
      { status: 500 },
    )
  }
}
