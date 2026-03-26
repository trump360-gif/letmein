import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@letmein/db'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, url, events, secret, isActive } = body as {
      name?: string
      url?: string
      events?: string[]
      secret?: string
      isActive?: boolean
    }

    const existing = await prisma.webhookConfig.findUnique({
      where: { id: BigInt(id) },
    })
    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '해당 웹훅을 찾을 수 없습니다.' } },
        { status: 404 },
      )
    }

    const updated = await prisma.webhookConfig.update({
      where: { id: BigInt(id) },
      data: {
        ...(name !== undefined && { name }),
        ...(url !== undefined && { url }),
        ...(events !== undefined && { events }),
        ...(secret !== undefined && { secret }),
        ...(isActive !== undefined && { isActive }),
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        webhook: {
          id: updated.id.toString(),
          name: updated.name,
          url: updated.url,
          events: updated.events,
          secret: updated.secret ? '********' : null,
          isActive: updated.isActive,
          lastSentAt: updated.lastSentAt?.toISOString() || null,
          createdAt: updated.createdAt.toISOString(),
        },
      },
    })
  } catch (error) {
    console.error('Failed to update webhook:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '웹훅 수정에 실패했습니다.' } },
      { status: 500 },
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params

    const existing = await prisma.webhookConfig.findUnique({
      where: { id: BigInt(id) },
    })
    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '해당 웹훅을 찾을 수 없습니다.' } },
        { status: 404 },
      )
    }

    await prisma.webhookConfig.delete({
      where: { id: BigInt(id) },
    })

    return NextResponse.json({
      success: true,
      data: { message: '웹훅이 삭제되었습니다.' },
    })
  } catch (error) {
    console.error('Failed to delete webhook:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '웹훅 삭제에 실패했습니다.' } },
      { status: 500 },
    )
  }
}
