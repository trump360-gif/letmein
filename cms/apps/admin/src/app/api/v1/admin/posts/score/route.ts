import { NextRequest, NextResponse } from 'next/server'

export async function POST(_request: NextRequest) {
  return NextResponse.json(
    { success: false, error: { code: 'NOT_AVAILABLE', message: 'AI 점수 평가 기능은 LetMeIn CMS에서 비활성화되었습니다.' } },
    { status: 501 },
  )
}
