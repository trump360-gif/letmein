import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@letmein/db'

function serializeUser(u: {
  id: bigint
  email: string | null
  nickname: string
  name: string | null
  phone: string | null
  grade: number
  points: number
  status: string
  socialProvider: string | null
  emailVerifiedAt: Date | null
  lastLoginAt: Date | null
  suspendedUntil: Date | null
  suspensionReason: string | null
  dormantNotifiedAt: Date | null
  phoneVerifiedAt: Date | null
  identityVerifiedAt: Date | null
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
  _count: { posts: number; comments: number }
  gradeHistory: Array<{
    id: bigint
    fromGrade: number
    toGrade: number
    reason: string | null
    changedBy: bigint | null
    createdAt: Date
    changer: { nickname: string } | null
  }>
  pointTransactions: Array<{
    id: bigint
    amount: number
    balance: number
    type: string
    refType: string | null
    refId: bigint | null
    note: string | null
    expiresAt: Date | null
    createdAt: Date
  }>
}) {
  return {
    id: Number(u.id),
    email: u.email,
    nickname: u.nickname,
    name: u.name,
    phone: u.phone,
    grade: u.grade,
    points: u.points,
    status: u.status,
    socialProvider: u.socialProvider,
    emailVerifiedAt: u.emailVerifiedAt?.toISOString() ?? null,
    lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
    suspendedUntil: u.suspendedUntil?.toISOString() ?? null,
    suspensionReason: u.suspensionReason,
    dormantNotifiedAt: u.dormantNotifiedAt?.toISOString() ?? null,
    phoneVerifiedAt: u.phoneVerifiedAt?.toISOString() ?? null,
    identityVerifiedAt: u.identityVerifiedAt?.toISOString() ?? null,
    createdAt: u.createdAt.toISOString(),
    updatedAt: u.updatedAt.toISOString(),
    deletedAt: u.deletedAt?.toISOString() ?? null,
    postCount: u._count.posts,
    commentCount: u._count.comments,
    recentGradeHistory: u.gradeHistory.map((h) => ({
      id: Number(h.id),
      userId: Number(u.id),
      fromGrade: h.fromGrade,
      toGrade: h.toGrade,
      reason: h.reason,
      changedBy: h.changedBy ? Number(h.changedBy) : null,
      changerNickname: h.changer?.nickname ?? null,
      createdAt: h.createdAt.toISOString(),
    })),
    recentPoints: u.pointTransactions.map((p) => ({
      id: Number(p.id),
      userId: Number(u.id),
      amount: p.amount,
      balance: p.balance,
      type: p.type,
      refType: p.refType,
      refId: p.refId ? Number(p.refId) : null,
      note: p.note,
      expiresAt: p.expiresAt?.toISOString() ?? null,
      createdAt: p.createdAt.toISOString(),
    })),
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const userId = BigInt(params.id)

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: { posts: true, comments: true },
        },
        gradeHistory: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            changer: { select: { nickname: true } },
          },
        },
        pointTransactions: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
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

    return NextResponse.json({
      success: true,
      data: serializeUser(user),
    })
  } catch (error) {
    console.error('Failed to fetch user:', error)
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '회원 정보를 불러오는데 실패했습니다.' },
      },
      { status: 500 },
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const userId = BigInt(params.id)
    const body = await request.json()
    const { nickname, name, phone } = body as {
      nickname?: string
      name?: string
      phone?: string
    }

    const updateData: Record<string, unknown> = {}
    if (nickname !== undefined) updateData.nickname = nickname
    if (name !== undefined) updateData.name = name
    if (phone !== undefined) updateData.phone = phone

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'INVALID_BODY', message: '수정할 항목이 없습니다.' },
        },
        { status: 400 },
      )
    }

    await prisma.user.update({
      where: { id: userId },
      data: updateData,
    })

    return NextResponse.json({ success: true, data: { message: '회원 정보가 수정되었습니다.' } })
  } catch (error) {
    console.error('Failed to update user:', error)
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '회원 정보 수정에 실패했습니다.' },
      },
      { status: 500 },
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const userId = BigInt(params.id)

    await prisma.user.update({
      where: { id: userId },
      data: {
        status: 'withdrawn',
        deletedAt: new Date(),
        email: null,
        name: null,
        phone: null,
      },
    })

    return NextResponse.json({ success: true, data: { message: '회원이 탈퇴 처리되었습니다.' } })
  } catch (error) {
    console.error('Failed to delete user:', error)
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '회원 탈퇴 처리에 실패했습니다.' },
      },
      { status: 500 },
    )
  }
}
