import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@letmein/db'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const reportId = BigInt(id)

    const report = await prisma.report.findUnique({
      where: { id: reportId },
      include: {
        reporter: { select: { nickname: true } },
        processor: { select: { nickname: true } },
      },
    })

    if (!report) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: '신고를 찾을 수 없습니다.' },
        },
        { status: 404 },
      )
    }

    // Fetch target info
    let targetTitle: string | null = null
    let targetContent: string | null = null
    let targetAuthorNickname: string | null = null

    if (report.targetType === 'post') {
      const post = await prisma.post.findUnique({
        where: { id: report.targetId },
        include: { user: { select: { nickname: true } } },
      })
      if (post) {
        targetTitle = post.title
        targetContent = post.contentPlain ?? post.content.substring(0, 500)
        targetAuthorNickname = post.user?.nickname ?? null
      }
    } else if (report.targetType === 'comment') {
      const comment = await prisma.comment.findUnique({
        where: { id: report.targetId },
        include: { user: { select: { nickname: true } } },
      })
      if (comment) {
        targetContent = comment.content.substring(0, 500)
        targetAuthorNickname = comment.user?.nickname ?? null
      }
    } else if (report.targetType === 'user') {
      const user = await prisma.user.findUnique({
        where: { id: report.targetId },
        select: { nickname: true },
      })
      if (user) {
        targetAuthorNickname = user.nickname
      }
    }

    // Count total reports on same target
    const totalReportsOnTarget = await prisma.report.count({
      where: {
        targetType: report.targetType,
        targetId: report.targetId,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        id: report.id.toString(),
        reporterId: report.reporterId.toString(),
        reporterNickname: report.reporter.nickname,
        targetType: report.targetType,
        targetId: report.targetId.toString(),
        reason: report.reason,
        reasonText: report.reasonText,
        weight: Number(report.weight),
        status: report.status,
        processedBy: report.processedBy?.toString() ?? null,
        processedAt: report.processedAt?.toISOString() ?? null,
        processorNickname: report.processor?.nickname ?? null,
        createdAt: report.createdAt.toISOString(),
        targetTitle,
        targetContent,
        targetAuthorNickname,
        totalReportsOnTarget,
      },
    })
  } catch (error) {
    console.error('Failed to fetch report detail:', error)
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '신고 상세를 불러오는데 실패했습니다.' },
      },
      { status: 500 },
    )
  }
}
