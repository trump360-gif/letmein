import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@letmein/db'
import { evaluatePostScores } from '@/shared/lib/gemini'

function serializeBoard(board: Record<string, unknown>) {
  return {
    ...board,
    id: String(board.id),
    groupId: board.groupId ? String(board.groupId) : null,
    parentId: board.parentId ? String(board.parentId) : null,
    createdAt: board.createdAt instanceof Date ? board.createdAt.toISOString() : board.createdAt,
    updatedAt: board.updatedAt instanceof Date ? board.updatedAt.toISOString() : board.updatedAt,
    deletedAt: undefined,
    thumbnailData: undefined,
  }
}

// POST /api/boards/[slug] - 사용자 게시물 작성
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params
    const body = await request.json()
    const { title, content, userId } = body

    if (!title || !content) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: '제목과 내용을 입력해주세요.' } },
        { status: 400 },
      )
    }

    const board = await prisma.board.findUnique({ where: { slug, deletedAt: null } })
    if (!board || !board.isVisible) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '게시판을 찾을 수 없습니다.' } },
        { status: 404 },
      )
    }

    const post = await prisma.post.create({
      data: {
        boardId: board.id,
        userId: userId ? BigInt(userId) : null,
        title,
        content,
        contentPlain: content.replace(/<[^>]*>/g, '').slice(0, 500),
        status: 'published',
      },
    })

    // 백그라운드 자동 채점 (non-blocking, 어드민에서만 점수 확인)
    evaluatePostScores(title, content)
      .then((scores) =>
        prisma.post.update({
          where: { id: post.id },
          data: { seoScore: scores.seoScore, aeoScore: scores.aeoScore, geoScore: scores.geoScore },
        }),
      )
      .catch(() => {
        // 채점 실패해도 게시는 유지
      })

    return NextResponse.json({
      success: true,
      data: { id: post.id.toString(), title: post.title },
    })
  } catch (error) {
    console.error('POST /api/boards/[slug] error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '게시물 작성에 실패했습니다.' } },
      { status: 500 },
    )
  }
}

// GET /api/boards/[slug] - 게시판 정보 + 게시물 목록
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, Number(searchParams.get('page')) || 1)

    const board = await prisma.board.findUnique({
      where: { slug, deletedAt: null },
    })

    if (!board || !board.isVisible) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '게시판을 찾을 수 없습니다.' } },
        { status: 404 },
      )
    }

    const perPage = board.perPage
    const skip = (page - 1) * perPage

    const [posts, totalCount] = await Promise.all([
      prisma.post.findMany({
        where: { boardId: board.id, deletedAt: null, status: 'published' },
        orderBy: [{ isNotice: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: perPage,
        select: {
          id: true,
          title: true,
          contentPlain: true,
          createdAt: true,
          viewCount: true,
          likeCount: true,
          commentCount: true,
          isNotice: true,
          isAnonymous: true,
          user: { select: { nickname: true } },
        },
      }),
      prisma.post.count({
        where: { boardId: board.id, deletedAt: null, status: 'published' },
      }),
    ])

    const serializedPosts = posts.map((post) => ({
      id: String(post.id),
      title: post.title,
      authorName: post.isAnonymous ? '익명' : (post.user?.nickname || '알 수 없음'),
      createdAt: post.createdAt.toISOString(),
      viewCount: post.viewCount,
      likeCount: post.likeCount,
      commentCount: post.commentCount,
      isPinned: post.isNotice,
      excerpt: post.contentPlain?.slice(0, 150) || null,
    }))

    return NextResponse.json({
      success: true,
      data: {
        board: serializeBoard(board as unknown as Record<string, unknown>),
        posts: serializedPosts,
        pagination: {
          page,
          perPage,
          totalCount,
          totalPages: Math.ceil(totalCount / perPage),
        },
      },
    })
  } catch (error) {
    console.error('GET /api/boards/[slug] error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '게시판 조회에 실패했습니다.' } },
      { status: 500 },
    )
  }
}
