'use client'

import Link from 'next/link'
import type { Report } from '@letmein/types'
import { Badge } from '@letmein/ui'
import {
  REPORT_TARGET_TYPES,
  REPORT_REASONS,
  REPORT_STATUS,
  REPORT_STATUS_COLORS,
} from '@/shared/lib/constants'

interface ReportTableProps {
  reports: Report[]
  isLoading: boolean
}

export function ReportTable({ reports, isLoading }: ReportTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-lg border bg-card">
        <div className="p-8 text-center text-muted-foreground">로딩 중...</div>
      </div>
    )
  }

  if (reports.length === 0) {
    return (
      <div className="rounded-lg border bg-card">
        <div className="p-8 text-center text-muted-foreground">신고 내역이 없습니다.</div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-4 py-3 text-left font-medium">ID</th>
            <th className="px-4 py-3 text-left font-medium">유형</th>
            <th className="px-4 py-3 text-left font-medium">사유</th>
            <th className="px-4 py-3 text-left font-medium">신고자</th>
            <th className="px-4 py-3 text-left font-medium">가중치</th>
            <th className="px-4 py-3 text-left font-medium">상태</th>
            <th className="px-4 py-3 text-left font-medium">접수일</th>
            <th className="px-4 py-3 text-left font-medium">처리일</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((report) => (
            <tr key={report.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
              <td className="px-4 py-3">
                <Link
                  href={`/reports/${report.id}`}
                  className="text-primary hover:underline font-medium"
                >
                  #{report.id}
                </Link>
              </td>
              <td className="px-4 py-3">
                <Badge variant="outline">
                  {REPORT_TARGET_TYPES[report.targetType as keyof typeof REPORT_TARGET_TYPES]}
                </Badge>
              </td>
              <td className="px-4 py-3">
                {REPORT_REASONS[report.reason as keyof typeof REPORT_REASONS]}
                {report.reasonText && (
                  <span className="block text-xs text-muted-foreground mt-0.5 truncate max-w-[200px]">
                    {report.reasonText}
                  </span>
                )}
              </td>
              <td className="px-4 py-3">{report.reporterNickname}</td>
              <td className="px-4 py-3">
                <span
                  className={
                    report.weight < 0.5
                      ? 'text-green-600'
                      : report.weight > 1.5
                        ? 'text-red-600 font-medium'
                        : 'text-foreground'
                  }
                >
                  {report.weight.toFixed(2)}
                </span>
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    REPORT_STATUS_COLORS[report.status as keyof typeof REPORT_STATUS_COLORS]
                  }`}
                >
                  {REPORT_STATUS[report.status as keyof typeof REPORT_STATUS]}
                </span>
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {new Date(report.createdAt).toLocaleDateString('ko-KR')}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {report.processedAt
                  ? new Date(report.processedAt).toLocaleDateString('ko-KR')
                  : '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
