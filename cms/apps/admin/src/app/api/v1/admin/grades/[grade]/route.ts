import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@letmein/db'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { grade: string } },
) {
  try {
    const gradeNum = Number(params.grade)
    const body = await request.json()
    const { name, conditions, autoUpgrade, notifyUpgrade, storageLimitMb } = body as {
      name?: string
      conditions?: unknown
      autoUpgrade?: boolean
      notifyUpgrade?: boolean
      storageLimitMb?: number
    }

    const existing = await prisma.userGrade.findUnique({
      where: { grade: gradeNum },
    })

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: '등급을 찾을 수 없습니다.' },
        },
        { status: 404 },
      )
    }

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (conditions !== undefined) updateData.conditions = conditions
    if (autoUpgrade !== undefined) updateData.autoUpgrade = autoUpgrade
    if (notifyUpgrade !== undefined) updateData.notifyUpgrade = notifyUpgrade
    if (storageLimitMb !== undefined) updateData.storageLimitMb = storageLimitMb

    const updated = await prisma.userGrade.update({
      where: { grade: gradeNum },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      data: {
        id: Number(updated.id),
        grade: updated.grade,
        name: updated.name,
        conditions: updated.conditions,
        autoUpgrade: updated.autoUpgrade,
        notifyUpgrade: updated.notifyUpgrade,
        storageLimitMb: updated.storageLimitMb,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      },
    })
  } catch (error) {
    console.error('Failed to update grade:', error)
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '등급 설정 수정에 실패했습니다.' },
      },
      { status: 500 },
    )
  }
}
