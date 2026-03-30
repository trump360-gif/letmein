import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@letmein/db'
import { getSessionHospitalId } from '@/lib/session'

export async function GET(request: NextRequest) {
  const hospitalId = await getSessionHospitalId()
  if (!hospitalId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') ?? 'all'

  const matches = await prisma.coordinatorMatch.findMany({
    where: { hospitalId },
    include: {
      request: {
        include: {
          procedure_categories: { select: { id: true, name: true } },
          consultation_request_details: {
            include: {
              procedure_details: { select: { id: true, name: true } },
            },
          },
          consultation_responses: {
            where: { hospital_id: hospitalId },
            select: { id: true, status: true, created_at: true },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  let consultations = matches.map((match) => {
    const responded = match.request.consultation_responses.length > 0
    const response = responded ? match.request.consultation_responses[0] : null
    return {
      matchId: match.id.toString(),
      requestId: match.request.id.toString(),
      status: responded ? ('responded' as const) : ('pending' as const),
      createdAt: match.createdAt?.toISOString() ?? new Date().toISOString(),
      category: {
        id: match.request.procedure_categories.id,
        name: match.request.procedure_categories.name,
      },
      description: match.request.description,
      preferredPeriod: match.request.preferredPeriod ?? null,
      photoPublic: match.request.photoPublic ?? true,
      details: match.request.consultation_request_details.map((d) => ({
        id: d.procedure_details.id,
        name: d.procedure_details.name,
      })),
      coordinatorNote: match.request.coordinatorNote ?? null,
      response: response
        ? {
            id: response.id.toString(),
            status: response.status ?? 'sent',
            created_at: response.created_at?.toISOString() ?? null,
          }
        : null,
    }
  })

  if (status === 'pending') {
    consultations = consultations.filter((c) => c.status === 'pending')
  } else if (status === 'responded') {
    consultations = consultations.filter((c) => c.status === 'responded')
  }

  return NextResponse.json({ consultations })
}
