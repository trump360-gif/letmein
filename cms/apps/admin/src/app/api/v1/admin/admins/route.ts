import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@letmein/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, Number(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || '20')))

    const [admins, total] = await Promise.all([
      prisma.adminUser.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              nickname: true,
              lastLoginAt: true,
            },
          },
          role: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.adminUser.count(),
    ])

    return NextResponse.json({
      success: true,
      data: admins.map((a) => ({
        id: a.id.toString(),
        userId: a.userId.toString(),
        email: a.user.email,
        nickname: a.user.nickname,
        roleId: a.roleId.toString(),
        roleName: a.role.name,
        ipWhitelist: a.ipWhitelist as string[] | null,
        totpEnabled: a.totpEnabled,
        lastLoginAt: a.user.lastLoginAt?.toISOString() ?? null,
        createdAt: a.createdAt.toISOString(),
        updatedAt: a.updatedAt.toISOString(),
      })),
      meta: {
        total,
        page,
        limit,
        hasNext: page * limit < total,
      },
    })
  } catch (error) {
    console.error('Failed to fetch admins:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '관리자 목록을 불러오는데 실패했습니다.' } },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, roleId } = body as { userId: number; roleId: string }

    if (!userId || !roleId) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_BODY', message: '사용자 ID와 역할 ID는 필수입니다.' } },
        { status: 400 },
      )
    }

    const user = await prisma.user.findUnique({ where: { id: BigInt(userId) } })
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '사용자를 찾을 수 없습니다.' } },
        { status: 404 },
      )
    }

    const existingAdmin = await prisma.adminUser.findUnique({ where: { userId: BigInt(userId) } })
    if (existingAdmin) {
      return NextResponse.json(
        { success: false, error: { code: 'DUPLICATE', message: '이미 관리자로 등록된 사용자입니다.' } },
        { status: 409 },
      )
    }

    const role = await prisma.adminRole.findUnique({ where: { id: BigInt(roleId) } })
    if (!role) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '역할을 찾을 수 없습니다.' } },
        { status: 404 },
      )
    }

    const admin = await prisma.adminUser.create({
      data: {
        userId: BigInt(userId),
        roleId: BigInt(roleId),
      },
      include: {
        user: { select: { id: true, email: true, nickname: true, lastLoginAt: true } },
        role: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json(
      {
        success: true,
        data: {
          id: admin.id.toString(),
          userId: admin.userId.toString(),
          email: admin.user.email,
          nickname: admin.user.nickname,
          roleId: admin.roleId.toString(),
          roleName: admin.role.name,
          ipWhitelist: admin.ipWhitelist as string[] | null,
          totpEnabled: admin.totpEnabled,
          lastLoginAt: admin.user.lastLoginAt?.toISOString() ?? null,
          createdAt: admin.createdAt.toISOString(),
          updatedAt: admin.updatedAt.toISOString(),
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error('Failed to create admin:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '관리자 추가에 실패했습니다.' } },
      { status: 500 },
    )
  }
}
