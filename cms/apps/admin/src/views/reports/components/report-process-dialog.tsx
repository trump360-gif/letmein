'use client'

import { useState } from 'react'
import {
  Button,
  Label,
  Input,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@letmein/ui'
import type { ReportDetail, ReportAction, SanctionType } from '@letmein/types'
import { useProcessReport } from '@/features/report-handle'
import { REPORT_ACTIONS, SANCTION_TYPES } from '@/shared/lib/constants'

interface ReportProcessDialogProps {
  report: ReportDetail
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function ReportProcessDialog({
  report,
  open,
  onOpenChange,
  onSuccess,
}: ReportProcessDialogProps) {
  const [action, setAction] = useState<ReportAction>('blind')
  const [applySanction, setApplySanction] = useState(false)
  const [sanctionType, setSanctionType] = useState<SanctionType>('warning')
  const [sanctionReason, setSanctionReason] = useState('')

  const processReport = useProcessReport()

  const handleSubmit = async () => {
    await processReport.mutateAsync({
      id: report.id,
      data: {
        action,
        ...(applySanction
          ? {
              sanctionType,
              sanctionReason: sanctionReason || undefined,
            }
          : {}),
      },
    })
    onOpenChange(false)
    onSuccess?.()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>신고 처리</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Target info */}
          <div className="rounded-lg border bg-muted/30 p-3 space-y-1">
            <p className="text-sm font-medium">
              신고 대상: {report.targetType === 'post' ? '게시물' : report.targetType === 'comment' ? '댓글' : '유저'}
              {report.targetAuthorNickname && ` (${report.targetAuthorNickname})`}
            </p>
            {report.targetTitle && (
              <p className="text-sm text-muted-foreground truncate">{report.targetTitle}</p>
            )}
            {report.targetContent && (
              <p className="text-xs text-muted-foreground line-clamp-2">{report.targetContent}</p>
            )}
            <p className="text-xs text-muted-foreground">
              동일 대상 누적 신고: {report.totalReportsOnTarget}건
            </p>
          </div>

          {/* Action selection */}
          <div className="space-y-2">
            <Label>처리 방법</Label>
            <div className="flex gap-2">
              {(Object.entries(REPORT_ACTIONS) as [ReportAction, string][]).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setAction(value)}
                  className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                    action === value
                      ? value === 'dismiss'
                        ? 'border-gray-500 bg-gray-100 text-gray-800'
                        : value === 'delete'
                          ? 'border-red-500 bg-red-50 text-red-700'
                          : 'border-yellow-500 bg-yellow-50 text-yellow-700'
                      : 'border-border hover:bg-muted'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Optional sanction */}
          {action !== 'dismiss' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="apply-sanction"
                  checked={applySanction}
                  onChange={(e) => setApplySanction(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="apply-sanction">유저 제재 함께 적용</Label>
              </div>

              {applySanction && (
                <div className="space-y-3 pl-6 border-l-2 border-muted">
                  <div className="space-y-2">
                    <Label>제재 유형</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(SANCTION_TYPES).map(([value, label]) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setSanctionType(value as SanctionType)}
                          className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                            sanctionType === value
                              ? 'bg-foreground text-background'
                              : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>제재 사유 (선택)</Label>
                    <Input
                      value={sanctionReason}
                      onChange={(e) => setSanctionReason(e.target.value)}
                      placeholder="제재 사유를 입력하세요"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={processReport.isPending}
            variant={action === 'dismiss' ? 'outline' : action === 'delete' ? 'destructive' : 'default'}
          >
            {processReport.isPending ? '처리 중...' : '처리하기'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
