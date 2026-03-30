import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@letmein/db'
import { getSessionHospitalId } from '@/lib/session'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const hospitalId = await getSessionHospitalId()
  if (!hospitalId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const id = params.id
  const body = await request.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: '요청 본문이 올바르지 않습니다' }, { status: 400 })
  }

  const { intro, experience, message } = body as {
    intro?: string
    experience?: string
    message?: string
  }

  // 검증
  if (!message || message.length < 10) {
    return NextResponse.json(
      { error: '메시지는 10자 이상 입력해주세요' },
      { status: 400 },
    )
  }
  if (message.length > 3000) {
    return NextResponse.json(
      { error: '메시지는 3,000자 이하로 입력해주세요' },
      { status: 400 },
    )
  }
  if (intro && intro.length > 60) {
    return NextResponse.json(
      { error: '소개는 60자 이하로 입력해주세요' },
      { status: 400 },
    )
  }
  if (experience && experience.length > 60) {
    return NextResponse.json(
      { error: '경험은 60자 이하로 입력해주세요' },
      { status: 400 },
    )
  }

  // CoordinatorMatch 존재 확인
  const match = await prisma.coordinatorMatch.findUnique({
    where: {
      requestId_hospitalId: { requestId: BigInt(id), hospitalId },
    },
  })
  if (!match) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // 응답 생성 (upsert — 재발송 방지)
  const response = await prisma.consultation_responses.upsert({
    where: {
      request_id_hospital_id: { request_id: BigInt(id), hospital_id: hospitalId },
    },
    create: {
      request_id: BigInt(id),
      hospital_id: hospitalId,
      intro: intro ?? null,
      experience: experience ?? null,
      message,
      status: 'sent',
    },
    update: {
      intro: intro ?? null,
      experience: experience ?? null,
      message,
      status: 'sent',
    },
  })

  return NextResponse.json(
    {
      response: {
        id: response.id.toString(),
        request_id: response.request_id.toString(),
        hospital_id: response.hospital_id.toString(),
        intro: response.intro,
        experience: response.experience,
        message: response.message,
        status: response.status,
        created_at: response.created_at?.toISOString() ?? null,
      },
    },
    { status: 201 },
  )
}
