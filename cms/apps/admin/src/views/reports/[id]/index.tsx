'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Shield, AlertTriangle, Clock, CheckCircle2, XCircle } from 'lucide-react'
import { Button, Badge } from '@letmein/ui'
import { useReportDetail } from '@/features/report-handle'
import { ReportProcessDialog } from '../components/report-process-dialog'
import {
  REPORT_TARGET_TYPES,
  REPORT_REASONS,
  REPORT_STATUS,
  REPORT_STATUS_COLORS,
} from '@/shared/lib/constants'

interface ReportDetailPageProps {
  reportId: string
}

export function ReportDetailPage({ reportId }: ReportDetailPageProps) {
  const router = useRouter()
  const { data, isLoading, refetch } = useReportDetail(reportId)
  const [processDialogOpen, setProcessDialogOpen] = useState(false)

  const report = data?.data

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            돌아가기
          </Button>
        </div>
        <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
          로딩 중...
        </div>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            돌아가기
          </Button>
        </div>
        <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
          신고를 찾을 수 없습니다.
        </div>
      </div>
    )
  }

  const statusIcon =
    report.status === 'pending' ? (
      <Clock className="h-5 w-5 text-yellow-600" />
    ) : report.status === 'processed' ? (
      <CheckCircle2 className="h-5 w-5 text-green-600" />
    ) : (
      <XCircle className="h-5 w-5 text-gray-500" />
    )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            돌아가기
          </Button>
          <h2 className="text-2xl font-bold">신고 #{report.id}</h2>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
              REPORT_STATUS_COLORS[report.status as keyof typeof REPORT_STATUS_COLORS]
            }`}
          >
            {statusIcon}
            {REPORT_STATUS[report.status as keyof typeof REPORT_STATUS]}
          </span>
        </div>
        {report.status === 'pending' && (
          <Button onClick={() => setProcessDialogOpen(true)}>
            <Shield className="h-4 w-4 mr-1" />
            처리하기
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Report Info */}
        <div className="rounded-lg border bg-card p-5 space-y-4">
          <h3 className="font-semibold text-lg">신고 정보</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">신고 유형</span>
              <p className="font-medium mt-0.5">
                <Badge variant="outline">
                  {REPORT_TARGET_TYPES[report.targetType as keyof typeof REPORT_TARGET_TYPES]}
                </Badge>
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">신고 사유</span>
              <p className="font-medium mt-0.5">
                {REPORT_REASONS[report.reason as keyof typeof REPORT_REASONS]}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">신고자</span>
              <p className="font-medium mt-0.5">{report.reporterNickname}</p>
            </div>
            <div>
              <span className="text-muted-foreground">신고 가중치</span>
              <p
                className={`font-medium mt-0.5 ${
                  report.weight < 0.5
                    ? 'text-green-600'
                    : report.weight > 1.5
                      ? 'text-red-600'
                      : ''
                }`}
              >
                {report.weight.toFixed(2)}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">접수일</span>
              <p className="font-medium mt-0.5">
                {new Date(report.createdAt).toLocaleString('ko-KR')}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">동일 대상 누적</span>
              <p className="font-medium mt-0.5">
                <span className={report.totalReportsOnTarget >= 5 ? 'text-red-600' : ''}>
                  {report.totalReportsOnTarget}건
                </span>
              </p>
            </div>
          </div>
          {report.reasonText && (
            <div>
              <span className="text-sm text-muted-foreground">상세 사유</span>
              <p className="mt-1 text-sm rounded-md bg-muted/50 p-3">{report.reasonText}</p>
            </div>
          )}
        </div>

        {/* Target Info */}
        <div className="rounded-lg border bg-card p-5 space-y-4">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            신고 대상
          </h3>
          <div className="space-y-3 text-sm">
            {report.targetAuthorNickname && (
              <div>
                <span className="text-muted-foreground">작성자</span>
                <p className="font-medium mt-0.5">{report.targetAuthorNickname}</p>
              </div>
            )}
            {report.targetTitle && (
              <div>
                <span className="text-muted-foreground">제목</span>
                <p className="font-medium mt-0.5">{report.targetTitle}</p>
              </div>
            )}
            {report.targetContent && (
              <div>
                <span className="text-muted-foreground">내용</span>
                <div className="mt-1 rounded-md bg-muted/50 p-3 text-sm whitespace-pre-wrap max-h-[200px] overflow-y-auto">
                  {report.targetContent}
                </div>
              </div>
            )}
            <div>
              <span className="text-muted-foreground">대상 ID</span>
              <p className="font-mono text-xs mt-0.5">{report.targetId}</p>
            </div>
          </div>
        </div>

        {/* Processing Info (if processed) */}
        {report.status !== 'pending' && (
          <div className="rounded-lg border bg-card p-5 space-y-4 lg:col-span-2">
            <h3 className="font-semibold text-lg">처리 정보</h3>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">처리자</span>
                <p className="font-medium mt-0.5">{report.processorNickname ?? '-'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">처리일</span>
                <p className="font-medium mt-0.5">
                  {report.processedAt
                    ? new Date(report.processedAt).toLocaleString('ko-KR')
                    : '-'}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">처리 결과</span>
                <p className="font-medium mt-0.5">
                  {REPORT_STATUS[report.status as keyof typeof REPORT_STATUS]}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Process Dialog */}
      {report.status === 'pending' && (
        <ReportProcessDialog
          report={report}
          open={processDialogOpen}
          onOpenChange={setProcessDialogOpen}
          onSuccess={() => refetch()}
        />
      )}
    </div>
  )
}
