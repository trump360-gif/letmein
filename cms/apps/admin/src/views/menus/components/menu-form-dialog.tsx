'use client'

import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
  Button, Input, Label, Switch,
} from '@letmein/ui'
import {
  MENU_LOCATION_VALUES, MENU_LOCATION_LABELS,
  LINK_TYPE_VALUES, LINK_TYPE_LABELS,
  BADGE_TYPE_VALUES, BADGE_TYPE_LABELS,
  GRADE_LABELS,
} from '@letmein/types'
import type { MenuItem, MenuLocation, LinkType, BoardTreeItem } from '@letmein/types'
import { useCreateMenu, useUpdateMenu, deleteMenu as deleteMenuApi } from '@/features/menu-manage'
import { useBoardTree } from '@/features/board-manage'
import {
  Monitor, PanelLeft, CreditCard,
  Link2, ExternalLink, LayoutGrid, Ban,
} from 'lucide-react'
import { cn } from '@letmein/utils'
import { BoardPicker } from './board-picker'

// ==================== Icons ====================

const LOCATION_ICONS: Record<string, React.ElementType> = { gnb: Monitor, sidebar: PanelLeft, footer: CreditCard }
const LINK_TYPE_ICONS: Record<string, React.ElementType> = { internal: Link2, external: ExternalLink, board: LayoutGrid, none: Ban }

// ==================== Schema ====================

const menuSchema = z.object({
  nameKey: z.string().min(1, '메뉴 이름을 입력하세요'),
  location: z.enum(MENU_LOCATION_VALUES),
  linkType: z.enum(LINK_TYPE_VALUES),
  linkUrl: z.string().nullable().optional(),
  openNewTab: z.boolean(),
  icon: z.string().nullable().optional(),
  minGrade: z.number().min(0).max(9),
  maxGrade: z.number().min(0).max(9),
  badgeType: z.string().nullable().optional(),
  badgeText: z.string().nullable().optional(),
  badgeColor: z.string().nullable().optional(),
  badgeExpiresAt: z.string().nullable().optional(),
  isVisible: z.boolean(),
})

type MenuFormValues = z.infer<typeof menuSchema>

// ==================== Props ====================

interface MenuFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  menu?: MenuItem | null
  parentId?: string | null
  location: MenuLocation
}

// ==================== Component ====================

