'use client'

import { usePathname } from 'next/navigation'
import { TabLayout } from '@/widgets/tab-layout'
import { BoardActions } from '@/views/boards/components/board-actions'
import { MediaActions } from '@/views/media/components/media-actions'

const tabs = [
  { label: '게시판 관리', href: '/contents/boards' },
  { label: '게시물 관리', href: '/contents/posts' },
  { label: '댓글 관리', href: '/contents/comments' },
  { label: '미디어 센터', href: '/contents/media' },
]

function getActions(pathname: string) {
  if (pathname === '/contents/boards' || pathname === '/contents') return <BoardActions />
  if (pathname.startsWith('/contents/media')) return <MediaActions />
  return undefined
}

export default function ContentsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? ''

  return (
    <TabLayout
      title="콘텐츠 관리"
      description="게시판, 게시물, 댓글, 미디어를 관리합니다."
      tabs={tabs}
      actions={getActions(pathname)}
    >
      {children}
    </TabLayout>
  )
}
