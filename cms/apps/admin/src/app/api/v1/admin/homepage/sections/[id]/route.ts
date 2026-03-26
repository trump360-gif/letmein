import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@letmein/db'

type Params = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const section = await prisma.homepageSection.findUnique({
      where: { id: BigInt(id) },
    })

    if (!section) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '섹션을 찾을 수 없습니다.' } },
        { status: 404 },
      )
    }

    return NextResponse.json({
      success: true,
      data: serializeSection(section),
    })
  } catch (error) {
    console.error('Failed to fetch section:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '섹션을 불러오는데 실패했습니다.' } },
      { status: 500 },
    )
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const body = await request.json()
    const { title, isActive, sortOrder, config } = body as {
      title?: string
      isActive?: boolean
      sortOrder?: number
      config?: Record<string, unknown>
    }

    const data: Record<string, unknown> = {}
    if (title !== undefined) data.title = title
    if (isActive !== undefined) data.isActive = isActive
    if (sortOrder !== undefined) data.sortOrder = sortOrder
    if (config !== undefined) data.config = config

    const section = await prisma.homepageSection.update({
      where: { id: BigInt(id) },
      data,
    })

    return NextResponse.json({
      success: true,
      data: serializeSection(section),
    })
  } catch (error) {
    console.error('Failed to update section:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '섹션 수정에 실패했습니다.' } },
      { status: 500 },
    )
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    await prisma.homepageSection.delete({
      where: { id: BigInt(id) },
    })

    return NextResponse.json({ success: true, data: null })
  } catch (error) {
    console.error('Failed to delete section:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '섹션 삭제에 실패했습니다.' } },
      { status: 500 },
    )
  }
}

function serializeSection(s: { id: bigint; type: string; title: string; config: unknown; sortOrder: number; isActive: boolean; updatedAt: Date }) {
  return {
    id: s.id.toString(),
    type: s.type,
    title: s.title,
    config: s.config as Record<string, unknown>,
    sortOrder: s.sortOrder,
    isActive: s.isActive,
    updatedAt: s.updatedAt.toISOString(),
  }
}
