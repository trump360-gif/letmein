import { NextResponse } from 'next/server'
import { prisma } from '@letmein/db'

export async function GET() {
  try {
    const row = await (prisma as any).$queryRaw`
      SELECT running, auto_stop_at FROM bot_control ORDER BY id DESC LIMIT 1
    `
    const ctrl = Array.isArray(row) ? row[0] : null
    return NextResponse.json({
      running: ctrl?.running ?? true,
      auto_stop_at: ctrl?.auto_stop_at ?? null,
    })
  } catch {
    return NextResponse.json({ running: true, auto_stop_at: null })
  }
}
