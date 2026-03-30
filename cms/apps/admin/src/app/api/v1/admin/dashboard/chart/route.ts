import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@letmein/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const days = Math.min(90, Math.max(7, parseInt(searchParams.get('days') || '7')))

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    startDate.setHours(0, 0, 0, 0)

    // 일별 상담 요청 수
    const consultations = await prisma.$queryRaw<Array<{ date: string; count: bigint }>>`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM consultation_requests
      WHERE created_at >= ${startDate}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `

    // 일별 신규 유저 수
    const users = await prisma.$queryRaw<Array<{ date: string; count: bigint }>>`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM users
      WHERE created_at >= ${startDate}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `

    // 날짜 배열 생성
    const daily: Array<{ date: string; consultations: number; newUsers: number }> = []
    const consultMap = new Map(consultations.map((c) => [
      new Date(c.date).toISOString().split('T')[0],
      Number(c.count),
    ]))
    const userMap = new Map(users.map((u) => [
      new Date(u.date).toISOString().split('T')[0],
      Number(u.count),
    ]))

    const cursor = new Date(startDate)
    const today = new Date()
    while (cursor <= today) {
      const dateStr = cursor.toISOString().split('T')[0]
      daily.push({
        date: dateStr,
        consultations: consultMap.get(dateStr) ?? 0,
        newUsers: userMap.get(dateStr) ?? 0,
      })
      cursor.setDate(cursor.getDate() + 1)
    }

    return NextResponse.json({
      success: true,
      data: { daily },
    })
  } catch (error) {
    console.error('Failed to fetch chart data:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '차트 데이터를 불러오는데 실패했습니다.' } },
      { status: 500 },
    )
  }
}
