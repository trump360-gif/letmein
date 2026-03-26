import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@letmein/db'

export async function PATCH(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const post = await prisma.post.findUnique({
      where: { id: BigInt(params.id) },
      select: { status: true },
    })

    if (!post) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '게시물을 찾을 수 없습니다.' } },
        { status: 404 },
      )
    }

    // Toggle blind status
    const isCurrentlyBlind = post.status === 'blind'
    const newStatus = isCurrentlyBlind ? 'published' : 'blind'

    await prisma.post.update({
      where: { id: BigInt(params.id) },
      data: { status: newStatus },
    })

    return NextResponse.json({
      success: true,
      data: { id: params.id, status: newStatus },
    })
  } catch (error) {
    console.error('Failed to toggle blind:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '블라인드 처리에 실패했습니다.' } },
      { status: 500 },
    )
  }
}
