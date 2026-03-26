import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@letmein/db'
import { subDays, startOfDay, endOfDay } from 'date-fns'

const FUNNEL_STAGES = [
  { stage: 'visit', label: '방문' },
  { stage: 'signup_start', label: '가입 시작' },
  { stage: 'signup_complete', label: '가입 완료' },
  { stage: 'first_post', label: '첫 게시물' },
  { stage: 'first_comment', label: '첫 댓글' },
  { stage: 'grade_up', label: '등급 승급' },
] as const

function parsePeriod(period: string | null, from: string | null, to: string | null) {
  const now = new Date()
  let startDate: Date
  let endDate = endOfDay(now)

  if (period === 'custom' && from && to) {
    startDate = startOfDay(new Date(from))
    endDate = endOfDay(new Date(to))
  } else {
    const days = period === '90d' ? 90 : period === '30d' ? 30 : 7
    startDate = startOfDay(subDays(now, days))
  }

  return { startDate, endDate }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period')
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    const { startDate, endDate } = parsePeriod(period, from, to)

    const eventCounts = await prisma.funnelEvent.groupBy({
      by: ['event'],
      where: { createdAt: { gte: startDate, lte: endDate } },
      _count: { id: true },
    })

    const countMap = new Map(eventCounts.map((e) => [e.event, e._count.id]))

    const totalVisits = countMap.get('visit') ?? 0

    const stages = FUNNEL_STAGES.map((s, index) => {
      const count = countMap.get(s.stage) ?? 0
      const prevCount = index > 0 ? (countMap.get(FUNNEL_STAGES[index - 1].stage) ?? 0) : count
      const percentage = totalVisits > 0 ? Math.round((count / totalVisits) * 1000) / 10 : 0
      const dropoff = index > 0 ? prevCount - count : 0
      const dropoffRate = prevCount > 0 ? Math.round((dropoff / prevCount) * 1000) / 10 : 0

      return {
        stage: s.stage,
        label: s.label,
        count,
        percentage,
        dropoff,
        dropoffRate,
      }
    })

    const lastStageCount = countMap.get('grade_up') ?? 0
    const overallConversion =
      totalVisits > 0 ? Math.round((lastStageCount / totalVisits) * 10000) / 100 : 0

    return NextResponse.json({
      success: true,
      data: {
        stages,
        totalVisits,
        overallConversion,
      },
    })
  } catch (error) {
    console.error('Failed to fetch funnel stats:', error)
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '퍼널 분석을 불러오는데 실패했습니다.' },
      },
      { status: 500 },
    )
  }
}
