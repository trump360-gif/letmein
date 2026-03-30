import { NextResponse } from 'next/server'
import { prisma } from '@letmein/db'
import { getSessionHospitalId } from '@/lib/session'

export async function GET() {
  const hospitalId = await getSessionHospitalId()
  if (!hospitalId) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED' } },
      { status: 401 },
    )
  }

  const [newMatches, activeChats, hospital, recentConsultations] = await Promise.all([
    // HDASH-01: 신규 매칭 수 — 최근 30일 내 CoordinatorMatch
    prisma.coordinatorMatch.count({
      where: {
        hospitalId,
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    }),

    // HDASH-01: 활성 채팅 수 — status=active인 ChatRoom
    prisma.chatRoom.count({
      where: { hospitalId, status: 'active' },
    }),

    // HDASH-01: 평점 — Hospital 레코드에서 avgRating 조회
    prisma.hospital.findUnique({
      where: { id: hospitalId },
      select: { avgRating: true },
    }),

    // HDASH-02: 최근 상담 요청 3건 — hospitalId에 매칭된 CoordinatorMatch
    prisma.coordinatorMatch.findMany({
      where: { hospitalId },
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: {
        id: true,
        createdAt: true,
        status: true,
        request: {
          select: {
            id: true,
            description: true,
            status: true,
            createdAt: true,
            procedure_categories: { select: { name: true } },
          },
        },
      },
    }),
  ])

  // 응답률 계산
  const totalMatches = await prisma.coordinatorMatch.count({ where: { hospitalId } })
  const totalResponses = await prisma.consultation_responses.count({
    where: { hospital_id: hospitalId },
  })
  const responseRate = totalMatches > 0
    ? Math.round((totalResponses / totalMatches) * 100)
    : 0

  // HDASH-03: 최근 리뷰 3건 — reviews 테이블은 Prisma 스키마 없음, $queryRaw 사용
  const recentReviews = await prisma.$queryRaw<Array<{
    id: bigint
    rating: number
    content: string
    created_at: Date
  }>>`
    SELECT id, rating, content, created_at
    FROM reviews
    WHERE hospital_id = ${hospitalId} AND status = 'active'
    ORDER BY created_at DESC
    LIMIT 3
  `

  return NextResponse.json({
    success: true,
    data: {
      stats: {
        newMatches,
        activeChats,
        responseRate,
        avgRating: hospital?.avgRating ? Number(hospital.avgRating) : 0,
      },
      recentConsultations: recentConsultations.map(m => ({
        id: m.id.toString(),
        requestId: m.request.id.toString(),
        category: m.request.procedure_categories.name,
        description: m.request.description.slice(0, 60),
        status: m.request.status ?? 'active',
        matchedAt: m.createdAt?.toISOString() ?? new Date().toISOString(),
      })),
      recentReviews: recentReviews.map(r => ({
        id: r.id.toString(),
        rating: r.rating,
        content: r.content.slice(0, 80),
        createdAt: r.created_at.toISOString(),
      })),
    },
  })
}
