'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Label,
  Input,
} from '@letmein/ui'
import { Download } from 'lucide-react'
import { exportActivityLogs } from '@/features/admin-manage'
import { ADMIN_MODULES } from '@letmein/types'
import type { AdminActivityLogSearchParams } from '@letmein/types'

interface ExportDialogProps {
  open: boolean
  onClose: () => void
  currentParams: AdminActivityLogSearchParams
}

export function ExportDialog({ open, onClose, currentParams }: ExportDialogProps) {
  const [format, setFormat] = useState<'csv' | 'json'>('csv')
  const [dateFrom, setDateFrom] = useState(currentParams.dateFrom || '')
  const [dateTo, setDateTo] = useState(currentParams.dateTo || '')
  const [module, setModule] = useState(currentParams.module || '')
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const params: Record<string, string> = { format }
      if (dateFrom) params.dateFrom = dateFrom
      if (dateTo) params.dateTo = dateTo
      if (module) params.module = module
      if (currentParams.adminId) params.adminId = currentParams.adminId
      if (currentParams.action) params.action = currentParams.action
      if (currentParams.targetType) params.targetType = currentParams.targetType
      if (currentParams.ipAddress) params.ipAddress = currentParams.ipAddress

      const blob = await exportActivityLogs(params)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `activity-logs-${new Date().toISOString().slice(0, 10)}.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      onClose()
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>활동 로그 내보내기</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>형식</Label>
            <div className="mt-1 flex gap-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="format"
                  value="csv"
                  checked={format === 'csv'}
                  onChange={() => setFormat('csv')}
                />
                CSV
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="format"
                  value="json"
                  checked={format === 'json'}
                  onChange={() => setFormat('json')}
                />
                JSON
              </label>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="export-from">시작일</Label>
              <Input
                id="export-from"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="export-to">종료일</Label>
              <Input
                id="export-to"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label>모듈</Label>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {[{ key: '', label: '전체' }, ...ADMIN_MODULES].map((m) => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setModule(m.key)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    module === m.key
                      ? 'bg-foreground text-background'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            최대 10,000건까지 내보낼 수 있습니다. 현재 검색 필터가 적용됩니다.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            <Download className="mr-1 h-4 w-4" />
            {isExporting ? '내보내는 중...' : '내보내기'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
