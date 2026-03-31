import { NextResponse } from 'next/server'
import { prisma } from '@letmein/db'
import { getSessionHospitalId } from '@/lib/session'

export async function GET() {
  try {
    const hospitalId = await getSessionHospitalId()
    if (!hospitalId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다.' } },
        { status: 401 },
      )
    }

    const rows = await prisma.$queryRaw<
      Array<{
        id: bigint
        rating: number
        content: string
        status: string
        created_at: Date
        author_nickname: string | null
        image_urls: string | null
      }>
    >`
      SELECT
        r.id,
        r.rating,
        r.content,
        r.status,
        r.created_at,
        u.nickname AS author_nickname,
        (
          SELECT string_agg(ri.url, ',' ORDER BY ri.sort_order)
          FROM review_images ri
          WHERE ri.review_id = r.id
        ) AS image_urls
      FROM reviews r
      LEFT JOIN users u ON u.id = r.user_id
      WHERE r.hospital_id = ${hospitalId}
      ORDER BY r.created_at DESC
    `

    const reviews = rows.map((r) => ({
      id: r.id.toString(),
      rating: r.rating,
      content: r.content,
      status: r.status,
      authorNickname: r.author_nickname ?? null,
      imageUrls: r.image_urls ? r.image_urls.split(',') : [],
      createdAt: r.created_at.toISOString(),
    }))

    return NextResponse.json({
      success: true,
      data: {
        reviews,
        total: reviews.length,
      },
    })
  } catch (error) {
    console.error('Failed to fetch hospital reviews:', error)
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '리뷰 목록을 불러오는데 실패했습니다.' },
      },
      { status: 500 },
    )
  }
}
