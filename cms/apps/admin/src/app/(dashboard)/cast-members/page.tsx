import { prisma } from '@letmein/db'
import { CastMembersPage } from '@/views/cast-members'

const LIMIT = 20

export default async function Page({
  searchParams,
}: {
  searchParams: { page?: string; status?: string }
}) {
  const page = Math.max(1, Number(searchParams.page ?? '1'))
  const status = searchParams.status ?? null

  const where = status ? { verificationStatus: status } : {}

  const [members, total] = await Promise.all([
    prisma.castMember.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * LIMIT,
      take: LIMIT,
      include: {
        user: { select: { nickname: true } },
      },
    }),
    prisma.castMember.count({ where }),
  ])

  const serialized = members.map((m) => ({
    id: Number(m.id),
    userId: Number(m.userId),
    displayName: m.displayName,
    bio: m.bio,
    profileImage: m.profileImage,
    badgeType: m.badgeType ?? 'verified',
    verificationStatus: (m.verificationStatus ?? 'pending') as 'pending' | 'verified' | 'rejected',
    verifiedAt: m.verifiedAt?.toISOString() ?? null,
    verifiedBy: m.verifiedBy ? Number(m.verifiedBy) : null,
    rejectionReason: m.rejectionReason,
    youtubeChannelUrl: m.youtubeChannelUrl,
    followerCount: m.followerCount ?? 0,
    storyCount: m.storyCount ?? 0,
    createdAt: (m.createdAt ?? new Date()).toISOString(),
    updatedAt: (m.updatedAt ?? new Date()).toISOString(),
    userName: m.user.nickname ?? undefined,
  }))

  return (
    <CastMembersPage
      members={serialized}
      total={total}
      page={page}
      limit={LIMIT}
      hasNext={page * LIMIT < total}
    />
  )
}
