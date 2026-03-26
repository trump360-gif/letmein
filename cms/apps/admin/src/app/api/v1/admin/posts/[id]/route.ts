import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@letmein/db'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const post = await prisma.post.findUnique({
      where: { id: BigInt(params.id) },
      include: {
        board: { select: { id: true, nameKey: true, slug: true } },
        user: { select: { id: true, nickname: true, name: true } },
        contentSource: { select: { author: true } },
        persona: { select: { name: true } },
        tags: { include: { tag: true } },
        revisions: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: { id: true, userId: true, title: true, createdAt: true },
        },
      },
    })

    if (!post) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '게시물을 찾을 수 없습니다.' } },
        { status: 404 },
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: post.id.toString(),
        boardId: post.boardId.toString(),
        boardName: post.board.nameKey,
        boardSlug: post.board.slug,
        userId: post.userId?.toString() ?? null,
        userName: post.user?.name ?? null,
        userNickname: post.user?.nickname ?? post.persona?.name ?? post.contentSource?.author ?? null,
        categoryId: post.categoryId?.toString() ?? null,
        title: post.title,
        content: post.content,
        contentPlain: post.contentPlain,
        thumbnailId: post.thumbnailId?.toString() ?? null,
        isNotice: post.isNotice,
        isAnonymous: post.isAnonymous,
        isSecret: post.isSecret,
        status: post.status,
        viewCount: post.viewCount,
        likeCount: post.likeCount,
        dislikeCount: post.dislikeCount,
        commentCount: post.commentCount,
        reportCount: post.reportCount,
        metaTitle: post.metaTitle,
        metaDesc: post.metaDesc,
        ogImageId: post.ogImageId?.toString() ?? null,
        noIndex: post.noIndex,
        summary: post.summary,
        faqData: post.faqData,
        schemaType: post.schemaType,
        seoScore: post.seoScore ?? null,
        aeoScore: post.aeoScore ?? null,
        geoScore: post.geoScore ?? null,
        scheduledAt: post.scheduledAt?.toISOString() ?? null,
        publishedAt: post.publishedAt.toISOString(),
        createdAt: post.createdAt.toISOString(),
        updatedAt: post.updatedAt.toISOString(),
        deletedAt: post.deletedAt?.toISOString() ?? null,
        tags: post.tags.map((pt) => ({ id: pt.tag.id.toString(), name: pt.tag.name })),
        revisions: post.revisions.map((r) => ({
          id: r.id.toString(),
          userId: r.userId?.toString() ?? null,
          title: r.title,
          createdAt: r.createdAt.toISOString(),
        })),
      },
    })
  } catch (error) {
    console.error('Failed to fetch post:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '게시물을 불러오는데 실패했습니다.' } },
      { status: 500 },
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const body = await request.json()
    const postId = BigInt(params.id)

    // 수정 전 revision 저장
    const existing = await prisma.post.findUnique({
      where: { id: postId },
      select: { title: true, content: true },
    })
    if (existing) {
      await prisma.postRevision.create({
        data: { postId, title: existing.title, content: existing.content },
      })
    }

    const data: Record<string, unknown> = {}
    if (body.title !== undefined) data.title = body.title
    if (body.content !== undefined) {
      data.content = body.content
      data.contentPlain = body.content.replace(/<[^>]+>/g, '').slice(0, 500)
    }
    if (body.metaTitle !== undefined) data.metaTitle = body.metaTitle || null
    if (body.metaDesc !== undefined) data.metaDesc = body.metaDesc || null
    if (body.summary !== undefined) data.summary = body.summary || null
    if (body.status !== undefined) data.status = body.status
    if (body.thumbnailId !== undefined) data.thumbnailId = body.thumbnailId ? BigInt(body.thumbnailId) : null

    await prisma.post.update({ where: { id: postId }, data })
    return NextResponse.json({ success: true, data: { id: params.id } })
  } catch (error) {
    console.error('Failed to update post:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '게시물 수정에 실패했습니다.' } },
      { status: 500 },
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await prisma.post.update({
      where: { id: BigInt(params.id) },
      data: { deletedAt: new Date(), status: 'deleted' },
    })

    return NextResponse.json({ success: true, data: { id: params.id } })
  } catch (error) {
    console.error('Failed to delete post:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '게시물 삭제에 실패했습니다.' } },
      { status: 500 },
    )
  }
}
