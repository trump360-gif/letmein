import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@letmein/db'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const userId = BigInt(params.id)
    const body = await request.json()
    const { grade, reason } = body as { grade: number; reason: string }

    if (grade === undefined || grade === null) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'INVALID_BODY', message: '등급을 지정해주세요.' },
        },
        { status: 400 },
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { grade: true },
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

    if (user.grade === grade) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'SAME_GRADE', message: '현재와 동일한 등급입니다.' },
        },
        { status: 400 },
      )
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { grade },
      }),
      prisma.userGradeHistory.create({
        data: {
          userId,
          fromGrade: user.grade,
          toGrade: grade,
          reason: reason || '어드민 수동 변경',
          // changedBy would be the admin user ID from session
        },
      }),
    ])

    return NextResponse.json({
      success: true,
      data: { message: '등급이 변경되었습니다.' },
    })
  } catch (error) {
    console.error('Failed to change grade:', error)
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '등급 변경에 실패했습니다.' },
      },
      { status: 500 },
    )
  }
}
