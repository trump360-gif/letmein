import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@letmein/db'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const roleId = BigInt(params.id)
    const body = await request.json()
    const { name, description } = body as { name?: string; description?: string }

    const existing = await prisma.adminRole.findUnique({ where: { id: roleId } })
    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '역할을 찾을 수 없습니다.' } },
        { status: 404 },
      )
    }

    if (existing.isSystem) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: '시스템 역할은 수정할 수 없습니다.' } },
        { status: 403 },
      )
    }

    if (name) {
      const duplicate = await prisma.adminRole.findFirst({
        where: { name, id: { not: roleId } },
      })
      if (duplicate) {
        return NextResponse.json(
          { success: false, error: { code: 'DUPLICATE', message: '이미 존재하는 역할 이름입니다.' } },
          { status: 409 },
        )
      }
    }

    const role = await prisma.adminRole.update({
      where: { id: roleId },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
      },
      include: {
        _count: { select: { permissions: true, adminUsers: true } },
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        id: role.id.toString(),
        name: role.name,
        description: role.description,
        isSystem: role.isSystem,
        permissionCount: role._count.permissions,
        adminCount: role._count.adminUsers,
        createdAt: role.createdAt.toISOString(),
        updatedAt: role.updatedAt.toISOString(),
      },
    })
  } catch (error) {
    console.error('Failed to update role:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '역할 수정에 실패했습니다.' } },
      { status: 500 },
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const roleId = BigInt(params.id)

    const existing = await prisma.adminRole.findUnique({
      where: { id: roleId },
      include: { _count: { select: { adminUsers: true } } },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '역할을 찾을 수 없습니다.' } },
        { status: 404 },
      )
    }

    if (existing.isSystem) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: '시스템 역할은 삭제할 수 없습니다.' } },
        { status: 403 },
      )
    }

    if (existing._count.adminUsers > 0) {
      return NextResponse.json(
        { success: false, error: { code: 'HAS_USERS', message: '이 역할을 사용하는 관리자가 있어 삭제할 수 없습니다.' } },
        { status: 400 },
      )
    }

    await prisma.$transaction([
      prisma.adminRolePermission.deleteMany({ where: { roleId } }),
      prisma.adminRole.delete({ where: { id: roleId } }),
    ])

    return NextResponse.json({ success: true, data: null })
  } catch (error) {
    console.error('Failed to delete role:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '역할 삭제에 실패했습니다.' } },
      { status: 500 },
    )
  }
}
