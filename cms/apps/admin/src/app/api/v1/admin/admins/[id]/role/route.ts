import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@letmein/db'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const adminId = BigInt(params.id)
    const body = await request.json()
    const { roleId } = body as { roleId: string }

    if (!roleId) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_BODY', message: '역할 ID는 필수입니다.' } },
        { status: 400 },
      )
    }

    const admin = await prisma.adminUser.findUnique({ where: { id: adminId } })
    if (!admin) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '관리자를 찾을 수 없습니다.' } },
        { status: 404 },
      )
    }

    const role = await prisma.adminRole.findUnique({ where: { id: BigInt(roleId) } })
    if (!role) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '역할을 찾을 수 없습니다.' } },
        { status: 404 },
      )
    }

    const updated = await prisma.adminUser.update({
      where: { id: adminId },
      data: { roleId: BigInt(roleId) },
      include: {
        user: { select: { id: true, email: true, nickname: true, lastLoginAt: true } },
        role: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id.toString(),
        userId: updated.userId.toString(),
        email: updated.user.email,
        nickname: updated.user.nickname,
        roleId: updated.roleId.toString(),
        roleName: updated.role.name,
        ipWhitelist: updated.ipWhitelist as string[] | null,
        totpEnabled: updated.totpEnabled,
        lastLoginAt: updated.user.lastLoginAt?.toISOString() ?? null,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      },
    })
  } catch (error) {
    console.error('Failed to change role:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '역할 변경에 실패했습니다.' } },
      { status: 500 },
    )
  }
}
