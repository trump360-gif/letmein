import { prisma } from '@letmein/db'
import { AdsPage } from '@/views/ads'

const LIMIT = 20

export default async function Page({
  searchParams,
}: {
  searchParams: { page?: string; reviewStatus?: string }
}) {
  const page = Math.max(1, Number(searchParams.page ?? '1'))
  const reviewStatus = searchParams.reviewStatus ?? null

  const where = reviewStatus ? { reviewStatus } : {}

  const [creatives, total] = await Promise.all([
    prisma.adCreative.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * LIMIT,
      take: LIMIT,
      include: {
        hospital: { select: { name: true } },
      },
    }),
    prisma.adCreative.count({ where }),
  ])

  const serialized = creatives.map((c) => ({
    id: Number(c.id),
    hospitalId: Number(c.hospitalId),
    imageUrl: c.imageUrl,
    headline: c.headline,
    reviewStatus: (c.reviewStatus ?? 'pending') as 'pending' | 'approved' | 'rejected',
    rejectionReason: c.rejectionReason,
    reviewedAt: c.reviewedAt?.toISOString() ?? null,
    reviewedBy: c.reviewedBy ? Number(c.reviewedBy) : null,
    createdAt: (c.createdAt ?? new Date()).toISOString(),
    hospitalName: c.hospital.name,
  }))

  return (
    <AdsPage
      creatives={serialized}
      total={total}
      page={page}
      limit={LIMIT}
      hasNext={page * LIMIT < total}
    />
  )
}
