import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@letmein/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const days = Math.min(90, Math.max(7, parseInt(searchParams.get('days') || '7')))

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    startDate.setHours(0, 0, 0, 0)

    // StatsDaily 테이블에서 기간별 데이터 조회
    const statsDaily = await prisma.statsDaily.findMany({
      where: {
        date: { gte: startDate },
      },
      orderBy: { date: 'asc' },
    })

    // 게시판별 활성도 (최근 기간 동안 게시물 수 기준 상위 10개)
    const boardActivity = await prisma.post.groupBy({
      by: ['boardId'],
      where: {
        createdAt: { gte: startDate },
        deletedAt: null,
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    })

    // 게시판 이름 조회
    const boardIds = boardActivity.map((b) => b.boardId)
    const boards = await prisma.board.findMany({
      where: { id: { in: boardIds } },
      select: { id: true, slug: true, nameKey: true },
    })

    const boardMap = new Map(boards.map((b) => [Number(b.id), b]))

    // AI 로그 일별 집계
    const aiLogs = await prisma.autoPostLog.findMany({
      where: { executedAt: { gte: startDate } },
      select: { status: true, executedAt: true },
    })

    // 날짜별로 그룹핑
    const aiByDate = new Map<string, { success: number; failed: number }>()
    for (const log of aiLogs) {
      const dateStr = log.executedAt.toISOString().split('T')[0]
      const entry = aiByDate.get(dateStr) ?? { success: 0, failed: 0 }
      if (log.status === 'SUCCESS') entry.success++
      else entry.failed++
      aiByDate.set(dateStr, entry)
    }

    // startDate부터 오늘까지 날짜 배열 생성
    const aiDaily: Array<{ date: string; success: number; failed: number }> = []
    const cursor = new Date(startDate)
    const todayEnd = new Date()
    while (cursor <= todayEnd) {
      const dateStr = cursor.toISOString().split('T')[0]
      const entry = aiByDate.get(dateStr) ?? { success: 0, failed: 0 }
      aiDaily.push({ date: dateStr, ...entry })
      cursor.setDate(cursor.getDate() + 1)
    }

    return NextResponse.json({
      success: true,
      data: {
        // 일별 추이 데이터
        daily: statsDaily.map((s) => ({
          date: s.date.toISOString().split('T')[0],
          newUsers: s.newUsers,
          newPosts: s.newPosts,
          newComments: s.newComments,
          newReports: s.newReports,
          activeUsers: s.activeUsers,
        })),
        // AI 생성 추이
        aiDaily,
        // 게시판별 활성도
        boardActivity: boardActivity.map((b) => {
          const board = boardMap.get(Number(b.boardId))
          return {
            boardId: b.boardId.toString(),
            name: board?.nameKey ?? board?.slug ?? `Board #${b.boardId}`,
            postCount: b._count.id,
          }
        }),
      },
    })
  } catch (error) {
    console.error('Failed to fetch dashboard chart data:', error)
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '차트 데이터를 불러오는데 실패했습니다.' },
      },
      { status: 500 },
    )
  }
}
