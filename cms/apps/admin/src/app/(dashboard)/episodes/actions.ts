'use server'

import { prisma } from '@letmein/db'
import { revalidatePath } from 'next/cache'

function extractVideoId(url: string): string {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([a-zA-Z0-9_-]{11})/)
  return match?.[1] ?? ''
}

export async function createEpisode(data: {
  youtubeUrl: string
  title: string
  thumbnailUrl?: string
  airDate?: string
  isHero?: boolean
  sortOrder?: number
  castMemberIds?: number[]
}) {
  const videoId = extractVideoId(data.youtubeUrl)
  const autoThumbnail = data.thumbnailUrl || (videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null)

  await prisma.youTubeEpisode.create({
    data: {
      youtubeUrl: data.youtubeUrl,
      youtubeVideoId: videoId,
      title: data.title,
      thumbnailUrl: autoThumbnail,
      airDate: data.airDate ? new Date(data.airDate) : null,
      isHero: data.isHero ?? false,
      sortOrder: data.sortOrder ?? 0,
      castMembers: data.castMemberIds?.length
        ? {
            create: data.castMemberIds.map((id) => ({
              castMemberId: BigInt(id),
            })),
          }
        : undefined,
    },
  })
  revalidatePath('/episodes')
}

export async function updateEpisode(
  episodeId: number,
  data: {
    title?: string
    thumbnailUrl?: string
    airDate?: string
    isHero?: boolean
    sortOrder?: number
  },
) {
  await prisma.youTubeEpisode.update({
    where: { id: BigInt(episodeId) },
    data: {
      title: data.title,
      thumbnailUrl: data.thumbnailUrl,
      airDate: data.airDate ? new Date(data.airDate) : undefined,
      isHero: data.isHero,
      sortOrder: data.sortOrder,
    },
  })
  revalidatePath('/episodes')
}

export async function deleteEpisode(episodeId: number) {
  await prisma.youTubeEpisode.delete({
    where: { id: BigInt(episodeId) },
  })
  revalidatePath('/episodes')
}
