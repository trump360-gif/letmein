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
  const skip = (page - 1) * limit

  const [creatives, total] = await Promise.all([
    prisma.adCreative.findMany({
      where: { hospitalId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        hospitalId: true,
        imageUrl: true,
        headline: true,
        reviewStatus: true,
        createdAt: true,
      },
    }),
    prisma.adCreative.count({ where: { hospitalId } }),
  ])

  return NextResponse.json({
    creatives: creatives.map((c) => ({
      id: Number(c.id),
      hospital_id: Number(c.hospitalId),
      imageUrl: c.imageUrl,
      headline: c.headline,
      reviewStatus: c.reviewStatus ?? 'pending',
      createdAt: c.createdAt?.toISOString() ?? new Date().toISOString(),
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
  const { imageUrl, headline } = body as { imageUrl?: string; headline?: string }

  if (!imageUrl || !headline) {
    return NextResponse.json(
      { error: 'imageUrl and headline are required' },
      { status: 400 },
    )
  }

  if (headline.length > 60) {
    return NextResponse.json(
      { error: 'headline must be 60 characters or fewer' },
      { status: 400 },
    )
  }

  const creative = await prisma.adCreative.create({
    data: {
      hospitalId,
      imageUrl,
      headline,
      reviewStatus: 'pending',
    },
    select: {
      id: true,
      hospitalId: true,
      imageUrl: true,
      headline: true,
      reviewStatus: true,
      createdAt: true,
    },
  })

  return NextResponse.json(
    {
      creative: {
        id: Number(creative.id),
        hospital_id: Number(creative.hospitalId),
        imageUrl: creative.imageUrl,
        headline: creative.headline,
        reviewStatus: creative.reviewStatus ?? 'pending',
        createdAt: creative.createdAt?.toISOString() ?? new Date().toISOString(),
      },
    },
    { status: 201 },
  )
}
