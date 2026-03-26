'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Props {
  user: { nickname: string } | null
}

export function AuthButton({ user }: Props) {
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
    router.refresh()
  }

  if (user) {
    return (
      <div className="flex items-center gap-2">
        <span className="hidden md:block text-[12px] text-[#aaa]">{user.nickname}</span>
        <button
          onClick={handleLogout}
          className="text-[12px] text-[#888] hover:text-white transition-colors px-2 py-1"
        >
          로그아웃
        </button>
      </div>
    )
  }

  return (
    <Link
      href="/login"
      className="text-[12px] font-medium text-[#ccc] hover:text-white transition-colors px-3 py-1.5 rounded-sm border border-[#333] hover:border-[#555]"
    >
      로그인
    </Link>
  )
}
