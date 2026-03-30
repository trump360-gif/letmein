import { NextResponse } from 'next/server'
import { prisma } from '@letmein/db'

export async function GET() {
  try {
    // 최근 매칭된 상담, 승인된 병원, 인증된 출연자를 활동 로그로 사용
    const [recentMatches, recentHospitals, recentCast] = await Promise.all([
      prisma.coordinatorMatch.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          request: { select: { id: true } },
          hospital: { select: { name: true } },
        },
      }),
      prisma.hospital.findMany({
        where: { status: 'approved', approvedAt: { not: null } },
        orderBy: { approvedAt: 'desc' },
        take: 5,
        select: { id: true, name: true, approvedAt: true },
      }),
      prisma.castMember.findMany({
        where: { verificationStatus: 'verified' },
        orderBy: { verifiedAt: 'desc' },
        take: 5,
        select: { id: true, displayName: true, verifiedAt: true },
      }),
    ])

    const items = [
      ...recentMatches.map((m) => ({
        id: `match-${m.id}`,
        action: '상담 매칭',
        module: 'coordinator',
        targetType: 'consultation',
        targetId: m.requestId?.toString() ?? null,
        adminNickname: m.hospital?.name ?? '병원',
        createdAt: m.createdAt.toISOString(),
      })),
      ...recentHospitals.map((h) => ({
        id: `hospital-${h.id}`,
        action: '병원 승인',
        module: 'hospital',
        targetType: 'hospital',
        targetId: h.id.toString(),
        adminNickname: h.name,
        createdAt: h.approvedAt?.toISOString() ?? '',
      })),
      ...recentCast.map((c) => ({
        id: `cast-${c.id}`,
        action: '출연자 인증',
        module: 'cast',
        targetType: 'cast_member',
        targetId: c.id.toString(),
        adminNickname: c.displayName,
        createdAt: c.verifiedAt?.toISOString() ?? '',
      })),
    ]
      .filter((item) => item.createdAt)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)

    return NextResponse.json({ success: true, data: { items } })
  } catch (error) {
    console.error('Failed to fetch activity:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '활동 로그를 불러오는데 실패했습니다.' } },
      { status: 500 },
    )
  }
}
