import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@letmein/db'

function serializeBoard(board: Record<string, unknown>) {
  return {
    ...board,
    id: String(board.id),
    groupId: board.groupId ? String(board.groupId) : null,
    parentId: board.parentId ? String(board.parentId) : null,
    createdAt: board.createdAt instanceof Date ? board.createdAt.toISOString() : board.createdAt,
    updatedAt: board.updatedAt instanceof Date ? board.updatedAt.toISOString() : board.updatedAt,
    deletedAt: board.deletedAt instanceof Date ? board.deletedAt.toISOString() : board.deletedAt ?? null,
    thumbnailData: undefined,
  }
}

// GET /api/v1/admin/boards/:id
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const id = BigInt(params.id)

    const board = await prisma.board.findUnique({
      where: { id },
      include: {
        group: true,
        parent: true,
        children: {
          where: { deletedAt: null },
          orderBy: { sortOrder: 'asc' },
          include: {
            _count: { select: { posts: true, children: true } },
          },
        },
        _count: { select: { posts: true, children: true } },
      },
    })

    if (!board || board.deletedAt) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '게시판을 찾을 수 없습니다.' } },
        { status: 404 },
      )
    }

    // 통계 집계
    const postStats = await prisma.post.aggregate({
      where: { boardId: id, deletedAt: null },
      _count: true,
      _sum: { likeCount: true, commentCount: true },
    })

    const data = {
      ...serializeBoard(board as unknown as Record<string, unknown>),
      group: board.group
        ? { id: String(board.group.id), nameKey: board.group.nameKey }
        : null,
      parent: board.parent
        ? { id: String(board.parent.id), nameKey: board.parent.nameKey, slug: board.parent.slug }
        : null,
      children: board.children.map((c) => ({
        ...serializeBoard(c as unknown as Record<string, unknown>),
        _count: c._count,
      })),
      _count: board._count,
      stats: {
        postCount: postStats._count ?? 0,
        commentCount: postStats._sum.commentCount ?? 0,
        likeCount: postStats._sum.likeCount ?? 0,
      },
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('GET /boards/:id error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '게시판 조회에 실패했습니다.' } },
      { status: 500 },
    )
  }
}