export function MenuFormDialog({ open, onOpenChange, menu, parentId, location }: MenuFormDialogProps) {
  const isEdit = !!menu
  const createMenu = useCreateMenu()
  const updateMenu = useUpdateMenu()
  const { data: boardData } = useBoardTree()
  const [selectedBoardIds, setSelectedBoardIds] = useState<string[]>([])

  const allBoards = useMemo(() => {
    if (!boardData) return []
    const boards: { id: string; nameKey: string; slug: string; type: string }[] = []
    function flattenBoards(items: BoardTreeItem[]) {
      for (const item of items) {
        boards.push({ id: item.id, nameKey: item.nameKey, slug: item.slug, type: item.type })
        if (item.children?.length) flattenBoards(item.children)
      }
    }
    for (const group of boardData.groups) flattenBoards(group.boards)
    flattenBoards(boardData.ungrouped)
    return boards
  }, [boardData])

  const form = useForm<MenuFormValues>({
    resolver: zodResolver(menuSchema),
    defaultValues: {
      nameKey: '', location, linkType: 'internal', linkUrl: '', openNewTab: false,
      icon: '', minGrade: 0, maxGrade: 9, badgeType: '', badgeText: '',
      badgeColor: '#ff0000', badgeExpiresAt: '', isVisible: true,
    },
  })

  useEffect(() => {
    if (!open) return
    let initialLinkType: LinkType = (menu?.linkType as LinkType) ?? 'internal'
    let initialBoardIds: string[] = []
    if (menu?.linkType === 'board' && menu?.boardId) {
      initialBoardIds = [menu.boardId]
    } else if (menu?.children?.length) {
      const childBoardIds = menu.children.filter((c) => c.linkType === 'board' && c.boardId).map((c) => c.boardId!)
      if (childBoardIds.length > 0) { initialBoardIds = childBoardIds; initialLinkType = 'board' }
    }
    setSelectedBoardIds(initialBoardIds)
    form.reset({
      nameKey: menu?.nameKey ?? '', location: menu?.location ?? location, linkType: initialLinkType,
      linkUrl: menu?.linkUrl ?? '', openNewTab: menu?.openNewTab ?? false, icon: menu?.icon ?? '',
      minGrade: menu?.minGrade ?? 0, maxGrade: menu?.maxGrade ?? 9, badgeType: menu?.badgeType ?? '',
      badgeText: menu?.badgeText ?? '', badgeColor: menu?.badgeColor ?? '#ff0000',
      badgeExpiresAt: menu?.badgeExpiresAt?.split('T')[0] ?? '', isVisible: menu?.isVisible ?? true,
    })
  }, [open, menu, location, form])

  const watchLinkType = form.watch('linkType')
  const watchBadgeType = form.watch('badgeType')
  const watchLocation = form.watch('location')
  const watchMinGrade = form.watch('minGrade')
  const watchMaxGrade = form.watch('maxGrade')
  const watchOpenNewTab = form.watch('openNewTab')
  const watchIsVisible = form.watch('isVisible')
  const watchNameKey = form.watch('nameKey')

  function toggleBoard(boardId: string) {
    setSelectedBoardIds((prev) => prev.includes(boardId) ? prev.filter((id) => id !== boardId) : [...prev, boardId])
  }

  async function onSubmit(values: MenuFormValues) {
    try {
      const basePayload = {
        ...values, parentId: parentId ?? menu?.parentId ?? null,
        linkUrl: values.linkUrl || null, icon: values.icon || null,
        badgeType: values.badgeType || null, badgeText: values.badgeText || null,
        badgeColor: values.badgeColor || null, badgeExpiresAt: values.badgeExpiresAt || null,
      }

      if (values.linkType === 'board' && selectedBoardIds.length > 0) {
        if (selectedBoardIds.length === 1) {
          const payload = { ...basePayload, boardId: selectedBoardIds[0], linkType: 'board' as const }
          if (isEdit && menu) await updateMenu.mutateAsync({ id: menu.id, payload })
          else await createMenu.mutateAsync(payload)
        } else {
          const parentPayload = { ...basePayload, linkType: 'none' as const, boardId: null, linkUrl: null }
          const targetParentId = isEdit && menu
            ? (await updateMenu.mutateAsync({ id: menu.id, payload: parentPayload }), menu.id)
            : (await createMenu.mutateAsync(parentPayload)).id

          // 기존 자식 메뉴 삭제 (수정 시)
          if (isEdit && menu?.children?.length) {
            const existingBoardChildren = menu.children.filter((c) => c.linkType === 'board' && c.boardId)
            await Promise.all(existingBoardChildren.map((child) => deleteMenuApi(child.id).catch(() => {})))
          }

          // 자식 메뉴 병렬 생성
          await Promise.all(selectedBoardIds.map((boardId, i) => {
            const board = allBoards.find((b) => b.id === boardId)
            return createMenu.mutateAsync({
              parentId: targetParentId, location: values.location,
              nameKey: board?.nameKey ?? `게시판 ${i + 1}`,
              linkType: 'board', boardId, sortOrder: i, isVisible: true,
            })
          }))
        }
      } else {
        const payload = { ...basePayload, boardId: null }
        if (isEdit && menu) await updateMenu.mutateAsync({ id: menu.id, payload })
        else await createMenu.mutateAsync(payload)
      }

      onOpenChange(false)
      form.reset()
      setSelectedBoardIds([])
    } catch { /* error handled by mutation */ }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? '메뉴 수정' : '메뉴 추가'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* 메뉴 이름 + 위치 */}
          <div className="flex gap-3">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="nameKey">메뉴 이름 *</Label>
              <Input id="nameKey" {...form.register('nameKey')} placeholder="메뉴 이름" />
              {form.formState.errors.nameKey && <p className="text-xs text-red-500">{form.formState.errors.nameKey.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>위치</Label>
              <div className="flex gap-1">
                {MENU_LOCATION_VALUES.map((loc) => {
                  const Icon = LOCATION_ICONS[loc]
                  return (
                    <button key={loc} type="button" onClick={() => form.setValue('location', loc)}
                      className={cn('inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                        watchLocation === loc ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground')}
                      title={MENU_LOCATION_LABELS[loc]}>
                      {Icon && <Icon className="h-3.5 w-3.5" />}
                      <span className="hidden sm:inline">{MENU_LOCATION_LABELS[loc].split(' ')[0]}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* 링크 타입 + URL */}
          <div className="space-y-1.5">
            <Label>링크</Label>
            <div className="flex gap-2">
              <div className="flex shrink-0 gap-1">
                {LINK_TYPE_VALUES.map((lt) => {
                  const Icon = LINK_TYPE_ICONS[lt]
                  return (
                    <button key={lt} type="button"
                      onClick={() => { form.setValue('linkType', lt); if (lt !== 'board') setSelectedBoardIds([]) }}
                      className={cn('inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                        watchLinkType === lt ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground')}
                      title={LINK_TYPE_LABELS[lt]}>
                      {Icon && <Icon className="h-3.5 w-3.5" />}
                      <span className="hidden sm:inline">{LINK_TYPE_LABELS[lt].replace(' 링크', '')}</span>
                    </button>
                  )
                })}
              </div>
              {(watchLinkType === 'internal' || watchLinkType === 'external') && (
                <Input {...form.register('linkUrl')} placeholder={watchLinkType === 'external' ? 'https://...' : '/path'} className="min-w-0 flex-1" />
              )}
            </div>
          </div>

          {/* 게시판 선택 */}
          {watchLinkType === 'board' && (
            <BoardPicker boards={allBoards} selectedIds={selectedBoardIds} onToggle={toggleBoard} menuName={watchNameKey} />
          )}

          {/* 아이콘 + 새탭 + 노출 */}
          <div className="flex items-end gap-3">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="icon">아이콘</Label>
              <Input id="icon" {...form.register('icon')} placeholder="lucide 아이콘명" className="h-9" />
            </div>
            <label className="flex cursor-pointer items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium">
              <Switch id="openNewTab" checked={watchOpenNewTab} onCheckedChange={(checked) => form.setValue('openNewTab', checked)} className="scale-75" />
              새 탭
            </label>
            <label className="flex cursor-pointer items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium">
              <Switch id="isVisible" checked={watchIsVisible} onCheckedChange={(checked) => form.setValue('isVisible', checked)} className="scale-75" />
              노출
            </label>
          </div>

          {/* 등급 범위 */}
          <div className="space-y-1.5">
            <Label>등급 범위</Label>
            <div className="flex items-center gap-2">
              <div className="flex flex-1 flex-wrap gap-1">
                {Object.entries(GRADE_LABELS).map(([grade, gradeLabel]) => {
                  const num = Number(grade)
                  const inRange = num >= watchMinGrade && num <= watchMaxGrade
                  return (
                    <button key={grade} type="button"
                      onClick={() => {
                        if (num === watchMinGrade && num === watchMaxGrade) return
                        if (num <= watchMinGrade) form.setValue('minGrade', num)
                        else if (num >= watchMaxGrade) form.setValue('maxGrade', num)
                        else form.setValue('maxGrade', num)
                      }}
                      onContextMenu={(e) => { e.preventDefault(); form.setValue('minGrade', num) }}
                      className={cn('rounded-full px-2 py-1 text-xs font-medium transition-colors',
                        inRange ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground')}
                      title="좌클릭: 최대 등급 / 우클릭: 최소 등급">
                      {gradeLabel}
                    </button>
                  )
                })}
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">{watchMinGrade}-{watchMaxGrade}</span>
            </div>
          </div>

          {/* 뱃지 설정 */}
          <div className="space-y-2">
            <Label>뱃지</Label>
            <div className="flex flex-wrap gap-1.5">
              <button type="button" onClick={() => form.setValue('badgeType', '')}
                className={cn('inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                  !watchBadgeType ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground')}>
                없음
              </button>
              {BADGE_TYPE_VALUES.map((bt) => (
                <button key={bt} type="button" onClick={() => form.setValue('badgeType', bt)}
                  className={cn('inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                    watchBadgeType === bt ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground')}>
                  {BADGE_TYPE_LABELS[bt]}
                </button>
              ))}
            </div>
          </div>

          {watchBadgeType === 'custom' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="badgeText">뱃지 텍스트</Label>
                <Input id="badgeText" {...form.register('badgeText')} placeholder="텍스트" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="badgeColor">뱃지 색상</Label>
                <div className="flex gap-2">
                  <Input id="badgeColor" type="color" className="h-10 w-14 p-1" {...form.register('badgeColor')} />
                  <Input {...form.register('badgeColor')} placeholder="#ff0000" className="flex-1" />
                </div>
              </div>
            </div>
          )}

          {watchBadgeType && (
            <div className="space-y-2">
              <Label htmlFor="badgeExpiresAt">뱃지 만료일</Label>
              <Input id="badgeExpiresAt" type="date" {...form.register('badgeExpiresAt')} />
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>취소</Button>
            <Button type="submit" disabled={createMenu.isPending || updateMenu.isPending}>
              {createMenu.isPending || updateMenu.isPending ? '저장 중...' : isEdit ? '메뉴 수정' : '메뉴 추가'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
