import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@letmein/db'
import sharp from 'sharp'

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/svg+xml']
const MAX_SIZE = 20 * 1024 * 1024 // 20MB
const THUMB_SIZE = 300

function getFileType(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'video'
  if (
    mimeType.includes('pdf') ||
    mimeType.includes('document') ||
    mimeType.includes('spreadsheet') ||
    mimeType.includes('presentation') ||
    mimeType.includes('text/')
  ) {
    return 'document'
  }
  return 'other'
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const folderId = formData.get('folderId') as string | null
    const altText = formData.get('altText') as string | null

    if (!file) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_BODY', message: '파일을 선택해주세요.' } },
        { status: 400 },
      )
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, error: { code: 'FILE_TOO_LARGE', message: '파일 크기가 20MB를 초과합니다.' } },
        { status: 400 },
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const isImage = ALLOWED_IMAGE_TYPES.includes(file.type)

    let processedBuffer: Buffer = buffer
    let thumbBuffer: Buffer | null = null
    let width: number | null = null
    let height: number | null = null
    let finalMimeType = file.type

    if (isImage && file.type !== 'image/svg+xml' && file.type !== 'image/gif') {
      // Strip EXIF data and convert to WebP
      const sharpInstance = sharp(buffer).rotate() // auto-rotate based on EXIF

      // Remove EXIF metadata
      const metadata = await sharpInstance.metadata()
      width = metadata.width ?? null
      height = metadata.height ?? null

      processedBuffer = await sharp(buffer)
        .rotate()
        .removeAlpha()
        .webp({ quality: 85 })
        .toBuffer()

      finalMimeType = 'image/webp'

      // Generate thumbnail
      thumbBuffer = await sharp(buffer)
        .rotate()
        .resize(THUMB_SIZE, THUMB_SIZE, { fit: 'cover', position: 'centre' })
        .webp({ quality: 70 })
        .toBuffer()
    } else if (isImage) {
      // SVG or GIF - keep as is but get dimensions
      if (file.type !== 'image/svg+xml') {
        const metadata = await sharp(buffer).metadata()
        width = metadata.width ?? null
        height = metadata.height ?? null

        // Generate thumbnail even for GIFs (static first frame)
        thumbBuffer = await sharp(buffer, { animated: false })
          .resize(THUMB_SIZE, THUMB_SIZE, { fit: 'cover' })
          .webp({ quality: 70 })
          .toBuffer()
      }
    }

    const originalName = file.type !== 'image/svg+xml' && file.type !== 'image/gif' && isImage
      ? file.name.replace(/\.[^.]+$/, '.webp')
      : file.name

    const media = await prisma.media.create({
      data: {
        originalName,
        fileType: getFileType(file.type),
        mimeType: finalMimeType,
        sizeBytes: processedBuffer.length,
        width,
        height,
        altText,
        data: processedBuffer,
        thumbData: thumbBuffer,
        folderId: folderId ? BigInt(folderId) : null,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        id: media.id.toString(),
        originalName: media.originalName,
        mimeType: media.mimeType,
        sizeBytes: media.sizeBytes,
        width: media.width,
        height: media.height,
        thumbUrl: `/api/v1/media/${media.id}/thumb`,
        fullUrl: `/api/v1/media/${media.id}`,
      },
    })
  } catch (error) {
    console.error('Failed to upload media:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '파일 업로드에 실패했습니다.' } },
      { status: 500 },
    )
  }
}
