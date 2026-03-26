import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@letmein/db'
import { subDays, format, startOfDay, endOfDay } from 'date-fns'

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
    const periodDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    const prevStart = startOfDay(subDays(startDate, periodDays))
    const prevEnd = endOfDay(subDays(startDate, 1))

    const [dailyStats, topPosts, boardPostCounts, totalPosts, periodNewPosts, prevPeriodNewPosts] =
      await Promise.all([
        prisma.statsDaily.findMany({
          where: { date: { gte: startDate, lte: endDate } },
          orderBy: { date: 'asc' },
          select: { date: true, newPosts: true, newComments: true },
        }),
        prisma.post.findMany({
          where: {
            createdAt: { gte: startDate, lte: endDate },
            deletedAt: null,
            status: 'published',
          },
          orderBy: { viewCount: 'desc' },
          take: 10,
          include: {
            board: { select: { nameKey: true } },
          },
        }),
        prisma.post.groupBy({
          by: ['boardId'],
          where: {
            createdAt: { gte: startDate, lte: endDate },
            deletedAt: null,
          },
          _count: { id: true },
          _sum: { viewCount: true, commentCount: true },
          orderBy: { _count: { id: 'desc' } },
          take: 10,
        }),
        prisma.post.count({ where: { deletedAt: null } }),
        prisma.post.count({
          where: { createdAt: { gte: startDate, lte: endDate }, deletedAt: null },
        }),
        prisma.post.count({
          where: { createdAt: { gte: prevStart, lte: prevEnd }, deletedAt: null },
        }),
      ])

    // Fetch board names for top boards
    const boardIds = boardPostCounts.map((b) => b.boardId)
    const boards = await prisma.board.findMany({
      where: { id: { in: boardIds } },
      select: { id: true, nameKey: true },
    })
    const boardNameMap = new Map(boards.map((b) => [b.id.toString(), b.nameKey]))

    const dailyPostsData = dailyStats.map((s) => ({
      date: format(s.date, 'yyyy-MM-dd'),
      value: s.newPosts,
    }))

    const dailyCommentsData = dailyStats.map((s) => ({
      date: format(s.date, 'yyyy-MM-dd'),
      value: s.newComments,
    }))

    const topPostsData = topPosts.map((p) => ({
      id: p.id.toString(),
      title: p.title,
      boardName: p.board.nameKey,
      viewCount: p.viewCount,
      likeCount: p.likeCount,
      commentCount: p.commentCount,
      createdAt: p.createdAt.toISOString(),
    }))

    const topBoardsData = boardPostCounts.map((b) => ({
      id: b.boardId.toString(),
      name: boardNameMap.get(b.boardId.toString()) ?? '알 수 없음',
      postCount: b._count.id,
      commentCount: b._sum.commentCount ?? 0,
      viewCount: b._sum.viewCount ?? 0,
    }))

    const periodNewPostChange =
      prevPeriodNewPosts > 0
        ? Math.round(((periodNewPosts - prevPeriodNewPosts) / prevPeriodNewPosts) * 1000) / 10
        : 0

    return NextResponse.json({
      success: true,
      data: {
        dailyPosts: dailyPostsData,
        dailyComments: dailyCommentsData,
        topPosts: topPostsData,
        topBoards: topBoardsData,
        totalPosts,
        periodNewPosts,
        periodNewPostChange,
      },
    })
  } catch (error) {
    console.error('Failed to fetch post stats:', error)
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '게시물 통계를 불러오는데 실패했습니다.' },
      },
      { status: 500 },
    )
  }
}
