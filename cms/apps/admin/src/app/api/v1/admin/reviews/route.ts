import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@letmein/db'
import { getSessionAdminId } from '@/lib/session'

export async function GET(request: NextRequest) {
  try {
    const adminId = await getSessionAdminId()
    if (!adminId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다.' } },
        { status: 401 },
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // 'active' | 'blinded' | null (all)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))
    const offset = (page - 1) * limit

    // Build status filter clause
    const statusClause =
      status === 'active' || status === 'blinded'
        ? prisma.$queryRaw<Array<{ count: bigint }>>`
            SELECT COUNT(*) AS count
            FROM reviews
            WHERE status = ${status}
          `
        : prisma.$queryRaw<Array<{ count: bigint }>>`
            SELECT COUNT(*) AS count
            FROM reviews
            WHERE status != 'deleted'
          `

    const rowsQuery =
      status === 'active' || status === 'blinded'
        ? prisma.$queryRaw<
            Array<{
              id: bigint
              rating: number
              content: string
              status: string
              created_at: Date
              author_nickname: string | null
              hospital_name: string | null
            }>
          >`
            SELECT
              r.id,
              r.rating,
              r.content,
              r.status,
              r.created_at,
              u.nickname AS author_nickname,
              h.name AS hospital_name
            FROM reviews r
            LEFT JOIN users u ON u.id = r.user_id
            LEFT JOIN hospitals h ON h.id = r.hospital_id
            WHERE r.status = ${status}
            ORDER BY r.created_at DESC
            LIMIT ${limit} OFFSET ${offset}
          `
        : prisma.$queryRaw<
            Array<{
              id: bigint
              rating: number
              content: string
              status: string
              created_at: Date
              author_nickname: string | null
              hospital_name: string | null
            }>
          >`
            SELECT
              r.id,
              r.rating,
              r.content,
              r.status,
              r.created_at,
              u.nickname AS author_nickname,
              h.name AS hospital_name
            FROM reviews r
            LEFT JOIN users u ON u.id = r.user_id
            LEFT JOIN hospitals h ON h.id = r.hospital_id
            WHERE r.status != 'deleted'
            ORDER BY r.created_at DESC
            LIMIT ${limit} OFFSET ${offset}
          `

    const [countRows, rows] = await Promise.all([statusClause, rowsQuery])
    const total = Number((countRows[0] as { count: bigint }).count)

    const reviews = rows.map((r) => ({
      id: r.id.toString(),
      rating: r.rating,
      content: r.content,
      status: r.status,
      authorNickname: r.author_nickname ?? null,
      hospitalName: r.hospital_name ?? null,
      createdAt: r.created_at.toISOString(),
    }))

    return NextResponse.json({
      success: true,
      data: reviews,
      meta: {
        total,
        page,
        limit,
        hasNext: page * limit < total,
      },
    })
  } catch (error) {
    console.error('Failed to fetch admin reviews:', error)
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '리뷰 목록을 불러오는데 실패했습니다.' },
      },
      { status: 500 },
    )
  }
}
