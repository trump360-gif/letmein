import { PostDetailPage } from '@/views/posts/[id]'

export default function Page({ params }: { params: { id: string } }) {
  return <PostDetailPage postId={params.id} />
}
