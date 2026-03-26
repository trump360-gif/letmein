import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'

const sungyesaPool = new Pool({
  host: process.env.SUNGYESA_HOST || 'localhost',
  port: Number(process.env.SUNGYESA_PORT || 5433),
  database: process.env.SUNGYESA_DB || 'sungyesa',
  user: process.env.SUNGYESA_USER || 'crawler',
  password: process.env.SUNGYESA_PASSWORD,
})

const beautiPool = new Pool({
  host: process.env.SUNGYESA_HOST || 'localhost',
  port: Number(process.env.SUNGYESA_PORT || 5433),
  database: process.env.BEAUTI_DB || 'beauti_admin',
  user: process.env.BEAUTI_USER || 'beauti',
  password: process.env.BEAUTI_PASSWORD,
})

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const hours = Math.min(Number(searchParams.get('hours') || 24), 72)
  const limit = Math.min(Number(searchParams.get('limit') || 100), 200)

  try {
    const { rows } = await sungyesaPool.query(
      `SELECT
        a.id::text,
        a.persona_id,
        a.action_type,
        a.post_id,
        a.title,
        a.content,
        a.created_at,
        p.name,
        p.job
      FROM kr_bot_actions a
      LEFT JOIN kr_personas p ON p.persona_id = a.persona_id
      WHERE a.created_at >= NOW() - INTERVAL '${hours} hours'
      ORDER BY a.created_at DESC
      LIMIT ${limit}`,
    )

    // post_id가 있는 것들의 board slug 조회
    const postIds = rows.filter((r) => r.post_id && !r.post_id.includes('#')).map((r) => r.post_id)
    const boardMap: Record<string, string> = {}
    if (postIds.length > 0) {
      try {
        const { rows: boardRows } = await beautiPool.query(
          `SELECT p.id::text, b.slug
           FROM posts p
           JOIN boards b ON b.id = p.board_id
           WHERE p.id = ANY($1::bigint[])`,
          [postIds],
        )
        for (const br of boardRows) {
          boardMap[br.id] = br.slug
        }
      } catch (_) { /* beauti_admin 조회 실패 시 board 없이 진행 */ }
    }

    const events = rows.map((r) => ({
      id: r.id,
      type: r.action_type,
      persona_id: r.persona_id,
      name: r.name || r.persona_id,
      archetype: r.job || '',
      detail: r.title || r.content?.slice(0, 80) || '',
      post_id: (r.post_id && !r.post_id.includes('#')) ? r.post_id : undefined,
      board: r.post_id ? boardMap[r.post_id] : undefined,
      ts: new Date(r.created_at + 'Z').toLocaleTimeString('ko-KR', {
        timeZone: 'Asia/Seoul',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }),
    }))

    return NextResponse.json({ events })
  } catch (e) {
    console.error('[bot-activity]', e)
    return NextResponse.json({ events: [] })
  }
}
