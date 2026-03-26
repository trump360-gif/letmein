import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@letmein/db'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> },
) {
  try {
    const { type } = await params
    const body = await request.json()
    const { subject, htmlBody, textBody, variables } = body as {
      subject?: string
      htmlBody?: string
      textBody?: string
      variables?: string[]
    }

    const existing = await prisma.emailTemplate.findUnique({ where: { type } })
    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: '해당 템플릿을 찾을 수 없습니다.' } },
        { status: 404 },
      )
    }

    const updated = await prisma.emailTemplate.update({
      where: { type },
      data: {
        ...(subject !== undefined && { subject }),
        ...(htmlBody !== undefined && { htmlBody }),
        ...(textBody !== undefined && { textBody }),
        ...(variables !== undefined && { variables }),
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        template: {
          id: updated.id.toString(),
          type: updated.type,
          name: updated.name,
          subject: updated.subject,
          htmlBody: updated.htmlBody,
          textBody: updated.textBody,
          variables: updated.variables,
          isSystem: updated.isSystem,
          createdAt: updated.createdAt.toISOString(),
          updatedAt: updated.updatedAt.toISOString(),
        },
      },
    })
  } catch (error) {
    console.error('Failed to update email template:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '템플릿 수정에 실패했습니다.' } },
      { status: 500 },
    )
  }
}
