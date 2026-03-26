import { BoardEditPage } from '@/views/boards/[id]'

export default function Page({ params }: { params: { id: string } }) {
  return <BoardEditPage boardId={params.id} />
}
