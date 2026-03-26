import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@letmein/db'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const media = await prisma.media.findUnique({
      where: { id: BigInt(id) },
      select: { data: true, mimeType: true, originalName: true },
    })

    if (!media) {
      return new NextResponse('Not Found', { status: 404 })
    }

    return new NextResponse(new Uint8Array(media.data), {
      headers: {
        'Content-Type': media.mimeType,
        'Content-Disposition': `inline; filename="${encodeURIComponent(media.originalName)}"`,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    console.error('Failed to serve media:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    await prisma.media.update({
      where: { id: BigInt(id) },
      data: { deletedAt: new Date() },
    })

    return NextResponse.json({ success: true, data: { id } })
  } catch (error) {
    console.error('Failed to delete media:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '미디어 삭제에 실패했습니다.' } },
      { status: 500 },
    )
  }
}
