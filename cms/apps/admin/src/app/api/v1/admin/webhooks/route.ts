import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@letmein/db'

export async function GET() {
  try {
    const webhooks = await prisma.webhookConfig.findMany({
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      success: true,
      data: {
        webhooks: webhooks.map((w) => ({
          id: w.id.toString(),
          name: w.name,
          url: w.url,
          events: w.events,
          secret: w.secret ? '********' : null,
          isActive: w.isActive,
          lastSentAt: w.lastSentAt?.toISOString() || null,
          createdAt: w.createdAt.toISOString(),
        })),
      },
    })
  } catch (error) {
    console.error('Failed to fetch webhooks:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '웹훅 목록을 불러오는데 실패했습니다.' } },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, url, events, secret, isActive } = body as {
      name: string
      url: string
      events: string[]
      secret?: string
      isActive?: boolean
    }

    if (!name || !url || !events || events.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_BODY', message: '이름, URL, 이벤트는 필수입니다.' } },
        { status: 400 },
      )
    }

    const webhook = await prisma.webhookConfig.create({
      data: {
        name,
        url,
        events,
        secret: secret || null,
        isActive: isActive ?? true,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        webhook: {
          id: webhook.id.toString(),
          name: webhook.name,
          url: webhook.url,
          events: webhook.events,
          secret: webhook.secret ? '********' : null,
          isActive: webhook.isActive,
          lastSentAt: webhook.lastSentAt?.toISOString() || null,
          createdAt: webhook.createdAt.toISOString(),
        },
      },
    })
  } catch (error) {
    console.error('Failed to create webhook:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '웹훅 생성에 실패했습니다.' } },
      { status: 500 },
    )
  }
}
