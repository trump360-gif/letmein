'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function HomeLink() {
  const pathname = usePathname()
  const isActive = pathname === '/'

  return (
    <Link
      href="/"
      className={`relative rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-[#F5F4F1] hover:text-[#3D8A5A] ${
        isActive ? 'text-[#3D8A5A]' : 'text-[#6D6C6A]'
      }`}
      aria-current={isActive ? 'page' : undefined}
    >
      홈
      {isActive && (
        <span className="absolute -bottom-1 left-1/2 h-0.5 w-5 -translate-x-1/2 rounded-full bg-[#3D8A5A]" />
      )}
    </Link>
  )
}
