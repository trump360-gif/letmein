import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@letmein/db'
import type { Prisma } from '@prisma/client'

function extractVideoId(url: string): string {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([a-zA-Z0-9_-]{11})/)
  return match?.[1] ?? ''
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, Number(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || '20')))
    const search = searchParams.get('search') || ''
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const where: Prisma.YouTubeEpisodeWhereInput = {}

    if (search) {
      where.title = { contains: search, mode: 'insensitive' }
    }

    const allowedSortFields = ['createdAt', 'airDate', 'sortOrder'] as const
    const actualSort = allowedSortFields.includes(sortBy as (typeof allowedSortFields)[number]) ? sortBy : 'createdAt'
    const actualOrder = sortOrder === 'asc' ? 'asc' : 'desc'

    const [episodes, total] = await Promise.all([
      prisma.youTubeEpisode.findMany({
        where,
        orderBy: { [actualSort]: actualOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: { select: { castMembers: true } },
        },
      }),
      prisma.youTubeEpisode.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        episodes: episodes.map((ep) => ({
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
        })),
        total,
        page,
        limit,
        hasNext: page * limit < total,
      },
    })
  } catch (error) {
    console.error('Failed to fetch episodes:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '에피소드 목록을 불러오는데 실패했습니다.' } },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { youtubeUrl, title, thumbnailUrl, airDate, isHero, sortOrder, castMemberIds } = body

    if (!youtubeUrl || !title) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'youtubeUrl과 title이 필요합니다.' } },
        { status: 400 },
      )
    }

    const videoId = extractVideoId(youtubeUrl)
    const autoThumbnail = thumbnailUrl || (videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null)

    const episode = await prisma.youTubeEpisode.create({
      data: {
        youtubeUrl,
        youtubeVideoId: videoId,
        title,
        thumbnailUrl: autoThumbnail,
        airDate: airDate ? new Date(airDate) : null,
        isHero: isHero ?? false,
        sortOrder: sortOrder ?? 0,
        castMembers: castMemberIds?.length
          ? {
              create: castMemberIds.map((id: number) => ({
                castMemberId: BigInt(id),
              })),
            }
          : undefined,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        id: Number(episode.id),
        youtubeUrl: episode.youtubeUrl,
        youtubeVideoId: episode.youtubeVideoId,
        title: episode.title,
        thumbnailUrl: episode.thumbnailUrl,
        airDate: episode.airDate?.toISOString() ?? null,
        isHero: episode.isHero ?? false,
        sortOrder: episode.sortOrder ?? 0,
        createdAt: (episode.createdAt ?? new Date()).toISOString(),
        updatedAt: (episode.updatedAt ?? new Date()).toISOString(),
      },
    })
  } catch (error) {
    console.error('Failed to create episode:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '에피소드 생성에 실패했습니다.' } },
      { status: 500 },
    )
  }
}
