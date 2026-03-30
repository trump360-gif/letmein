import { notFound } from 'next/navigation'
import { prisma } from '@letmein/db'
import { HospitalDetailView } from '@/views/hospitals/detail/HospitalDetailView'
import type { HospitalDetail } from '@letmein/types'

export default async function Page({ params }: { params: { id: string } }) {
  const hospital = await prisma.hospital.findUnique({
    where: { id: BigInt(params.id) },
    include: {
      user: { select: { nickname: true } },
      specialties: {
        include: { category: { select: { name: true } } },
      },
      doctors: { orderBy: { sortOrder: 'asc' } },
    },
  })

  if (!hospital) notFound()

  const data: HospitalDetail = {
    id: Number(hospital.id),
    userId: Number(hospital.userId),
    name: hospital.name,
    businessNumber: hospital.businessNumber,
    licenseImage: hospital.licenseImage,
    description: hospital.description,
    address: hospital.address,
    phone: hospital.phone,
    operatingHours: hospital.operatingHours,
    profileImage: hospital.profileImage,
    status: (hospital.status ?? 'pending') as HospitalDetail['status'],
    isPremium: hospital.isPremium ?? false,
    premiumTier: hospital.premiumTier,
    introVideoUrl: hospital.introVideoUrl,
    detailedDescription: hospital.detailedDescription,
    caseCount: hospital.caseCount ?? 0,
    approvedAt: hospital.approvedAt?.toISOString() ?? null,
    createdAt: (hospital.createdAt ?? new Date()).toISOString(),
    updatedAt: (hospital.updatedAt ?? new Date()).toISOString(),
    userName: hospital.user.nickname ?? undefined,
    specialties: hospital.specialties.map((s) => ({
      id: Number(s.id),
      hospitalId: Number(s.hospitalId),
      categoryId: s.categoryId,
      categoryName: s.category?.name ?? null,
    })),
    doctors: hospital.doctors.map((d) => ({
      id: Number(d.id),
      hospitalId: Number(d.hospitalId),
      name: d.name,
      title: d.title,
      experience: d.experience,
      profileImage: d.profileImage ?? null,
      sortOrder: d.sortOrder ?? 0,
      createdAt: (d.createdAt ?? new Date()).toISOString(),
    })),
  }

  return <HospitalDetailView hospital={data} />
}
