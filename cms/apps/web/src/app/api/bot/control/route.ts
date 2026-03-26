import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@letmein/db'

export async function POST(request: NextRequest) {
  const secret = process.env.BOT_API_SECRET || ''
  const auth = request.headers.get('Authorization') || ''
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { action } = await request.json()
  if (action !== 'start' && action !== 'stop') {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  const running = action === 'start'
  const autoStopAt = running
    ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7일 후
    : null

  await (prisma as any).$executeRaw`
    UPDATE bot_control SET running = ${running}, auto_stop_at = ${autoStopAt}, updated_at = NOW()
  `

  return NextResponse.json({
    status: running ? 'running' : 'stopped',
    auto_stop_at: autoStopAt,
  })
}