// PATCH /api/v1/admin/boards/:id
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const id = BigInt(params.id)
    const body = await request.json()

    const existing = await prisma.board.findUnique({ where: { id } })
    if (!existing || existing.deletedAt) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '게시판을 찾을 수 없습니다.' } },
        { status: 404 },
      )
    }

    // 슬러그 변경 시 중복 검사
    if (body.slug && body.slug !== existing.slug) {
      const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
      if (!slugRegex.test(body.slug)) {
        return NextResponse.json(
          {
            success: false,
            error: { code: 'VALIDATION_ERROR', message: '슬러그는 영소문자, 숫자, 하이픈만 사용할 수 있습니다.', field: 'slug' },
          },
          { status: 400 },
        )
      }

      const duplicateSlug = await prisma.board.findFirst({
        where: { slug: body.slug, id: { not: id } },
      })
      if (duplicateSlug) {
        return NextResponse.json(
          { success: false, error: { code: 'DUPLICATE_SLUG', message: '이미 사용 중인 슬러그입니다.', field: 'slug' } },
          { status: 409 },
        )
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {}

    // 기본 설정
    if (body.nameKey !== undefined) updateData.nameKey = body.nameKey.trim()
    if (body.slug !== undefined) updateData.slug = body.slug.trim()
    if (body.type !== undefined) updateData.type = body.type
    if (body.description !== undefined) updateData.description = body.description
    if (body.sortOrder !== undefined) updateData.sortOrder = body.sortOrder
    if (body.isVisible !== undefined) updateData.isVisible = body.isVisible
    if (body.groupId !== undefined) updateData.groupId = body.groupId ? BigInt(body.groupId) : null
    if (body.parentId !== undefined) updateData.parentId = body.parentId ? BigInt(body.parentId) : null

    // 권한
    if (body.readGrade !== undefined) updateData.readGrade = body.readGrade
    if (body.writeGrade !== undefined) updateData.writeGrade = body.writeGrade
    if (body.commentGrade !== undefined) updateData.commentGrade = body.commentGrade
    if (body.uploadGrade !== undefined) updateData.uploadGrade = body.uploadGrade
    if (body.likeGrade !== undefined) updateData.likeGrade = body.likeGrade

    // 게시물 설정
    if (body.allowAnonymous !== undefined) updateData.allowAnonymous = body.allowAnonymous
    if (body.allowSecret !== undefined) updateData.allowSecret = body.allowSecret
    if (body.allowAttachment !== undefined) updateData.allowAttachment = body.allowAttachment
    if (body.minLength !== undefined) updateData.minLength = body.minLength
    if (body.maxLength !== undefined) updateData.maxLength = body.maxLength
    if (body.allowSchedule !== undefined) updateData.allowSchedule = body.allowSchedule
    if (body.reportThreshold !== undefined) updateData.reportThreshold = body.reportThreshold
    if (body.autoBlind !== undefined) updateData.autoBlind = body.autoBlind
    if (body.filterLevel !== undefined) updateData.filterLevel = body.filterLevel

    // 인터랙션
    if (body.useLike !== undefined) updateData.useLike = body.useLike
    if (body.useDislike !== undefined) updateData.useDislike = body.useDislike
    if (body.useComment !== undefined) updateData.useComment = body.useComment
    if (body.useReply !== undefined) updateData.useReply = body.useReply
    if (body.useShare !== undefined) updateData.useShare = body.useShare
    if (body.useViewCount !== undefined) updateData.useViewCount = body.useViewCount
    if (body.preventCopy !== undefined) updateData.preventCopy = body.preventCopy
    if (body.watermark !== undefined) updateData.watermark = body.watermark

    // 스킨
    if (body.skin !== undefined) updateData.skin = body.skin
    if (body.perPage !== undefined) updateData.perPage = body.perPage

    // fullPath 재계산 (slug 또는 parent 변경 시)
    if (body.slug !== undefined || body.parentId !== undefined) {
      const newSlug = body.slug ?? existing.slug
      const newParentId = body.parentId !== undefined
        ? (body.parentId ? BigInt(body.parentId) : null)
        : existing.parentId

      if (newParentId) {
        const parent = await prisma.board.findUnique({ where: { id: newParentId } })
        if (parent) {
          updateData.fullPath = `${parent.fullPath}/${newSlug}`
          updateData.depth = parent.depth + 1
        }
      } else {
        updateData.fullPath = newSlug
        updateData.depth = 0
      }
    }

    const board = await prisma.board.update({
      where: { id },
      data: updateData,
      include: {
        group: true,
        _count: { select: { posts: true, children: true } },
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        ...serializeBoard(board as unknown as Record<string, unknown>),
        group: board.group
          ? { id: String(board.group.id), nameKey: board.group.nameKey }
          : null,
        _count: board._count,
      },
    })
  } catch (error) {
    console.error('PATCH /boards/:id error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '게시판 수정에 실패했습니다.' } },
      { status: 500 },
    )
  }
}

// DELETE /api/v1/admin/boards/:id (soft delete)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const id = BigInt(params.id)

    const existing = await prisma.board.findUnique({
      where: { id },
      include: { _count: { select: { children: true, posts: true } } },
    })

    if (!existing || existing.deletedAt) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '게시판을 찾을 수 없습니다.' } },
        { status: 404 },
      )
    }

    if (existing._count.children > 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'HAS_CHILDREN',
            message: `하위 게시판이 ${existing._count.children}개 있습니다. 먼저 삭제해주세요.`,
          },
        },
        { status: 400 },
      )
    }

    await prisma.board.update({
      where: { id },
      data: { deletedAt: new Date() },
    })

    return NextResponse.json({ success: true, data: { id: String(id) } })
  } catch (error) {
    console.error('DELETE /boards/:id error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '게시판 삭제에 실패했습니다.' } },
      { status: 500 },
    )
  }
}
