'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@letmein/ui'
import Link from 'next/link'
import { useCreateBoard, useBoardGroups, useBoardTree } from '@/features/board-manage'
import type { BoardCreateInput } from '@letmein/types'
import { BoardForm } from '../components/board-form'

export function BoardCreatePage() {
  const router = useRouter()
  const createMutation = useCreateBoard()
  const { data: groups, isLoading: groupsLoading } = useBoardGroups()
  const { data: treeData, isLoading: treeLoading } = useBoardTree()

  const isLoading = groupsLoading || treeLoading

  // 게시판 목록을 flat으로 변환 (상위 게시판 선택용)
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
      const board = await createMutation.mutateAsync(data as unknown as BoardCreateInput)
      router.push('/contents/boards')
    } catch (error) {
      alert(error instanceof Error ? error.message : '게시판 생성에 실패했습니다.')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/contents/boards">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h2 className="text-2xl font-bold">게시판 생성</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            새 게시판을 만들고 상세 설정을 구성합니다.
          </p>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <BoardForm
          groups={groups ?? []}
          boards={allBoards}
          onSubmit={handleSubmit}
          isLoading={createMutation.isPending}
        />
      </div>
    </div>
  )
}
