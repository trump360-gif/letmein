import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@letmein/db'

export async function GET() {
  try {
    const roles = await prisma.adminRole.findMany({
      orderBy: { createdAt: 'asc' },
      include: {
        _count: {
          select: {
            permissions: true,
            adminUsers: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: roles.map((role) => ({
        id: role.id.toString(),
        name: role.name,
        description: role.description,
        isSystem: role.isSystem,
        permissionCount: role._count.permissions,
        adminCount: role._count.adminUsers,
        createdAt: role.createdAt.toISOString(),
        updatedAt: role.updatedAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error('Failed to fetch roles:', error)
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '역할 목록을 불러오는데 실패했습니다.' },
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description } = body as { name: string; description?: string }

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'INVALID_BODY', message: '역할 이름은 필수입니다.' },
        },
        { status: 400 },
      )
    }

    const existing = await prisma.adminRole.findUnique({ where: { name } })
    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'DUPLICATE', message: '이미 존재하는 역할 이름입니다.' },
        },
        { status: 409 },
      )
    }

    const role = await prisma.adminRole.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
      },
      include: {
        _count: {
          select: { permissions: true, adminUsers: true },
        },
      },
    })

    return NextResponse.json(
      {
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
      },
      { status: 201 },
    )
  } catch (error) {
    console.error('Failed to create role:', error)
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '역할 생성에 실패했습니다.' },
      },
      { status: 500 },
    )
  }
}
