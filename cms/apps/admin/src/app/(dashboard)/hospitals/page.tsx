import { prisma } from '@letmein/db'
import { HospitalsPage } from '@/views/hospitals'

const LIMIT = 20

export default async function Page({
  searchParams,
}: {
  searchParams: { page?: string; status?: string }
}) {
  const page = Math.max(1, Number(searchParams.page ?? '1'))
  const status = searchParams.status ?? null

  const where = status ? { status } : {}

  const [hospitals, total] = await Promise.all([
    prisma.hospital.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * LIMIT,
      take: LIMIT,
      include: {
        user: { select: { nickname: true } },
        _count: { select: { specialties: true, doctors: true } },
      },
    }),
    prisma.hospital.count({ where }),
  ])

  const serialized = hospitals.map((h) => ({
    id: Number(h.id),
    userId: Number(h.userId),
    name: h.name,
    businessNumber: h.businessNumber,
    licenseImage: h.licenseImage,
    description: h.description,
    address: h.address,
    phone: h.phone,
    operatingHours: h.operatingHours,
    profileImage: h.profileImage,
    status: (h.status ?? 'pending') as 'pending' | 'approved' | 'rejected' | 'suspended',
    isPremium: h.isPremium ?? false,
    premiumTier: h.premiumTier,
    introVideoUrl: h.introVideoUrl,
    detailedDescription: h.detailedDescription,
    caseCount: h.caseCount ?? 0,
    approvedAt: h.approvedAt?.toISOString() ?? null,
    createdAt: (h.createdAt ?? new Date()).toISOString(),
    updatedAt: (h.updatedAt ?? new Date()).toISOString(),
    userName: h.user.nickname ?? undefined,
    specialtyCount: h._count.specialties,
    doctorCount: h._count.doctors,
  }))

  return (
    <HospitalsPage
      hospitals={serialized}
      total={total}
      page={page}
      limit={LIMIT}
      hasNext={page * LIMIT < total}
    />
  )
}
