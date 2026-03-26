import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@letmein/db'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> },
) {
  try {
    const { type } = await params
    const body = await request.json()
    const { email } = body as { email: string }

    if (!email) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_BODY', message: '테스트 발송할 이메일 주소가 필요합니다.' } },
        { status: 400 },
      )
    }

    const template = await prisma.emailTemplate.findUnique({ where: { type } })
    if (!template) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '해당 템플릿을 찾을 수 없습니다.' } },
        { status: 404 },
      )
    }

    // 테스트 발송을 큐에 추가 (실제 발송은 큐 프로세서가 담당)
    // 여기서는 테스트 데이터로 변수를 치환하여 큐에 넣음
    let htmlBody = template.htmlBody
    htmlBody = htmlBody.replace(/\{\{이름\}\}/g, '홍길동')
    htmlBody = htmlBody.replace(/\{\{닉네임\}\}/g, 'testuser')
    htmlBody = htmlBody.replace(/\{\{등급\}\}/g, 'VIP')
    htmlBody = htmlBody.replace(/\{\{포인트\}\}/g, '10,000')
    htmlBody = htmlBody.replace(/\{\{링크\}\}/g, 'https://example.com')
    htmlBody = htmlBody.replace(/\{\{날짜\}\}/g, new Date().toLocaleDateString('ko-KR'))
    htmlBody = htmlBody.replace(/\{\{사이트명\}\}/g, 'CMS Admin')

    // 큐에 테스트 발송 등록
    await prisma.notificationQueue.create({
      data: {
        userId: BigInt(1), // 시스템 사용자
        channel: 'email',
        priority: 1,
        subject: `[테스트] ${template.subject}`,
        body: htmlBody,
        metadata: { testEmail: email, templateType: type, isTest: true },
        status: 'pending',
        scheduledAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      data: { message: `테스트 이메일이 ${email}로 발송 대기 중입니다.` },
    })
  } catch (error) {
    console.error('Failed to send test email:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '테스트 발송에 실패했습니다.' } },
      { status: 500 },
    )
  }
}
