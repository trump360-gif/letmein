import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@letmein/db'
import { getSessionHospitalId } from '@/lib/session'

export async function PATCH(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const hospitalId = await getSessionHospitalId()
  if (!hospitalId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const campaignId = parseInt(params.id, 10)
  if (isNaN(campaignId)) {
    return NextResponse.json({ error: 'Invalid campaign id' }, { status: 400 })
  }

  // Verify campaign belongs to this hospital
  const existing = await prisma.adCampaign.findFirst({
    where: { id: BigInt(campaignId), hospitalId },
    select: { id: true, status: true },
  })

  if (!existing) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
  }

  if (existing.status === 'ended') {
    return NextResponse.json(
      { error: '종료된 캠페인은 상태를 변경할 수 없습니다.' },
      { status: 400 },
    )
  }

  // Toggle: active → paused, paused → active
  const newStatus = existing.status === 'active' ? 'paused' : 'active'

  const campaign = await prisma.adCampaign.update({
    where: { id: BigInt(campaignId) },
    data: { status: newStatus },
    select: {
      id: true,
      hospitalId: true,
      creativeId: true,
      startDate: true,
      endDate: true,
      dailyBudget: true,
      status: true,
      createdAt: true,
    },
  })

  return NextResponse.json({
    campaign: {
      id: Number(campaign.id),
      hospital_id: Number(campaign.hospitalId),
      creativeId: Number(campaign.creativeId),
      startDate: campaign.startDate.toISOString().split('T')[0],
      endDate: campaign.endDate.toISOString().split('T')[0],
      dailyBudget: campaign.dailyBudget,
      status: campaign.status ?? 'active',
      createdAt: campaign.createdAt?.toISOString() ?? new Date().toISOString(),
    },
  })
}
