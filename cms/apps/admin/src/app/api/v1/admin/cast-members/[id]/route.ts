import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@letmein/db'

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const member = await prisma.castMember.findUnique({
      where: { id: BigInt(params.id) },
      include: {
        user: { select: { nickname: true } },
      },
    })

    if (!member) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '출연자를 찾을 수 없습니다.' } },
        { status: 404 },
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: Number(member.id),
        userId: Number(member.userId),
        displayName: member.displayName,
        bio: member.bio,
        profileImage: member.profileImage,
        badgeType: member.badgeType,
        verificationStatus: member.verificationStatus,
        verifiedAt: member.verifiedAt?.toISOString() ?? null,
        verifiedBy: member.verifiedBy ? Number(member.verifiedBy) : null,
        rejectionReason: member.rejectionReason,
        youtubeChannelUrl: member.youtubeChannelUrl,
        followerCount: member.followerCount,
        storyCount: member.storyCount,
        createdAt: (member.createdAt ?? new Date()).toISOString(),
        updatedAt: (member.updatedAt ?? new Date()).toISOString(),
        userName: member.user.nickname,
        userEmail: null,
      },
    })
  } catch (error) {
    console.error('Failed to fetch cast member:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '출연자 정보를 불러오는데 실패했습니다.' } },
      { status: 500 },
    )
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { status, reason } = body

    const data: Record<string, unknown> = {}
    if (status === 'verified') {
      data.verificationStatus = 'verified'
      data.verifiedAt = new Date()
      data.verifiedBy = BigInt(1) // TODO: get from session
    } else if (status === 'rejected') {
      data.verificationStatus = 'rejected'
      data.rejectionReason = reason || null
    }

    await prisma.castMember.update({
      where: { id: BigInt(params.id) },
      data,
    })

    return NextResponse.json({ success: true, data: { message: '출연자 상태가 업데이트되었습니다.' } })
  } catch (error) {
    console.error('Failed to update cast member:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '출연자 업데이트에 실패했습니다.' } },
      { status: 500 },
    )
  }
}
