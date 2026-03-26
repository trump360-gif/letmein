import { NextResponse } from 'next/server'
import { prisma } from '@letmein/db'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  const startTime = Date.now()

  const checks: Record<string, { status: string; latency?: number; error?: string }> = {}

  // Database check
  try {
    const dbStart = Date.now()
    await prisma.$queryRaw`SELECT 1`
    checks.database = {
      status: 'ok',
      latency: Date.now() - dbStart
    }
  } catch (error) {
    checks.database = {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }

  const allHealthy = Object.values(checks).every(c => c.status === 'ok')

  return NextResponse.json({
    status: allHealthy ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '0.0.0',
    uptime: process.uptime(),
    checks,
    latency: Date.now() - startTime
  }, {
    status: allHealthy ? 200 : 503
  })
}
