import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@letmein/db'

// 기존 포스트의 깨진 이미지 URL 일괄 치환
export async function PATCH() {
  try {
    // http://localhost:3000/api/v1/media/ → /api/media/
    // https://.../api/v1/media/ → /api/media/
    const result = await prisma.$executeRaw`
      UPDATE posts
      SET content = regexp_replace(
        content,
        'https?://[^/]+/api/v1/media/',
        '/api/media/',
        'g'
      )
      WHERE content LIKE '%/api/v1/media/%'
    `
    return NextResponse.json({
      success: true,
      message: `${result}개 포스트의 이미지 URL이 수정되었습니다.`,
    })
  } catch (error) {
    console.error('Failed to fix image URLs:', error)
    return NextResponse.json(
      { success: false, error: '이미지 URL 수정에 실패했습니다.' },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, Number(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || '20')))
    const boardId = searchParams.get('boardId')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc'

    const postType = searchParams.get('postType')
    const language = searchParams.get('language')
    const aiGenerated = searchParams.get('aiGenerated')

    const where: Record<string, unknown> = { deletedAt: null }
    if (boardId) where.boardId = BigInt(boardId)
    if (status) where.status = status
    if (postType) where.postType = postType
    if (language) where.language = language
    if (aiGenerated !== null && aiGenerated !== '') where.aiGenerated = aiGenerated === 'true'
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { contentPlain: { contains: search, mode: 'insensitive' } },
      ]
    }

    const orderBy: Record<string, string> = {}
    if (['createdAt', 'publishedAt', 'viewCount', 'likeCount', 'commentCount', 'reportCount'].includes(sortBy)) {
      orderBy[sortBy] = sortOrder
    } else {
      orderBy.createdAt = 'desc'
    }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        include: {
          board: { select: { id: true, nameKey: true, slug: true } },
          user: { select: { id: true, nickname: true } },
          contentSource: { select: { author: true } },
          persona: { select: { name: true } },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.post.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: posts.map((p) => ({
        id: p.id.toString(),
        boardId: p.boardId.toString(),
        boardName: p.board.nameKey,
        boardSlug: p.board.slug,
        userId: p.userId?.toString() ?? null,
        userNickname: p.user?.nickname ?? p.persona?.name ?? p.contentSource?.author ?? null,
        title: p.title,
        status: p.status,
        isNotice: p.isNotice,
        viewCount: p.viewCount,
        likeCount: p.likeCount,
        commentCount: p.commentCount,
        reportCount: p.reportCount,
        publishedAt: p.publishedAt.toISOString(),
        createdAt: p.createdAt.toISOString(),
        postType: p.postType ?? null,
        language: p.language,
        aiGenerated: p.aiGenerated,
        seoScore: p.seoScore ?? null,
        aeoScore: p.aeoScore ?? null,
        geoScore: p.geoScore ?? null,
        thumbnailId: p.thumbnailId?.toString() ?? null,
      })),
      meta: {
        total,
        page,
        limit,
        hasNext: page * limit < total,
      },
    })
  } catch (error) {
    console.error('Failed to fetch posts:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '게시물 목록을 불러오는데 실패했습니다.' } },
      { status: 500 },
    )
  }
}
