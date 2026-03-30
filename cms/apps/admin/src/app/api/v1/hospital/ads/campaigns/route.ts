import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@letmein/db'
import { getSessionHospitalId } from '@/lib/session'

export async function GET(request: NextRequest) {
  const hospitalId = await getSessionHospitalId()
  if (!hospitalId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') ?? '1', 10)
  const limit = parseInt(searchParams.get('limit') ?? '20', 10)
  const status = searchParams.get('status')
  const skip = (page - 1) * limit

  const where = {
    hospitalId,
    ...(status ? { status } : {}),
  }

  const [campaigns, total] = await Promise.all([
    prisma.adCampaign.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        hospitalId: true,
        creativeId: true,
        startDate: true,
        endDate: true,
        dailyBudget: true,
        status: true,
        createdAt: true,
        totalImpressions: true,
        totalClicks: true,
        totalSpent: true,
      },
    }),
    prisma.adCampaign.count({ where }),
  ])

  return NextResponse.json({
    campaigns: campaigns.map((c) => ({
      id: Number(c.id),
      hospital_id: Number(c.hospitalId),
      creativeId: Number(c.creativeId),
      startDate: c.startDate.toISOString().split('T')[0],
      endDate: c.endDate.toISOString().split('T')[0],
      dailyBudget: c.dailyBudget,
      status: c.status ?? 'active',
      createdAt: c.createdAt?.toISOString() ?? new Date().toISOString(),
      totalImpressions: Number(c.totalImpressions ?? 0),
      totalClicks: Number(c.totalClicks ?? 0),
      totalSpent: c.totalSpent ?? 0,
    })),
    total,
    page,
    limit,
    hasNext: skip + limit < total,
  })
}

export async function POST(request: NextRequest) {
  const hospitalId = await getSessionHospitalId()
  if (!hospitalId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { creativeId, startDate, endDate, dailyBudget } = body as {
    creativeId?: number
    startDate?: string
    endDate?: string
    dailyBudget?: number
  }

  if (!creativeId || !startDate || !endDate || dailyBudget === undefined) {
    return NextResponse.json(
      { error: 'creativeId, startDate, endDate, and dailyBudget are required' },
      { status: 400 },
    )
  }

  // Verify the creative belongs to this hospital and is approved
  const creative = await prisma.adCreative.findFirst({
    where: { id: BigInt(creativeId), hospitalId },
  })
  if (!creative) {
    return NextResponse.json(
      { error: 'Creative not found or does not belong to this hospital' },
      { status: 404 },
    )
  }

  // Check if hospital has enough credit
  const credit = await prisma.adCredit.findUnique({ where: { hospitalId } })
  if (!credit || credit.balance <= 0) {
    return NextResponse.json(
      { error: '광고 크레딧이 부족합니다.' },
      { status: 400 },
    )
  }

  const campaign = await prisma.adCampaign.create({
    data: {
      hospitalId,
      creativeId: BigInt(creativeId),
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      dailyBudget,
      placement: 'chat',
      cpmPrice: 1000,
      status: 'active',
    },
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

  return NextResponse.json(
    {
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
    },
    { status: 201 },
  )
}
