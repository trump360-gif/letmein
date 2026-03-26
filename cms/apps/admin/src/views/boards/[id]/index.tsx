'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, BarChart3 } from 'lucide-react'
import { Button } from '@letmein/ui'
import Link from 'next/link'
import {
  useBoard,
  useUpdateBoard,
  useBoardGroups,
  useBoardTree,
} from '@/features/board-manage'
import type { BoardUpdateInput } from '@letmein/types'
import { BoardForm } from '../components/board-form'

interface BoardEditPageProps {
  boardId: string
}

export function BoardEditPage({ boardId }: BoardEditPageProps) {
  const router = useRouter()
  const { data: board, isLoading: boardLoading, error } = useBoard(boardId)
  const updateMutation = useUpdateBoard()
  const { data: groups, isLoading: groupsLoading } = useBoardGroups()
  const { data: treeData, isLoading: treeLoading } = useBoardTree()

  const isLoading = boardLoading || groupsLoading || treeLoading

  const allBoards = treeData
    ? [
        ...treeData.groups.flatMap((g) =>
          g.boards.map((b) => ({ id: b.id, nameKey: b.nameKey, slug: b.slug })),
        ),
        ...treeData.ungrouped.map((b) => ({ id: b.id, nameKey: b.nameKey, slug: b.slug })),
      ]
    : []

  const handleSubmit = async (data: Record<string, unknown>) => {
    try {
      await updateMutation.mutateAsync({
        id: boardId,
        data: data as unknown as BoardUpdateInput,
      })
      router.push('/contents/boards')
    } catch (error) {
      alert(error instanceof Error ? error.message : '게시판 수정에 실패했습니다.')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !board) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/contents/boards">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h2 className="text-2xl font-bold">게시판을 찾을 수 없습니다</h2>
        </div>
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-6 text-center">
          <p className="text-destructive">
            {error instanceof Error ? error.message : '해당 게시판이 존재하지 않습니다.'}
          </p>
        </div>
      </div>
    )
  }

  // 통계 정보 (board에 stats가 있다면)
  const stats = (board as unknown as { stats?: { postCount: number; commentCount: number; likeCount: number } }).stats

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/contents/boards">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h2 className="text-2xl font-bold">{board.nameKey}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              /{board.fullPath}
            </p>
          </div>
        </div>
      </div>

      {/* 통계 카드 */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          <div className="flex items-center gap-3 rounded-lg border bg-card p-4">
            <BarChart3 className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">게시물 수</p>
              <p className="text-xl font-bold">{stats.postCount.toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border bg-card p-4">
            <BarChart3 className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">댓글 수</p>
              <p className="text-xl font-bold">{stats.commentCount.toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border bg-card p-4">
            <BarChart3 className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">좋아요 수</p>
              <p className="text-xl font-bold">{stats.likeCount.toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-lg border bg-card p-6">
        <BoardForm
          board={board}
          groups={groups ?? []}
          boards={allBoards}
          onSubmit={handleSubmit}
          isLoading={updateMutation.isPending}
        />
      </div>
    </div>
  )
}
