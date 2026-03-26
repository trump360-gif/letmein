import { prisma } from '@letmein/db'
import { CastStoriesView } from './view'

const LIMIT = 20

export default async function Page({
  searchParams,
}: {
  searchParams: { page?: string; status?: string }
}) {
  const page = Math.max(1, Number(searchParams.page ?? '1'))
  const status = searchParams.status || 'all'

  const where = status === 'all' ? {} : { status }

  const [stories, total] = await Promise.all([
    prisma.castStory.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * LIMIT,
      take: LIMIT,
      include: {
        castMember: {
          select: { id: true, displayName: true, profileImage: true },
        },
      },
    }),
    prisma.castStory.count({ where }),
  ])

  const serialized = stories.map((s) => ({
    id: Number(s.id),
    castMemberName: s.castMember.displayName,
    castMemberImage: s.castMember.profileImage,
    content: s.content,
    storyType: s.storyType ?? 'general',
    status: s.status ?? 'active',
    likeCount: s.likeCount ?? 0,
    commentCount: s.commentCount ?? 0,
    createdAt: s.createdAt?.toISOString() ?? '',
  }))

  return (
    <CastStoriesView
      stories={serialized}
      total={total}
      page={page}
      limit={LIMIT}
      hasNext={page * LIMIT < total}
      currentStatus={status}
    />
  )
}
