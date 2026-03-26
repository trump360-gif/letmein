import { Search } from 'lucide-react'

interface BoardHeaderProps {
  nameKey: string
  description: string | null
}

export function BoardHeader({ nameKey, description }: BoardHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#1A1918]">{nameKey}</h1>
        {description && (
          <p className="mt-1 text-sm text-[#6D6C6A]">{description}</p>
        )}
      </div>
      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9E9D9B]" />
          <input
            type="text"
            placeholder="검색"
            className="h-10 w-[240px] rounded-lg border border-[#E5E4E1] bg-white pl-9 pr-4 text-sm text-[#1A1918] placeholder:text-[#9E9D9B] focus:border-[#3D8A5A] focus:outline-none"
          />
        </div>
      </div>
    </div>
  )
}
