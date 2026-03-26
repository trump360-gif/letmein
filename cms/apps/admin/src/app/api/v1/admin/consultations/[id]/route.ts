import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@letmein/db'

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const consultation = await prisma.consultationRequest.findUnique({
      where: { id: BigInt(params.id) },
      include: {
        user: { select: { nickname: true } },
        matches: {
          include: { hospital: { select: { name: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!consultation) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '상담 요청을 찾을 수 없습니다.' } },
        { status: 404 },
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: Number(consultation.id),
        userId: Number(consultation.userId),
        categoryId: consultation.categoryId,
        description: consultation.description,
        preferredPeriod: consultation.preferredPeriod,
        photoPublic: consultation.photoPublic,
        status: consultation.status,
        coordinatorId: consultation.coordinatorId ? Number(consultation.coordinatorId) : null,
        coordinatorNote: consultation.coordinatorNote,
        matchedAt: consultation.matchedAt?.toISOString() ?? null,
        escalatedAt: consultation.escalatedAt?.toISOString() ?? null,
        expiresAt: consultation.expiresAt.toISOString(),
        createdAt: (consultation.createdAt ?? new Date()).toISOString(),
        userName: consultation.user.nickname,
        matches: consultation.matches.map((m) => ({
          id: Number(m.id),
          requestId: Number(m.requestId),
          hospitalId: Number(m.hospitalId),
          matchedBy: Number(m.matchedBy),
          note: m.note,
          status: m.status,
          createdAt: (m.createdAt ?? new Date()).toISOString(),
          hospitalName: m.hospital.name,
        })),
      },
    })
  } catch (error) {
    console.error('Failed to fetch consultation:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '상담 정보를 불러오는데 실패했습니다.' } },
      { status: 500 },
    )
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { status, note } = body

    const data: Record<string, unknown> = {}
    if (status) data.status = status
    if (note) data.coordinatorNote = note
    if (status === 'matched') data.matchedAt = new Date()

    await prisma.consultationRequest.update({
      where: { id: BigInt(params.id) },
      data,
    })

    return NextResponse.json({ success: true, data: { message: '상담 상태가 업데이트되었습니다.' } })
  } catch (error) {
    console.error('Failed to update consultation:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '상담 업데이트에 실패했습니다.' } },
      { status: 500 },
    )
  }
}
