import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  slug: string
  page: number
  totalPages: number
}

export function Pagination({ slug, page, totalPages }: PaginationProps) {
  if (totalPages <= 1) return null

  const pages: number[] = []
  const start = Math.max(1, page - 2)
  const end = Math.min(totalPages, page + 2)
  for (let i = start; i <= end; i++) pages.push(i)

  return (
    <nav className="flex items-center justify-center gap-1">
      {page > 1 && (
        <Link
          href={`/${slug}?page=${page - 1}`}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-[#6D6C6A] hover:bg-[#E5E4E1]"
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
      )}
      {start > 1 && (
        <>
          <Link
            href={`/${slug}?page=1`}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-sm text-[#6D6C6A] hover:bg-[#E5E4E1]"
          >
            1
          </Link>
          {start > 2 && <span className="px-1 text-[#9E9D9B]">...</span>}
        </>
      )}
      {pages.map((p) => (
        <Link
          key={p}
          href={`/${slug}?page=${p}`}
          className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium ${
            p === page
              ? 'bg-[#3D8A5A] text-white'
              : 'text-[#6D6C6A] hover:bg-[#E5E4E1]'
          }`}
        >
          {p}
        </Link>
      ))}
      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="px-1 text-[#9E9D9B]">...</span>}
          <Link
            href={`/${slug}?page=${totalPages}`}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-sm text-[#6D6C6A] hover:bg-[#E5E4E1]"
          >
            {totalPages}
          </Link>
        </>
      )}
      {page < totalPages && (
        <Link
          href={`/${slug}?page=${page + 1}`}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-[#6D6C6A] hover:bg-[#E5E4E1]"
        >
          <ChevronRight className="h-4 w-4" />
        </Link>
      )}
    </nav>
  )
}
