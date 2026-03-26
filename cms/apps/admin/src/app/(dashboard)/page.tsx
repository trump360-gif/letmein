import { prisma } from '@letmein/db'
import { DashboardPage } from '@/views/dashboard'
import { LetMeInStats } from '@/views/dashboard/components/letmein-stats'

export default async function Page() {
  const [
    pendingConsultations,
    pendingHospitals,
    pendingCastMembers,
    pendingAdCreatives,
    activeSubscriptions,
  ] = await Promise.all([
    prisma.consultationRequest.count({ where: { status: 'active' } }),
    prisma.hospital.count({ where: { status: 'pending' } }),
    prisma.castMember.count({ where: { verificationStatus: 'pending' } }),
    prisma.adCreative.count({ where: { reviewStatus: 'pending' } }),
    prisma.hospitalSubscription.count({ where: { status: 'active' } }),
  ])

  return (
    <div className="space-y-6">
      <LetMeInStats
        pendingConsultations={pendingConsultations}
        pendingHospitals={pendingHospitals}
        pendingCastMembers={pendingCastMembers}
        pendingAdCreatives={pendingAdCreatives}
        activeSubscriptions={activeSubscriptions}
      />
      <DashboardPage />
    </div>
  )
}
