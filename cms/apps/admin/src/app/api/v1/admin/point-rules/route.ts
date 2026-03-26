import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@letmein/db'

export async function GET() {
  try {
    const rules = await prisma.pointRule.findMany({
      orderBy: { type: 'asc' },
    })

    return NextResponse.json({
      success: true,
      data: rules.map((r) => ({
        id: Number(r.id),
        type: r.type,
        amount: r.amount,
        dailyLimit: r.dailyLimit,
        minLength: r.minLength,
        isActive: r.isActive,
        updatedAt: r.updatedAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error('Failed to fetch point rules:', error)
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '포인트 규칙을 불러오는데 실패했습니다.' },
      },
      { status: 500 },
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, amount, dailyLimit, minLength, isActive } = body as {
      type: string
      amount?: number
      dailyLimit?: number | null
      minLength?: number | null
      isActive?: boolean
    }

    if (!type) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'INVALID_BODY', message: '규칙 타입을 지정해주세요.' },
        },
        { status: 400 },
      )
    }

    const existing = await prisma.pointRule.findUnique({
      where: { type },
    })

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: '포인트 규칙을 찾을 수 없습니다.' },
        },
        { status: 404 },
      )
    }

    const updateData: Record<string, unknown> = {}
    if (amount !== undefined) updateData.amount = amount
    if (dailyLimit !== undefined) updateData.dailyLimit = dailyLimit
    if (minLength !== undefined) updateData.minLength = minLength
    if (isActive !== undefined) updateData.isActive = isActive

    const updated = await prisma.pointRule.update({
      where: { type },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      data: {
        id: Number(updated.id),
        type: updated.type,
        amount: updated.amount,
        dailyLimit: updated.dailyLimit,
        minLength: updated.minLength,
        isActive: updated.isActive,
        updatedAt: updated.updatedAt.toISOString(),
      },
    })
  } catch (error) {
    console.error('Failed to update point rule:', error)
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '포인트 규칙 수정에 실패했습니다.' },
      },
      { status: 500 },
    )
  }
}
