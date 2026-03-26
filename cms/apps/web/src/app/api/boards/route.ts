import { NextResponse } from 'next/server'
import { prisma } from '@letmein/db'

// GET /api/boards - 전체 게시판 목록 (네비게이션용)
export async function GET() {
  try {
    const boards = await prisma.board.findMany({
      where: { deletedAt: null, isVisible: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        nameKey: true,
        slug: true,
        type: true,
        skin: true,
        description: true,
        groupId: true,
        parentId: true,
        depth: true,
      },
    })

    const serialized = boards.map((b) => ({
      ...b,
      id: String(b.id),
      groupId: b.groupId ? String(b.groupId) : null,
      parentId: b.parentId ? String(b.parentId) : null,
    }))

    return NextResponse.json({ success: true, data: serialized })
  } catch (error) {
    console.error('GET /api/boards error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '게시판 목록 조회에 실패했습니다.' } },
      { status: 500 },
    )
  }
}
