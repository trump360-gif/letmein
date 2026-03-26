import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@letmein/db'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serializeBoard(board: any) {
  return {
    ...board,
    id: String(board.id),
    groupId: board.group_id ? String(board.group_id) : null,
    parentId: board.parent_id ? String(board.parent_id) : null,
    nameKey: board.name_key,
    slug: board.slug,
    fullPath: board.full_path,
    description: board.description,
    type: board.board_type,
    sortOrder: board.sort_order,
    isVisible: board.is_visible,
    createdAt: board.created_at instanceof Date ? board.created_at.toISOString() : board.created_at,
    updatedAt: board.updated_at instanceof Date ? board.updated_at.toISOString() : board.updated_at,
    // 스키마에 없는 레거시 필드 제거
    group_id: undefined,
    parent_id: undefined,
    name_key: undefined,
    full_path: undefined,
    board_type: undefined,
    sort_order: undefined,
    is_visible: undefined,
    created_at: undefined,
    updated_at: undefined,
    thumbnail_data: undefined,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serializeBoardTree(board: any): any {
  const serialized: Record<string, unknown> = serializeBoard(board)
  if (board.other_boards) {
    serialized.children = board.other_boards.map(serializeBoardTree)
  }
  return serialized
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serializeGroup(group: any) {
  return {
    id: String(group.id),
    nameKey: group.name_key,
    sortOrder: group.sort_order,
    isVisible: group.is_visible,
    createdAt: group.created_at?.toISOString() ?? null,
    boards: (group.boards ?? []).map(serializeBoardTree),
  }
}

// GET /api/v1/admin/boards - 게시판 전체 목록 (트리)
export async function GET() {
  try {
    // 그룹별 게시판 트리 구조로 반환
    const groups = await prisma.boardGroup.findMany({
      orderBy: { sort_order: 'asc' },
      include: {
        boards: {
          where: { parent_id: null },
          orderBy: { sort_order: 'asc' },
          include: {
            other_boards: {
              orderBy: { sort_order: 'asc' },
            },
          },
        },
      },
    })

    // 그룹에 속하지 않은 게시판
    const ungroupedBoards = await prisma.board.findMany({
      where: { group_id: null, parent_id: null },
      orderBy: { sort_order: 'asc' },
      include: {
        other_boards: {
          orderBy: { sort_order: 'asc' },
        },
      },
    })

    const data = {
      groups: groups.map(serializeGroup),
      ungrouped: ungroupedBoards.map(serializeBoardTree),
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('GET /boards error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '게시판 목록 조회에 실패했습니다.' } },
      { status: 500 },
    )
  }
}

// POST /api/v1/admin/boards - 게시판 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // 필수값 검증
    if (!body.nameKey || typeof body.nameKey !== 'string' || body.nameKey.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: '게시판 이름은 필수입니다.', field: 'nameKey' } },
        { status: 400 },
      )
    }

    if (!body.slug || typeof body.slug !== 'string' || body.slug.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: '슬러그는 필수입니다.', field: 'slug' } },
        { status: 400 },
      )
    }

    // 슬러그 형식 검증 (영소문자, 숫자, 하이픈만 허용)
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

    // 슬러그 중복 검사
    const existingSlug = await prisma.board.findUnique({ where: { slug: body.slug } })
    if (existingSlug) {
      return NextResponse.json(
        { success: false, error: { code: 'DUPLICATE_SLUG', message: '이미 사용 중인 슬러그입니다.', field: 'slug' } },
        { status: 409 },
      )
    }

    // full_path 계산
    let fullPath = body.slug
    if (body.parentId) {
      const parent = await prisma.board.findUnique({ where: { id: BigInt(body.parentId) } })
      if (parent) {
        fullPath = `${parent.full_path ?? parent.slug}/${body.slug}`
      }
    }

    // full_path 중복 검사
    const existingPath = await prisma.board.findFirst({ where: { full_path: fullPath } })
    if (existingPath) {
      return NextResponse.json(
        { success: false, error: { code: 'DUPLICATE_PATH', message: '이미 사용 중인 경로입니다.' } },
        { status: 409 },
      )
    }

    // sort_order 기본값
    let sortOrder = body.sortOrder ?? 0
    if (sortOrder === 0) {
      const maxSort = await prisma.board.aggregate({
        where: {
          group_id: body.groupId ? BigInt(body.groupId) : null,
          parent_id: body.parentId ? BigInt(body.parentId) : null,
        },
        _max: { sort_order: true },
      })
      sortOrder = (maxSort._max.sort_order ?? 0) + 1
    }

    const board = await prisma.board.create({
      data: {
        group_id: body.groupId ? BigInt(body.groupId) : null,
        parent_id: body.parentId ? BigInt(body.parentId) : null,
        name_key: body.nameKey.trim(),
        slug: body.slug.trim(),
        full_path: fullPath,
        board_type: body.type ?? 'general',
        description: body.description ?? null,
        sort_order: sortOrder,
        is_visible: body.isVisible ?? true,
      },
      include: {
        BoardGroup: true,
      },
    })

    return NextResponse.json(
      {
        success: true,
        data: {
          ...serializeBoard(board as unknown as Record<string, unknown>),
          group: board.BoardGroup
            ? {
                id: String(board.BoardGroup.id),
                nameKey: board.BoardGroup.name_key,
              }
            : null,
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error('POST /boards error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '게시판 생성에 실패했습니다.' } },
      { status: 500 },
    )
  }
}
