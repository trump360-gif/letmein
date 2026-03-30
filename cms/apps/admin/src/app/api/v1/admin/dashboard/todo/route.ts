import { NextResponse } from 'next/server'
import { prisma } from '@letmein/db'

export async function GET() {
  try {
    const [pendingHospitals, pendingCastMembers, activeConsultations] = await Promise.all([
      prisma.hospital.count({ where: { status: 'pending' } }),
      prisma.castMember.count({ where: { verificationStatus: 'pending' } }),
      prisma.consultationRequest.count({ where: { status: 'active' } }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        items: [
          {
            id: 'pending-hospitals',
            label: '승인 대기 병원',
            count: pendingHospitals,
            href: '/hospitals?status=pending',
            urgency: pendingHospitals > 5 ? 'high' : pendingHospitals > 0 ? 'medium' : 'low',
          },
          {
            id: 'pending-cast',
            label: '출연자 인증 대기',
            count: pendingCastMembers,
            href: '/cast-members?status=pending',
            urgency: pendingCastMembers > 3 ? 'high' : pendingCastMembers > 0 ? 'medium' : 'low',
          },
          {
            id: 'active-consultations',
            label: '활성 상담 요청',
            count: activeConsultations,
            href: '/coordinator?status=active',
            urgency: activeConsultations > 10 ? 'high' : activeConsultations > 0 ? 'medium' : 'low',
          },
        ],
      },
    })
  } catch (error) {
    console.error('Failed to fetch dashboard todo:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '할 일 목록을 불러오는데 실패했습니다.' } },
      { status: 500 },
    )
  }
}
