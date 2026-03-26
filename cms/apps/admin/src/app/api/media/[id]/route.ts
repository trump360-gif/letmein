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
  } catch {
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
