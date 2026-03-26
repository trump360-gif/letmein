'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Badge,
} from '@letmein/ui'
import { formatDateTime } from '@letmein/utils'
import type { AdminActivityLog } from '@letmein/types'

interface LogDetailDialogProps {
  log: AdminActivityLog
  open: boolean
  onClose: () => void
}

function DiffView({
  before,
  after,
}: {
  before: Record<string, unknown> | null
  after: Record<string, unknown> | null
}) {
  if (!before && !after) return null

  const allKeys = new Set<string>()
  if (before) Object.keys(before).forEach((k) => allKeys.add(k))
  if (after) Object.keys(after).forEach((k) => allKeys.add(k))

  const keys = Array.from(allKeys).sort()

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-3 py-2 text-left font-medium">필드</th>
            <th className="px-3 py-2 text-left font-medium text-red-600">변경 전</th>
            <th className="px-3 py-2 text-left font-medium text-green-600">변경 후</th>
          </tr>
        </thead>
        <tbody>
          {keys.map((key) => {
            const beforeVal = before ? JSON.stringify(before[key] ?? '-', null, 2) : '-'
            const afterVal = after ? JSON.stringify(after[key] ?? '-', null, 2) : '-'
            const changed = beforeVal !== afterVal

            return (
              <tr
                key={key}
                className={`border-b ${changed ? 'bg-yellow-50 dark:bg-yellow-900/10' : ''}`}
              >
                <td className="whitespace-nowrap px-3 py-1.5 font-mono font-medium">
                  {key}
                  {changed && (
                    <Badge variant="secondary" className="ml-2 text-[10px]">
                      변경
                    </Badge>
                  )}
                </td>
                <td className={`px-3 py-1.5 font-mono ${changed ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400' : ''}`}>
                  <pre className="max-w-[300px] overflow-auto whitespace-pre-wrap break-all">
                    {beforeVal}
                  </pre>
                </td>
                <td className={`px-3 py-1.5 font-mono ${changed ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : ''}`}>
                  <pre className="max-w-[300px] overflow-auto whitespace-pre-wrap break-all">
                    {afterVal}
                  </pre>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export function LogDetailDialog({ log, open, onClose }: LogDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-h-[80vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>활동 로그 상세</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Log metadata */}
          <div className="grid grid-cols-2 gap-4 rounded-lg border bg-muted/30 p-4 text-sm">
            <div>
              <span className="text-muted-foreground">관리자:</span>{' '}
              <span className="font-medium">{log.adminNickname}</span>{' '}
              <span className="text-xs text-muted-foreground">({log.adminEmail})</span>
            </div>
            <div>
              <span className="text-muted-foreground">시각:</span>{' '}
              <span className="font-medium">{formatDateTime(log.createdAt)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">액션:</span>{' '}
              <Badge variant="secondary">{log.action}</Badge>
            </div>
            <div>
              <span className="text-muted-foreground">모듈:</span>{' '}
              <span className="font-medium">{log.module}</span>
            </div>
            {log.targetType && (
              <div>
                <span className="text-muted-foreground">대상:</span>{' '}
                <span className="font-medium">
                  {log.targetType}
                  {log.targetId && ` #${log.targetId}`}
                </span>
              </div>
            )}
            {log.ipAddress && (
              <div>
                <span className="text-muted-foreground">IP:</span>{' '}
                <span className="font-mono text-xs">{log.ipAddress}</span>
              </div>
            )}
            {log.userAgent && (
              <div className="col-span-2">
                <span className="text-muted-foreground">User Agent:</span>{' '}
                <span className="break-all text-xs">{log.userAgent}</span>
              </div>
            )}
          </div>

          {/* Diff View */}
          {(log.beforeData || log.afterData) && (
            <div>
              <h4 className="mb-2 font-medium">변경 내역 (Before / After)</h4>
              <DiffView before={log.beforeData} after={log.afterData} />
            </div>
          )}

          {/* Raw JSON fallback */}
          {!log.beforeData && !log.afterData && (
            <div className="text-center text-sm text-muted-foreground">
              변경 데이터가 기록되지 않은 로그입니다.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
