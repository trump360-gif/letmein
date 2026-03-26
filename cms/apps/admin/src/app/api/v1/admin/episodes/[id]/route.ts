import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@letmein/db'

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const episode = await prisma.youTubeEpisode.findUnique({
      where: { id: BigInt(params.id) },
      include: {
        castMembers: {
          include: { castMember: { select: { displayName: true, profileImage: true } } },
        },
      },
    })

    if (!episode) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '에피소드를 찾을 수 없습니다.' } },
        { status: 404 },
      )
    }

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
        castMemberCount: episode.castMembers.length,
      },
    })
  } catch (error) {
    console.error('Failed to fetch episode:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '에피소드를 불러오는데 실패했습니다.' } },
      { status: 500 },
    )
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { title, airDate, isHero, sortOrder } = body

    const data: Record<string, unknown> = {}
    if (title !== undefined) data.title = title
    if (airDate !== undefined) data.airDate = airDate ? new Date(airDate) : null
    if (isHero !== undefined) data.isHero = isHero
    if (sortOrder !== undefined) data.sortOrder = sortOrder

    await prisma.youTubeEpisode.update({
      where: { id: BigInt(params.id) },
      data,
    })

    return NextResponse.json({ success: true, data: { message: '에피소드가 업데이트되었습니다.' } })
  } catch (error) {
    console.error('Failed to update episode:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '에피소드 업데이트에 실패했습니다.' } },
      { status: 500 },
    )
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.youTubeEpisode.delete({
      where: { id: BigInt(params.id) },
    })

    return NextResponse.json({ success: true, data: { message: '에피소드가 삭제되었습니다.' } })
  } catch (error) {
    console.error('Failed to delete episode:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '에피소드 삭제에 실패했습니다.' } },
      { status: 500 },
    )
  }
}
