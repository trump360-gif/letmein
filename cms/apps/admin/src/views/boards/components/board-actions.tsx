'use client'

import { useState } from 'react'
import { Plus, FolderPlus } from 'lucide-react'
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle } from '@letmein/ui'
import type { BoardGroup, BoardCreateInput } from '@letmein/types'
import { useCreateBoard, useBoardGroups, useBoardTree } from '@/features/board-manage'
import { BoardForm } from './board-form'
import { BoardGroupDialog } from './board-group-dialog'

export function BoardActions() {
  const createMutation = useCreateBoard()
  const { data: groups } = useBoardGroups()
  const { data: treeData } = useBoardTree()

  const [groupDialogOpen, setGroupDialogOpen] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState<BoardGroup | null>(null)

  const allBoards = treeData
    ? [
        ...treeData.groups.flatMap((g) =>
          g.boards.map((b) => ({ id: b.id, nameKey: b.nameKey, slug: b.slug })),
        ),
        ...treeData.ungrouped.map((b) => ({ id: b.id, nameKey: b.nameKey, slug: b.slug })),
      ]
    : []

  const handleAddGroup = () => {
    setEditingGroup(null)
    setGroupDialogOpen(true)
  }

  const handleCreateBoard = async (formData: Record<string, unknown>) => {
    try {
      await createMutation.mutateAsync(formData as unknown as BoardCreateInput)
      setCreateDialogOpen(false)
    } catch (error) {
      alert(error instanceof Error ? error.message : '게시판 생성에 실패했습니다.')
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={handleAddGroup}>
        <FolderPlus className="mr-1.5 h-3.5 w-3.5" />
        대분류 추가
      </Button>
      <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
        <Plus className="mr-1.5 h-3.5 w-3.5" />
        게시판 생성
      </Button>

      <BoardGroupDialog
        open={groupDialogOpen}
        onOpenChange={setGroupDialogOpen}
        group={editingGroup}
      />

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-4xl top-[5vh] translate-y-0 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>게시판 생성</DialogTitle>
          </DialogHeader>
          <BoardForm
            groups={groups ?? []}
            boards={allBoards}
            onSubmit={handleCreateBoard}
            isLoading={createMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
