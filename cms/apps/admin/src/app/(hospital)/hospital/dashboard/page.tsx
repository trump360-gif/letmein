import { redirect } from 'next/navigation'
import { HospitalDashboardView } from '@/views/hospital/dashboard/HospitalDashboardView'
import { getSessionHospitalId } from '@/lib/session'
import { prisma } from '@letmein/db'

export default async function Page() {
  const hospitalId = await getSessionHospitalId()
  if (!hospitalId) redirect('/hospital-login')

  const [newMatches, activeChats, hospital, recentConsultations] = await Promise.all([
    prisma.coordinatorMatch.count({
      where: {
        hospitalId,
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    }),
    prisma.chatRoom.count({ where: { hospitalId, status: 'active' } }),
    prisma.hospital.findUnique({
      where: { id: hospitalId },
      select: { avgRating: true },
    }),
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

  const totalMatches = await prisma.coordinatorMatch.count({ where: { hospitalId } })
  const totalResponses = await prisma.consultation_responses.count({
    where: { hospital_id: hospitalId },
  })
  const responseRate = totalMatches > 0
    ? Math.round((totalResponses / totalMatches) * 100)
    : 0

  const recentReviewsRaw = await prisma.$queryRaw<Array<{
    id: bigint
    rating: number
    content: string
    created_at: Date
  }>>`
    SELECT id, rating, content, created_at
    FROM reviews
    WHERE hospital_id = ${hospitalId} AND status = 'active'
    ORDER BY created_at DESC LIMIT 3
  `

  const stats = {
    newMatches,
    activeChats,
    responseRate,
    avgRating: hospital?.avgRating ? Number(hospital.avgRating) : 0,
  }

  const recentConsultationsData = recentConsultations.map(m => ({
    id: m.id.toString(),
    requestId: m.request.id.toString(),
    category: m.request.procedure_categories.name,
    description: m.request.description.slice(0, 60),
    status: m.request.status ?? 'active',
    matchedAt: m.createdAt?.toISOString() ?? new Date().toISOString(),
  }))

  const recentReviews = recentReviewsRaw.map(r => ({
    id: r.id.toString(),
    rating: r.rating,
    content: r.content.slice(0, 80),
    createdAt: r.created_at.toISOString(),
  }))

  return (
    <HospitalDashboardView
      stats={stats}
      recentConsultations={recentConsultationsData}
      recentReviews={recentReviews}
    />
  )
}
