import { NextResponse } from 'next/server'
import { prisma } from '@letmein/db'

export async function GET() {
  try {
    const templates = await prisma.emailTemplate.findMany({
      orderBy: { type: 'asc' },
    })

    return NextResponse.json({
      success: true,
      data: {
        templates: templates.map((t) => ({
          id: t.id.toString(),
          type: t.type,
          name: t.name,
          subject: t.subject,
          htmlBody: t.htmlBody,
          textBody: t.textBody,
          variables: t.variables,
          isSystem: t.isSystem,
          createdAt: t.createdAt.toISOString(),
          updatedAt: t.updatedAt.toISOString(),
        })),
      },
    })
  } catch (error) {
    console.error('Failed to fetch email templates:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '이메일 템플릿을 불러오는데 실패했습니다.' } },
      { status: 500 },
    )
  }
}
