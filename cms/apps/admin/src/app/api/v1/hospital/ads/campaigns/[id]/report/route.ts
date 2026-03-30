import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@letmein/db'
import { getSessionHospitalId } from '@/lib/session'

export async function GET(
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
  const campaign = await prisma.adCampaign.findFirst({
    where: { id: BigInt(campaignId), hospitalId },
    select: {
      id: true,
      totalImpressions: true,
      totalClicks: true,
      totalSpent: true,
    },
  })

  if (!campaign) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
  }

  const dailyRows = await prisma.ad_impressions_daily.findMany({
    where: { campaign_id: BigInt(campaignId) },
    orderBy: { date: 'asc' },
    select: {
      date: true,
      impressions: true,
      clicks: true,
      spent: true,
    },
  })

  const totalImpressions = Number(campaign.totalImpressions ?? 0)
  const totalClicks = Number(campaign.totalClicks ?? 0)
  const totalSpend = campaign.totalSpent ?? 0
  const ctr = totalImpressions > 0
    ? Math.round((totalClicks / totalImpressions) * 10000) / 100
    : 0

  return NextResponse.json({
    report: {
      campaignId,
      totalImpressions,
      totalClicks,
      totalSpend,
      ctr,
      daily: dailyRows.map((r) => ({
        date: r.date.toISOString().split('T')[0],
        impressions: r.impressions ?? 0,
        clicks: r.clicks ?? 0,
        spend: r.spent ?? 0,
      })),
    },
  })
}
