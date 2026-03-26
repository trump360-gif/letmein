import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@letmein/db'

// PATCH: blind/unblind comment
export async function PATCH(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const comment = await prisma.comment.findUnique({
      where: { id: BigInt(params.id) },
      select: { status: true },
    })

    if (!comment) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '댓글을 찾을 수 없습니다.' } },
        { status: 404 },
      )
    }

    const isCurrentlyBlind = comment.status === 'blind'
    const newStatus = isCurrentlyBlind ? 'active' : 'blind'

    await prisma.comment.update({
      where: { id: BigInt(params.id) },
      data: { status: newStatus },
    })

    return NextResponse.json({
      success: true,
      data: { id: params.id, status: newStatus },
    })
  } catch (error) {
    console.error('Failed to toggle comment blind:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '댓글 블라인드 처리에 실패했습니다.' } },
      { status: 500 },
    )
  }
}

// DELETE: soft-delete comment
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await prisma.comment.update({
      where: { id: BigInt(params.id) },
      data: { deletedAt: new Date(), status: 'deleted' },
    })

    return NextResponse.json({ success: true, data: { id: params.id } })
  } catch (error) {
    console.error('Failed to delete comment:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '댓글 삭제에 실패했습니다.' } },
      { status: 500 },
    )
  }
}
