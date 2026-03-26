import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@letmein/db'

// POST /api/v1/admin/users/:id/suspend - 계정 정지
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const userId = BigInt(params.id)
    const body = await request.json()
    const { reason, durationDays } = body as { reason: string; durationDays: number }

    if (!reason) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'INVALID_BODY', message: '정지 사유를 입력해주세요.' },
        },
        { status: 400 },
      )
    }

    if (!durationDays || durationDays < 1) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'INVALID_BODY', message: '정지 기간을 1일 이상 입력해주세요.' },
        },
        { status: 400 },
      )
    }

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

    if (user.status === 'suspended') {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'ALREADY_SUSPENDED', message: '이미 정지된 계정입니다.' },
        },
        { status: 400 },
      )
    }

    const suspendedUntil = new Date()
    suspendedUntil.setDate(suspendedUntil.getDate() + durationDays)

    await prisma.user.update({
      where: { id: userId },
      data: {
        status: 'suspended',
        suspendedUntil,
        suspensionReason: reason,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        message: `계정이 ${durationDays}일간 정지되었습니다.`,
        suspendedUntil: suspendedUntil.toISOString(),
      },
    })
  } catch (error) {
    console.error('Failed to suspend user:', error)
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '계정 정지에 실패했습니다.' },
      },
      { status: 500 },
    )
  }
}

// DELETE /api/v1/admin/users/:id/suspend - 정지 해제 (unsuspend)
export async function DELETE(
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
