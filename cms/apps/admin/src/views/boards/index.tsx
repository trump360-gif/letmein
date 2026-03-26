'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import type { BoardTreeGroup, BoardGroup } from '@letmein/types'
import { useBoardTree, useDeleteBoardGroup } from '@/features/board-manage'
import { BoardTree } from './components/board-tree'
import { BoardGroupDialog } from './components/board-group-dialog'

export function BoardsPage() {
  const { data, isLoading, error } = useBoardTree()
  const deleteGroupMutation = useDeleteBoardGroup()

  const [groupDialogOpen, setGroupDialogOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState<BoardGroup | null>(null)

  const handleEditGroup = (group: BoardTreeGroup) => {
    setEditingGroup({
      id: group.id,
      nameKey: group.nameKey,
      sortOrder: group.sortOrder,
      isVisible: group.isVisible,
      createdAt: '',
      updatedAt: '',
    })
    setGroupDialogOpen(true)
  }

  const handleDeleteGroup = async (id: string) => {
    try {
      await deleteGroupMutation.mutateAsync(id)
    } catch (error) {
      alert(error instanceof Error ? error.message : '대분류 삭제에 실패했습니다.')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-6 text-center">
        <p className="text-destructive">게시판 목록을 불러오는데 실패했습니다.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {error instanceof Error ? error.message : '알 수 없는 오류'}
        </p>
      </div>
    )
  }

  return (
    <>
      {data && (
        <BoardTree
          groups={data.groups}
          ungrouped={data.ungrouped}
          onEditGroup={handleEditGroup}
          onDeleteGroup={handleDeleteGroup}
        />
      )}

      <BoardGroupDialog
        open={groupDialogOpen}
        onOpenChange={setGroupDialogOpen}
        group={editingGroup}
      />
    </>
  )
}
