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
      select: { thumbData: true, data: true, mimeType: true },
    })

    if (!media) {
      return new NextResponse('Not Found', { status: 404 })
    }

    // Return thumbnail if available, otherwise return full image
    const imageData = media.thumbData ?? media.data
    const contentType = media.thumbData ? 'image/webp' : media.mimeType

    return new NextResponse(new Uint8Array(imageData), {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    console.error('Failed to serve thumbnail:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
