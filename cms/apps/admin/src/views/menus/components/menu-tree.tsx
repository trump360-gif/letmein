'use client'

import { useMemo } from 'react'
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
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button, Badge, Switch } from '@letmein/ui'
import {
  GripVertical,
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  ExternalLink,
  FileText,
} from 'lucide-react'
import type { MenuItem, MenuLocation } from '@letmein/types'
import { LINK_TYPE_LABELS, BADGE_TYPE_LABELS } from '@letmein/types'
import { useReorderMenus, useDeleteMenu, useUpdateMenu } from '@/features/menu-manage'

interface MenuTreeProps {
  menus: MenuItem[]
  location: MenuLocation
  onEdit: (menu: MenuItem) => void
  onAddChild: (parentId: string) => void
}

function flattenTree(items: MenuItem[]): MenuItem[] {
  const result: MenuItem[] = []
  for (const item of items) {
    result.push(item)
  }
  return result
}

interface SortableMenuItemProps {
  menu: MenuItem
  depth: number
  onEdit: (menu: MenuItem) => void
  onAddChild: (parentId: string) => void
  onDelete: (id: string) => void
  onToggleVisible: (menu: MenuItem) => void
}

function SortableMenuItem({
  menu,
  depth,
  onEdit,
  onAddChild,
  onDelete,
  onToggleVisible,
}: SortableMenuItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: menu.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const hasChildren = menu.children && menu.children.length > 0

  return (
    <div ref={setNodeRef} style={style}>
      <div
        className={`flex items-center gap-2 rounded-md border bg-card px-3 py-2 ${
          isDragging ? 'shadow-lg' : ''
        }`}
        style={{ marginLeft: depth * 24 }}
      >
        <button {...attributes} {...listeners} className="cursor-grab text-muted-foreground">
          <GripVertical className="h-4 w-4" />
        </button>

        <span className={`flex-1 text-sm font-medium ${!menu.isVisible ? 'text-muted-foreground line-through' : ''}`}>
          {menu.nameKey}
        </span>

        <span className="text-xs text-muted-foreground">
          {LINK_TYPE_LABELS[menu.linkType as keyof typeof LINK_TYPE_LABELS]}
        </span>

        {menu.board && (
          <Badge variant="outline" className="gap-1 text-xs">
            <FileText className="h-3 w-3" />
            {menu.board.nameKey}
          </Badge>
        )}

        {menu.linkUrl && (
          <span className="max-w-[120px] truncate text-xs text-muted-foreground">
            {menu.linkUrl}
          </span>
        )}

        {menu.openNewTab && <ExternalLink className="h-3 w-3 text-muted-foreground" />}

        {menu.badgeType && (
          <Badge variant="secondary" className="text-xs">
            {BADGE_TYPE_LABELS[menu.badgeType as keyof typeof BADGE_TYPE_LABELS] ?? menu.badgeText}
          </Badge>
        )}

        <span className="text-xs text-muted-foreground">
          등급 {menu.minGrade}-{menu.maxGrade}
        </span>

        <Switch
          checked={menu.isVisible}
          onCheckedChange={() => onToggleVisible(menu)}
          className="scale-75"
        />

        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            const url = menu.linkUrl || '/'
            window.open(`http://localhost:3000${url.startsWith('/') ? url : `/${url}`}`, '_blank')
          }}
          title="새창가기"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onAddChild(menu.id)} title="하위 메뉴 추가">
          <Plus className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onEdit(menu)} title="수정">
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(menu.id)}
          title="삭제"
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Children - 항상 펼쳐진 상태 */}
      {hasChildren && (
        <div className="mt-1 space-y-1">
          {menu.children!.map((child) => (
            <SortableMenuItem
              key={child.id}
              menu={child}
              depth={depth + 1}
              onEdit={onEdit}
              onAddChild={onAddChild}
              onDelete={onDelete}
              onToggleVisible={onToggleVisible}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function MenuTree({ menus, location, onEdit, onAddChild }: MenuTreeProps) {
  const reorderMenus = useReorderMenus()
  const deleteMenuMutation = useDeleteMenu()
  const updateMenuMutation = useUpdateMenu()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const topLevelIds = useMemo(() => menus.map((m) => m.id), [menus])

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = topLevelIds.indexOf(active.id as string)
    const newIndex = topLevelIds.indexOf(over.id as string)
    if (oldIndex === -1 || newIndex === -1) return

    const newOrder = arrayMove(menus, oldIndex, newIndex)
    const items = newOrder.map((m, i) => ({ id: m.id, sortOrder: i }))
    reorderMenus.mutate({ items })
  }

  function handleDelete(id: string) {
    if (confirm('이 메뉴를 삭제하시겠습니까? 하위 메뉴는 상위로 이동됩니다.')) {
      deleteMenuMutation.mutate(id)
    }
  }

  function handleToggleVisible(menu: MenuItem) {
    updateMenuMutation.mutate({
      id: menu.id,
      payload: { isVisible: !menu.isVisible },
    })
  }

  if (menus.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
        <p className="text-muted-foreground">등록된 메뉴가 없습니다.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          위의 &quot;메뉴 추가&quot; 버튼으로 새 메뉴를 만드세요.
        </p>
      </div>
    )
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={topLevelIds} strategy={verticalListSortingStrategy}>
        <div className="space-y-1">
          {menus.map((menu) => (
            <SortableMenuItem
              key={menu.id}
              menu={menu}
              depth={0}
              onEdit={onEdit}
              onAddChild={onAddChild}
              onDelete={handleDelete}
              onToggleVisible={handleToggleVisible}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
