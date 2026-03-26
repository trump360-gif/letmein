import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@letmein/db'

// GET /api/bot/posts?limit=20&category=free
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const limit = Math.min(Number(searchParams.get('limit') || 20), 100)
  const category = searchParams.get('category') || null

  const where: Record<string, unknown> = { deletedAt: null, status: 'published' }
  if (category) {
    const board = await prisma.board.findFirst({ where: { slug: category, deletedAt: null } })
    if (board) where.boardId = board.id
  }

  const posts = await prisma.post.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      title: true,
      content: true,
      contentPlain: true,
      createdAt: true,
      viewCount: true,
      likeCount: true,
      commentCount: true,
      isAnonymous: true,
      botAuthorName: true,
      botPersonaId: true,
      user: { select: { nickname: true } },
      board: { select: { slug: true } },
    },
  })

  return NextResponse.json({
    success: true,
    data: {
      posts: posts.map((p) => ({
        post_id: String(p.id),
        title: p.title,
        content: p.content,
        category: p.board?.slug || 'free',
        author: p.botAuthorName || (p.isAnonymous ? '익명' : (p.user?.nickname || '알 수 없음')),
        persona_id: p.botPersonaId || null,
        created_at: p.createdAt.toISOString(),
        view_count: p.viewCount,
        like_count: p.likeCount,
        comment_count: p.commentCount,
      })),
    },
  })
}

// POST /api/bot/posts
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { persona_id, persona_name, title, content, category, image_url } = body

    if (!title || !content) {
      return NextResponse.json({ success: false, error: 'title and content required' }, { status: 400 })
    }

    const slug = category || 'free'
    const board = await prisma.board.findFirst({ where: { slug, deletedAt: null } })
    if (!board) {
      return NextResponse.json({ success: false, error: `board not found: ${slug}` }, { status: 404 })
    }

    let finalContent = content
    if (image_url) {
      finalContent = `<img src="${image_url}" alt="썸네일" style="max-width:100%;border-radius:8px;margin-bottom:12px;" />\n${content}`
    }

    const post = await prisma.post.create({
      data: {
        boardId: board.id,
        title,
        content: finalContent,
        contentPlain: content.replace(/<[^>]*>/g, '').slice(0, 500),
        status: 'published',
        isAnonymous: false,
        botAuthorName: persona_name || null,
        botPersonaId: persona_id || null,
      },
    })

    return NextResponse.json({
      success: true,
      data: { post_id: String(post.id) },
    }, { status: 201 })
  } catch (e) {
    console.error('[bot/posts POST]', e)
    return NextResponse.json({ success: false, error: 'internal error' }, { status: 500 })
  }
}
