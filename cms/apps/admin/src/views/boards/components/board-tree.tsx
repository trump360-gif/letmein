'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  GripVertical,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  FolderOpen,
  FileText,
  Image,
  Archive,
  HelpCircle,
  Video,
  Calendar,
  Vote,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@letmein/ui'
import { cn } from '@letmein/utils'
import type { BoardTreeGroup, BoardTreeItem, BoardType } from '@letmein/types'
import { BOARD_TYPE_LABELS } from '@letmein/types'
import { useReorderBoards, useDeleteBoard, useDeleteBoardGroup } from '@/features/board-manage'
import { useSettings } from '@/features/settings'

// ==================== Board Type Icons ====================

const BOARD_TYPE_ICONS: Record<BoardType, React.ElementType> = {
  general: FileText,
  gallery: Image,
  archive: Archive,
  qa: HelpCircle,
  video: Video,
  calendar: Calendar,
  vote: Vote,
}

// ==================== Sortable Board Item ====================

function SortableBoardItem({
  board,
  depth = 0,
  onEdit,
  onDelete,
  siteUrl,
}: {
  board: BoardTreeItem
  depth?: number
  onEdit: (id: string) => void
  onDelete: (id: string, name: string) => void
  siteUrl?: string
}) {
  const hasChildren = board.children && board.children.length > 0

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: board.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const Icon = BOARD_TYPE_ICONS[board.type] ?? FileText

  return (
    <div ref={setNodeRef} style={style}>
      <div
        className={cn(
          'flex items-center gap-2 rounded-md border bg-card px-3 py-2 transition-colors hover:bg-accent/50',
          isDragging && 'opacity-50 shadow-lg',
        )}
        style={{ marginLeft: depth * 24 }}
      >
        <button
          className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <Icon className="h-4 w-4 text-muted-foreground" />

        <span className="flex-1 text-sm font-medium">{board.nameKey}</span>

        <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
          {BOARD_TYPE_LABELS[board.type] ?? board.type}
        </span>

        {siteUrl ? (
          <a
            href={`${siteUrl}/board/${board.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-primary hover:bg-primary/10 hover:underline transition-colors"
          >
            /{board.slug}
            <ExternalLink className="h-3 w-3" />
          </a>
        ) : (
          <span className="text-xs text-muted-foreground">/{board.slug}</span>
        )}

        {board._count && (
          <span className="text-xs text-muted-foreground">
            {board._count.posts}개 글
          </span>
        )}

        {board.isVisible ? (
          <Eye className="h-3.5 w-3.5 text-muted-foreground" />
        ) : (
          <EyeOff className="h-3.5 w-3.5 text-orange-500" />
        )}

        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          title="게시판 설정"
          onClick={() => onEdit(board.id)}
        >
          <Edit className="h-3.5 w-3.5" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-destructive hover:text-destructive"
          title="삭제"
          onClick={() => onDelete(board.id, board.nameKey)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {hasChildren && (
        <div className="mt-1 space-y-1">
          <SortableContext items={board.children.map((c) => c.id)} strategy={verticalListSortingStrategy}>
            {board.children.map((child) => (
              <SortableBoardItem
                key={child.id}
                board={child}
                depth={depth + 1}
                onEdit={onEdit}
                onDelete={onDelete}
                siteUrl={siteUrl}
              />
            ))}
          </SortableContext>
        </div>
      )}
    </div>
  )
}

// ==================== Board Tree ====================

interface BoardTreeProps {
  groups: BoardTreeGroup[]
  ungrouped: BoardTreeItem[]
  onEditGroup: (group: BoardTreeGroup) => void
  onDeleteGroup: (id: string, name: string) => void
}

const PER_PAGE = 10

export function BoardTree({ groups, ungrouped, onEditGroup, onDeleteGroup }: BoardTreeProps) {
  const router = useRouter()
  const reorderMutation = useReorderBoards()
  const deleteBoardMutation = useDeleteBoard()
  const [page, setPage] = useState(0)
  const { data: settingsData } = useSettings()
  const siteUrl = useMemo(() => {
    const found = settingsData?.settings?.find((s) => s.key === 'siteUrl')
    return found?.value?.replace(/\/+$/, '') || ''
  }, [settingsData])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  // 모든 게시판을 플랫 리스트로 (그룹 라벨 포함)
  const flatItems = useMemo(() => {
    const items: Array<
      | { type: 'group-header'; group: BoardTreeGroup }
      | { type: 'board'; board: BoardTreeItem; groupId: string | null }
    > = []
    for (const group of groups) {
      items.push({ type: 'group-header', group })
      for (const board of group.boards) {
        items.push({ type: 'board', board, groupId: group.id })
      }
    }
    for (const board of ungrouped) {
      items.push({ type: 'board', board, groupId: null })
    }
    return items
  }, [groups, ungrouped])

  const boardCount = flatItems.filter((i) => i.type === 'board').length
  const totalPages = Math.max(1, Math.ceil(boardCount / PER_PAGE))

  // 현재 페이지에 보여줄 게시판만 필터
  const pagedItems = useMemo(() => {
    let boardIdx = 0
    const start = page * PER_PAGE
    const end = start + PER_PAGE
    const result: typeof flatItems = []
    let lastGroupHeader: (typeof flatItems)[number] | null = null

    for (const item of flatItems) {
      if (item.type === 'group-header') {
        lastGroupHeader = item
        continue
      }
      if (boardIdx >= start && boardIdx < end) {
        if (lastGroupHeader) {
          result.push(lastGroupHeader)
          lastGroupHeader = null
        }
        result.push(item)
      }
      boardIdx++
    }
    return result
  }, [flatItems, page])

  const handleEdit = (id: string) => {
    router.push(`/contents/boards/${id}`)
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`"${name}" 게시판을 삭제하시겠습니까?`)) return
    try {
      await deleteBoardMutation.mutateAsync(id)
    } catch (error) {
      alert(error instanceof Error ? error.message : '삭제에 실패했습니다.')
    }
  }

  const handleDeleteGroupClick = (id: string, name: string) => {
    if (!confirm(`"${name}" 대분류를 삭제하시겠습니까?`)) return
    onDeleteGroup(id, name)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    for (const group of groups) {
      const boardIds = group.boards.map((b) => b.id)
      const oldIndex = boardIds.indexOf(String(active.id))
      const newIndex = boardIds.indexOf(String(over.id))

      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = arrayMove(group.boards, oldIndex, newIndex)
        const items = reordered.map((b, i) => ({
          id: b.id,
          sortOrder: i,
          groupId: group.id,
        }))
        reorderMutation.mutate({ items })
        return
      }
    }

    const ungroupedIds = ungrouped.map((b) => b.id)
    const oldIdx = ungroupedIds.indexOf(String(active.id))
    const newIdx = ungroupedIds.indexOf(String(over.id))
    if (oldIdx !== -1 && newIdx !== -1) {
      const reordered = arrayMove(ungrouped, oldIdx, newIdx)
      const items = reordered.map((b, i) => ({
        id: b.id,
        sortOrder: i,
        groupId: null,
      }))
      reorderMutation.mutate({ items })
    }
  }

  if (boardCount === 0) {
    return (
      <div className="rounded-lg border bg-card p-12 text-center">
        <FileText className="mx-auto h-12 w-12 text-muted-foreground/30" />
        <h3 className="mt-4 text-lg font-medium">게시판이 없습니다</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          새 게시판을 만들어 콘텐츠를 관리해보세요.
        </p>
      </div>
    )
  }

  // 현재 페이지의 보드 ID 목록 (DnD용)
  const currentBoardIds = pagedItems
    .filter((i): i is Extract<typeof i, { type: 'board' }> => i.type === 'board')
    .map((i) => i.board.id)

  return (
    <div className="space-y-4">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={currentBoardIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-1">
            {pagedItems.map((item) => {
              if (item.type === 'group-header') {
                const group = item.group
                return (
                  <div key={`gh-${group.id}`} className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2 mt-3 first:mt-0">
                    <FolderOpen className="h-4 w-4 text-primary" />
                    <span className="flex-1 text-sm font-semibold">{group.nameKey}</span>
                    {!group.isVisible && (
                      <span className="rounded bg-orange-100 px-1.5 py-0.5 text-xs text-orange-700">숨김</span>
                    )}
                    <span className="text-xs text-muted-foreground">{group.boards.length}개</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onEditGroup(group)}>
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => handleDeleteGroupClick(group.id, group.nameKey)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )
              }
              return (
                <SortableBoardItem
                  key={item.board.id}
                  board={item.board}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  siteUrl={siteUrl}
                />
              )
            })}
          </div>
        </SortableContext>
      </DndContext>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {Array.from({ length: totalPages }, (_, i) => (
            <Button
              key={i}
              variant={i === page ? 'default' : 'outline'}
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setPage(i)}
            >
              {i + 1}
            </Button>
          ))}
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={page === totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
