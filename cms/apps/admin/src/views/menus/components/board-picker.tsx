'use client'

import { Badge } from '@letmein/ui'
import { Check, FileText, Image, Archive, HelpCircle, Video, Calendar, Vote, Info } from 'lucide-react'
import { cn } from '@letmein/utils'

const BOARD_TYPE_ICONS: Record<string, React.ElementType> = {
  general: FileText, gallery: Image, archive: Archive, qa: HelpCircle,
  video: Video, calendar: Calendar, vote: Vote,
}

interface BoardItem {
  id: string
  nameKey: string
  slug: string
  type: string
}

interface BoardPickerProps {
  boards: BoardItem[]
  selectedIds: string[]
  onToggle: (id: string) => void
  menuName: string
}

export function BoardPicker({ boards, selectedIds, onToggle, menuName }: BoardPickerProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">게시판 선택</span>
        <span className="text-xs text-muted-foreground">{selectedIds.length}개 선택됨</span>
      </div>

      <div className="flex gap-2 rounded-md border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
        <div className="text-xs text-blue-700 dark:text-blue-300">
          <p className="font-medium">GNB 메뉴 동작 안내</p>
          <ul className="mt-1 space-y-0.5">
            <li><strong>1개 선택</strong> &rarr; 메뉴 클릭 시 해당 게시판으로 바로 이동</li>
            <li><strong>2개 이상 선택</strong> &rarr; 마우스 호버 시 하위 메뉴로 표시</li>
          </ul>
        </div>
      </div>

      <div className="max-h-[240px] space-y-1 overflow-y-auto rounded-md border p-2">
        {boards.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">등록된 게시판이 없습니다.</p>
        ) : (
          boards.map((board) => {
            const isSelected = selectedIds.includes(board.id)
            const Icon = BOARD_TYPE_ICONS[board.type] ?? FileText
            return (
              <button key={board.id} type="button" onClick={() => onToggle(board.id)}
                className={cn(
                  'flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors',
                  isSelected ? 'bg-primary/10 text-primary ring-1 ring-primary/20' : 'hover:bg-accent',
                )}>
                <div className={cn(
                  'flex h-5 w-5 shrink-0 items-center justify-center rounded border',
                  isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/30',
                )}>
                  {isSelected && <Check className="h-3 w-3" />}
                </div>
                <Icon className="h-4 w-4 text-muted-foreground" />
                <span className="flex-1 font-medium">{board.nameKey}</span>
                <span className="text-xs text-muted-foreground">/{board.slug}</span>
              </button>
            )
          })
        )}
      </div>

      {/* GNB 미리보기 */}
      {selectedIds.length > 0 && (
        <div className="rounded-md border bg-muted/50 p-3">
          <p className="mb-2 text-xs font-medium text-muted-foreground">GNB 미리보기</p>
          <div className="flex items-center gap-1 rounded bg-card px-3 py-2 shadow-sm">
            {selectedIds.length === 1 ? (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{menuName || '메뉴 이름'}</span>
                <span className="text-xs text-muted-foreground">&rarr;</span>
                <span className="text-xs text-primary">{boards.find((b) => b.id === selectedIds[0])?.nameKey ?? '게시판'}</span>
                <Badge variant="secondary" className="text-[10px]">바로가기</Badge>
              </div>
            ) : (
              <div className="w-full">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{menuName || '메뉴 이름'}</span>
                  <Badge variant="secondary" className="text-[10px]">드롭다운</Badge>
                </div>
                <div className="mt-1.5 ml-3 space-y-1 border-l-2 border-primary/20 pl-3">
                  {selectedIds.map((id) => {
                    const board = boards.find((b) => b.id === id)
                    return <div key={id} className="text-xs text-muted-foreground">{board?.nameKey ?? id}</div>
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
