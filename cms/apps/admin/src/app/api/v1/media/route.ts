import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@letmein/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, Number(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || '30')))
    const folderId = searchParams.get('folderId')
    const fileType = searchParams.get('fileType')
    const search = searchParams.get('search')

    const where: Record<string, unknown> = { deletedAt: null }
    if (folderId === 'root') {
      where.folderId = null
    } else if (folderId) {
      where.folderId = BigInt(folderId)
    }
    if (fileType) where.fileType = fileType
    if (search) {
      where.originalName = { contains: search, mode: 'insensitive' }
    }

    const [mediaList, total, folders] = await Promise.all([
      prisma.media.findMany({
        where,
        select: {
          id: true,
          userId: true,
          folderId: true,
          originalName: true,
          fileType: true,
          mimeType: true,
          sizeBytes: true,
          width: true,
          height: true,
          altText: true,
          createdAt: true,
          deletedAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.media.count({ where }),
      // Also return folders for navigation
      prisma.mediaFolder.findMany({
        where: {
          parentId: folderId && folderId !== 'root' ? BigInt(folderId) : null,
        },
        include: {
          _count: { select: { media: true } },
        },
        orderBy: { name: 'asc' },
      }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        media: mediaList.map((m) => ({
          id: m.id.toString(),
          userId: m.userId?.toString() ?? null,
          folderId: m.folderId?.toString() ?? null,
          originalName: m.originalName,
          fileType: m.fileType,
          mimeType: m.mimeType,
          sizeBytes: m.sizeBytes,
          width: m.width,
          height: m.height,
          altText: m.altText,
          createdAt: m.createdAt.toISOString(),
          deletedAt: m.deletedAt?.toISOString() ?? null,
          thumbUrl: `/api/v1/media/${m.id}/thumb`,
          fullUrl: `/api/v1/media/${m.id}`,
        })),
        folders: folders.map((f) => ({
          id: f.id.toString(),
          userId: f.userId?.toString() ?? null,
          parentId: f.parentId?.toString() ?? null,
          name: f.name,
          createdAt: f.createdAt.toISOString(),
          mediaCount: f._count.media,
          children: [],
        })),
      },
      meta: {
        total,
        page,
        limit,
        hasNext: page * limit < total,
      },
    })
  } catch (error) {
    console.error('Failed to fetch media:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '미디어 목록을 불러오는데 실패했습니다.' } },
      { status: 500 },
    )
  }
}
