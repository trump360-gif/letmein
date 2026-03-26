import { prisma } from '@letmein/db'
import { CoordinatorPage } from '@/views/coordinator'

const LIMIT = 20

export default async function Page({
  searchParams,
}: {
  searchParams: { page?: string; status?: string }
}) {
  const page = Math.max(1, Number(searchParams.page ?? '1'))
  const status = searchParams.status ?? 'active'

  const where = status ? { status } : {}

  const [requests, total, hospitals] = await Promise.all([
    prisma.consultationRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * LIMIT,
      take: LIMIT,
      include: {
        user: { select: { nickname: true } },
        procedure_categories: { select: { name: true } },
        _count: { select: { matches: true } },
      },
    }),
    prisma.consultationRequest.count({ where }),
    prisma.hospital.findMany({
      where: { status: 'approved' },
      select: {
        id: true,
        name: true,
        status: true,
        isPremium: true,
        premiumTier: true,
        caseCount: true,
        address: true,
        approvedAt: true,
        createdAt: true,
        updatedAt: true,
        userId: true,
        businessNumber: true,
        licenseImage: true,
        description: true,
        phone: true,
        operatingHours: true,
        profileImage: true,
        introVideoUrl: true,
        detailedDescription: true,
      },
      orderBy: { name: 'asc' },
    }),
  ])

  const serializedRequests = requests.map((r) => ({
    id: Number(r.id),
    userId: Number(r.userId),
    categoryId: r.categoryId,
    description: r.description,
    preferredPeriod: r.preferredPeriod,
    photoPublic: r.photoPublic ?? true,
    status: (r.status ?? 'active') as 'active' | 'matched' | 'expired' | 'cancelled',
    coordinatorId: r.coordinatorId ? Number(r.coordinatorId) : null,
    coordinatorNote: r.coordinatorNote,
    matchedAt: r.matchedAt?.toISOString() ?? null,
    escalatedAt: r.escalatedAt?.toISOString() ?? null,
    expiresAt: r.expiresAt.toISOString(),
    createdAt: (r.createdAt ?? new Date()).toISOString(),
    userName: r.user.nickname ?? undefined,
    categoryName: r.procedure_categories.name,
    matchCount: r._count.matches,
  }))

  const serializedHospitals = hospitals.map((h) => ({
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
    status: (h.status ?? 'approved') as 'pending' | 'approved' | 'rejected' | 'suspended',
    isPremium: h.isPremium ?? false,
    premiumTier: h.premiumTier,
    introVideoUrl: h.introVideoUrl,
    detailedDescription: h.detailedDescription,
    caseCount: h.caseCount ?? 0,
    approvedAt: h.approvedAt?.toISOString() ?? null,
    createdAt: (h.createdAt ?? new Date()).toISOString(),
    updatedAt: (h.updatedAt ?? new Date()).toISOString(),
  }))

  return (
    <CoordinatorPage
      requests={serializedRequests}
      total={total}
      page={page}
      limit={LIMIT}
      hasNext={page * LIMIT < total}
      hospitals={serializedHospitals}
    />
  )
}
