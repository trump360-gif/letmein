import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@letmein/db'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const roleId = BigInt(params.id)

    const role = await prisma.adminRole.findUnique({ where: { id: roleId } })
    if (!role) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '역할을 찾을 수 없습니다.' } },
        { status: 404 },
      )
    }

    const permissions = await prisma.adminRolePermission.findMany({
      where: { roleId },
      orderBy: { module: 'asc' },
    })

    return NextResponse.json({
      success: true,
      data: permissions.map((p) => ({
        id: p.id.toString(),
        roleId: p.roleId.toString(),
        module: p.module,
        canRead: p.canRead,
        canWrite: p.canWrite,
        canDelete: p.canDelete,
        boardId: p.boardId?.toString() ?? null,
      })),
    })
  } catch (error) {
    console.error('Failed to fetch permissions:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '권한을 불러오는데 실패했습니다.' } },
      { status: 500 },
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const roleId = BigInt(params.id)
    const body = await request.json()
    const { permissions } = body as {
      permissions: Array<{
        module: string
        canRead: boolean
        canWrite: boolean
        canDelete: boolean
        boardId?: string | null
      }>
    }

    if (!permissions || !Array.isArray(permissions)) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_BODY', message: '잘못된 요청 형식입니다.' } },
        { status: 400 },
      )
    }

    const role = await prisma.adminRole.findUnique({ where: { id: roleId } })
    if (!role) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '역할을 찾을 수 없습니다.' } },
        { status: 404 },
      )
    }

    // Replace all permissions for this role
    await prisma.$transaction([
      prisma.adminRolePermission.deleteMany({ where: { roleId } }),
      ...permissions.map((p) =>
        prisma.adminRolePermission.create({
          data: {
            roleId,
            module: p.module,
            canRead: p.canRead,
            canWrite: p.canWrite,
            canDelete: p.canDelete,
            boardId: p.boardId ? BigInt(p.boardId) : null,
          },
        }),
      ),
    ])

    const updated = await prisma.adminRolePermission.findMany({
      where: { roleId },
      orderBy: { module: 'asc' },
    })

    return NextResponse.json({
      success: true,
      data: updated.map((p) => ({
        id: p.id.toString(),
        roleId: p.roleId.toString(),
        module: p.module,
        canRead: p.canRead,
        canWrite: p.canWrite,
        canDelete: p.canDelete,
        boardId: p.boardId?.toString() ?? null,
      })),
    })
  } catch (error) {
    console.error('Failed to update permissions:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '권한 수정에 실패했습니다.' } },
      { status: 500 },
    )
  }
}
