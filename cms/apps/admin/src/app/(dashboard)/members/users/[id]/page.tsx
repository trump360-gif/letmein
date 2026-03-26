import { UserDetailPage } from '@/views/users/[id]'

export default function Page({ params }: { params: { id: string } }) {
  return <UserDetailPage userId={Number(params.id)} />
}
