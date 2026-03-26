'use client'

import { useState, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Button,
  Label,
} from '@letmein/ui'
import { Download, FileSpreadsheet, FileText } from 'lucide-react'
import { fetchStatsExport } from '@/features/analytics'
import type { ExportTarget, ExportFormat, StatsRequestParams } from '@letmein/types'

interface ExportDialogProps {
  params: StatsRequestParams
}

const EXPORT_TARGETS: { value: ExportTarget; label: string }[] = [
  { value: 'summary', label: '전체 요약' },
  { value: 'users', label: '회원 통계' },
  { value: 'posts', label: '게시물 통계' },
  { value: 'reports', label: '신고 통계' },
  { value: 'banners', label: '배너 통계' },
  { value: 'notifications', label: '알림 통계' },
  { value: 'funnel', label: '퍼널 분석' },
]

export function ExportDialog({ params }: ExportDialogProps) {
  const [open, setOpen] = useState(false)
  const [target, setTarget] = useState<ExportTarget>('summary')
  const [format, setFormat] = useState<ExportFormat>('csv')
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = useCallback(async () => {
    setIsExporting(true)
    try {
      const result = await fetchStatsExport(target, format, params)

      // Create blob and download
      const blob = new Blob([result.data], { type: result.mimeType })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = result.filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setOpen(false)
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setIsExporting(false)
    }
  }, [target, format, params])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          내보내기
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>통계 내보내기</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>대상 선택</Label>
            <div className="grid grid-cols-2 gap-2">
              {EXPORT_TARGETS.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTarget(t.value)}
                  className={`rounded-md border px-3 py-2 text-sm transition-colors ${
                    target === t.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:bg-accent'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>형식</Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setFormat('csv')}
                className={`flex items-center gap-2 rounded-md border px-4 py-2 text-sm transition-colors ${
                  format === 'csv'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border hover:bg-accent'
                }`}
              >
                <FileText className="h-4 w-4" />
                CSV
              </button>
              <button
                type="button"
                onClick={() => setFormat('xlsx')}
                className={`flex items-center gap-2 rounded-md border px-4 py-2 text-sm transition-colors ${
                  format === 'xlsx'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border hover:bg-accent'
                }`}
              >
                <FileSpreadsheet className="h-4 w-4" />
                Excel
              </button>
            </div>
          </div>

          <div className="rounded-md bg-muted p-3 text-xs text-muted-foreground">
            <p>
              기간: {params.period === '7d' && '최근 7일'}
              {params.period === '30d' && '최근 30일'}
              {params.period === '90d' && '최근 90일'}
              {params.period === 'custom' && `${params.from} ~ ${params.to}`}
              {!params.period && '최근 7일'}
            </p>
          </div>

          <Button onClick={handleExport} disabled={isExporting} className="w-full">
            {isExporting ? '내보내는 중...' : '다운로드'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
