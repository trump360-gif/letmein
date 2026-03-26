import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@letmein/db'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const body = await request.json()
    const { targetBoardId } = body as { targetBoardId: string }

    if (!targetBoardId) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_BODY', message: '대상 게시판을 지정해주세요.' } },
        { status: 400 },
      )
    }

    const targetBoard = await prisma.board.findUnique({
      where: { id: BigInt(targetBoardId) },
      select: { id: true, nameKey: true },
    })

    if (!targetBoard) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '대상 게시판을 찾을 수 없습니다.' } },
        { status: 404 },
      )
    }

    await prisma.post.update({
      where: { id: BigInt(params.id) },
      data: { boardId: BigInt(targetBoardId) },
    })

    return NextResponse.json({
      success: true,
      data: { id: params.id, boardId: targetBoardId, boardName: targetBoard.nameKey },
    })
  } catch (error) {
    console.error('Failed to move post:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '게시물 이동에 실패했습니다.' } },
      { status: 500 },
    )
  }
}
