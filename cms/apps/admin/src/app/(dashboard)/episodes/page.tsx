import { prisma } from '@letmein/db'
import { EpisodesPage } from '@/views/episodes'

const LIMIT = 20

export default async function Page({
  searchParams,
}: {
  searchParams: { page?: string }
}) {
  const page = Math.max(1, Number(searchParams.page ?? '1'))

  const [episodes, total] = await Promise.all([
    prisma.youTubeEpisode.findMany({
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * LIMIT,
      take: LIMIT,
      include: {
        _count: { select: { castMembers: true } },
      },
    }),
    prisma.youTubeEpisode.count(),
  ])

  const serialized = episodes.map((ep) => ({
    id: Number(ep.id),
    youtubeUrl: ep.youtubeUrl,
    youtubeVideoId: ep.youtubeVideoId,
    title: ep.title,
    thumbnailUrl: ep.thumbnailUrl,
    airDate: ep.airDate?.toISOString() ?? null,
    isHero: ep.isHero ?? false,
    sortOrder: ep.sortOrder ?? 0,
    createdAt: (ep.createdAt ?? new Date()).toISOString(),
    updatedAt: (ep.updatedAt ?? new Date()).toISOString(),
    castMemberCount: ep._count.castMembers,
  }))

  return (
    <EpisodesPage
      episodes={serialized}
      total={total}
      page={page}
      limit={LIMIT}
      hasNext={page * LIMIT < total}
    />
  )
}
