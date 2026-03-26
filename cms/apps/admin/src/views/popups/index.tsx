'use client'

import { useState } from 'react'
import { Button, Badge, Switch, Card, CardContent } from '@letmein/ui'
import {
  Pencil,
  Trash2,
  MessageSquare,
} from 'lucide-react'
import {
  POPUP_TYPE_LABELS,
  POPUP_DISPLAY_SCOPE_LABELS,
  POPUP_ANIMATION_LABELS,
} from '@letmein/types'
import type { PopupItem, PopupType, PopupDisplayScope, PopupAnimation } from '@letmein/types'
import { usePopups, useTogglePopup, useDeletePopup } from '@/features/popup-manage'
import { PopupFormDialog } from './components/popup-form-dialog'

export function PopupsPage() {
  const [activeFilter, setActiveFilter] = useState<string>('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPopup, setEditingPopup] = useState<PopupItem | null>(null)

  const { data, isLoading } = usePopups({
    isActive: activeFilter || undefined,
  })
  const togglePopup = useTogglePopup()
  const deletePopup = useDeletePopup()

  function handleEdit(popup: PopupItem) {
    setEditingPopup(popup)
    setDialogOpen(true)
  }

  function handleDelete(id: string, name: string) {
    if (confirm(`"${name}" 팝업을 삭제하시겠습니까?`)) {
      deletePopup.mutate(id)
    }
  }

  function handleDialogChange(open: boolean) {
    setDialogOpen(open)
    if (!open) setEditingPopup(null)
  }

  const popups = data?.popups ?? []

  return (
    <div className="space-y-6">
      {data && (
        <span className="text-sm text-muted-foreground">총 {data.total}개</span>
      )}

      {/* 필터 */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground shrink-0">상태</span>
          <div className="flex flex-wrap gap-1">
            {[
              { value: '', label: '전체' },
              { value: 'true', label: '활성' },
              { value: 'false', label: '비활성' },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setActiveFilter(opt.value)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  activeFilter === opt.value
                    ? 'bg-foreground text-background'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 팝업 목록 */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : popups.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">등록된 팝업이 없습니다.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {popups.map((popup) => {
            const now = new Date()
            const isExpired = popup.endsAt && new Date(popup.endsAt) < now
            const isUpcoming = popup.startsAt && new Date(popup.startsAt) > now

            return (
              <Card key={popup.id} className={`${!popup.isActive ? 'opacity-60' : ''}`}>
                <CardContent className="space-y-3 p-4">
                  {/* 헤더 */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium">{popup.name}</h3>
                      <div className="mt-1 flex flex-wrap gap-1">
                        <Badge variant="outline" className="text-xs">
                          {POPUP_TYPE_LABELS[popup.type as PopupType]}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {POPUP_DISPLAY_SCOPE_LABELS[popup.displayScope as PopupDisplayScope]}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {POPUP_ANIMATION_LABELS[popup.animation as PopupAnimation]}
                        </Badge>
                        {popup.abGroup && (
                          <Badge variant="secondary" className="text-xs">
                            A/B {popup.abGroup}
                          </Badge>
                        )}
                        {isExpired && (
                          <Badge variant="destructive" className="text-xs">만료됨</Badge>
                        )}
                        {isUpcoming && (
                          <Badge className="text-xs bg-yellow-100 text-yellow-800">예약됨</Badge>
                        )}
                      </div>
                    </div>
                    <Switch
                      checked={popup.isActive}
                      onCheckedChange={() => togglePopup.mutate(popup.id)}
                      className="scale-75"
                    />
                  </div>

                  {/* 정보 */}
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <p>
                      크기: {popup.widthPx} x {popup.heightPx}px | 위치: ({popup.posX}%, {popup.posY}%)
                    </p>
                    <p>우선순위: {popup.priority} | 최대 표시: {popup.maxDisplay}회</p>
                    {(popup.startsAt || popup.endsAt) && (
                      <p>
                        기간: {popup.startsAt?.split('T')[0] ?? '~'} ~ {popup.endsAt?.split('T')[0] ?? '~'}
                      </p>
                    )}
                  </div>

                  {/* 위치 미리보기 */}
                  <div className="relative h-20 rounded border bg-muted">
                    <div
                      className="absolute rounded border border-primary bg-primary/10"
                      style={{
                        left: `${popup.posX}%`,
                        top: `${popup.posY}%`,
                        transform: 'translate(-50%, -50%)',
                        width: `${Math.min(popup.widthPx / 15, 60)}%`,
                        height: `${Math.min(popup.heightPx / 15, 60)}%`,
                      }}
                    />
                  </div>

                  {/* 액션 */}
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(popup)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(popup.id, popup.name)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <PopupFormDialog
        open={dialogOpen}
        onOpenChange={handleDialogChange}
        popup={editingPopup}
      />
    </div>
  )
}
