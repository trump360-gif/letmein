import { NextRequest, NextResponse } from 'next/server'

// System logs are typically collected from external sources (error tracking, APM).
// This endpoint provides a mock/aggregated view. In production, integrate with
// your actual logging infrastructure (e.g., Sentry, Datadog, CloudWatch).

interface SystemLogEntry {
  id: string
  level: 'error' | 'warn' | 'info'
  type: 'error' | 'slow_query' | 'api_failure'
  message: string
  source: string
  metadata: Record<string, unknown> | null
  stackTrace: string | null
  duration: number | null
  createdAt: string
}

// In-memory store for demo. Replace with actual log aggregation.
const systemLogs: SystemLogEntry[] = []

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, Number(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || '20')))
    const level = searchParams.get('level')
    const type = searchParams.get('type')
    const source = searchParams.get('source')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const search = searchParams.get('search')

    let filtered = [...systemLogs]

    if (level) {
      filtered = filtered.filter((l) => l.level === level)
    }

    if (type) {
      filtered = filtered.filter((l) => l.type === type)
    }

    if (source) {
      filtered = filtered.filter((l) => l.source.toLowerCase().includes(source.toLowerCase()))
    }

    if (dateFrom) {
      filtered = filtered.filter((l) => new Date(l.createdAt) >= new Date(dateFrom))
    }

    if (dateTo) {
      filtered = filtered.filter((l) => new Date(l.createdAt) <= new Date(dateTo))
    }

    if (search) {
      const s = search.toLowerCase()
      filtered = filtered.filter(
        (l) =>
          l.message.toLowerCase().includes(s) ||
          l.source.toLowerCase().includes(s),
      )
    }

    // Sort by createdAt desc
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    const total = filtered.length
    const start = (page - 1) * limit
    const paged = filtered.slice(start, start + limit)

    return NextResponse.json({
      success: true,
      data: paged,
      meta: {
        total,
        page,
        limit,
        hasNext: page * limit < total,
      },
    })
  } catch (error) {
    console.error('Failed to fetch system logs:', error)
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '시스템 로그를 불러오는데 실패했습니다.' },
      },
      { status: 500 },
    )
  }
}
