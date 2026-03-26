import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@letmein/db'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { hospitalId, note } = body

    if (!hospitalId) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'hospitalId가 필요합니다.' } },
        { status: 400 },
      )
    }

    // matchedBy is 1 (admin) for now - TODO: get from session
    await prisma.coordinatorMatch.create({
      data: {
        requestId: BigInt(params.id),
        hospitalId: BigInt(hospitalId),
        matchedBy: BigInt(1),
        note: note || null,
      },
    })

    // Update request status
    await prisma.consultationRequest.update({
      where: { id: BigInt(params.id) },
      data: {
        status: 'matched',
        matchedAt: new Date(),
      },
    })

    return NextResponse.json({ success: true, data: { message: '매칭이 완료되었습니다.' } })
  } catch (error) {
    console.error('Failed to match consultation:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '매칭에 실패했습니다.' } },
      { status: 500 },
    )
  }
}
