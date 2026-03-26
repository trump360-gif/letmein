import { prisma } from '@letmein/db'
import { PremiumPage } from '@/views/premium'

const LIMIT = 20

export default async function Page({
  searchParams,
}: {
  searchParams: { page?: string; status?: string; tier?: string }
}) {
  const page = Math.max(1, Number(searchParams.page ?? '1'))
  const status = searchParams.status ?? null
  const tier = searchParams.tier ?? null

  const where: Record<string, unknown> = {}
  if (status) where.status = status
  if (tier) where.tier = tier

  const [subscriptions, total] = await Promise.all([
    prisma.hospitalSubscription.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * LIMIT,
      take: LIMIT,
      include: {
        hospital: { select: { name: true } },
      },
    }),
    prisma.hospitalSubscription.count({ where }),
  ])

  const serialized = subscriptions.map((s) => ({
    id: Number(s.id),
    hospitalId: Number(s.hospitalId),
    tier: s.tier as 'basic' | 'standard' | 'premium',
    status: s.status as 'active' | 'expired' | 'cancelled',
    startedAt: s.startedAt.toISOString(),
    expiresAt: s.expiresAt.toISOString(),
    cancelledAt: s.cancelledAt?.toISOString() ?? null,
    monthlyPrice: s.monthlyPrice,
    createdAt: (s.createdAt ?? new Date()).toISOString(),
    updatedAt: (s.updatedAt ?? new Date()).toISOString(),
    hospitalName: s.hospital.name,
  }))

  return (
    <PremiumPage
      subscriptions={serialized}
      total={total}
      page={page}
      limit={LIMIT}
      hasNext={page * LIMIT < total}
    />
  )
}
