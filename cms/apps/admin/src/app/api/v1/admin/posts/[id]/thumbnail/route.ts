import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  _request: NextRequest,
  { params: _params }: { params: { id: string } },
) {
  return NextResponse.json(
    { success: false, error: { code: 'NOT_AVAILABLE', message: 'AI 썸네일 생성 기능은 LetMeIn CMS에서 비활성화되었습니다.' } },
    { status: 501 },
  )
}
