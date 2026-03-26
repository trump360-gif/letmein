export default function BoardLoading() {
  return (
    <div className="mx-auto max-w-[960px] space-y-5 px-6 py-10">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-40 animate-pulse rounded-lg bg-[#E5E4E1]" />
          <div className="h-4 w-64 animate-pulse rounded bg-[#F0F0EE]" />
        </div>
        <div className="h-10 w-[240px] animate-pulse rounded-lg bg-[#E5E4E1]" />
      </div>
      <div className="overflow-hidden rounded-xl border border-[#E5E4E1] bg-white">
        <div className="border-b border-[#E5E4E1] bg-[#F5F4F1] px-5 py-3">
          <div className="h-4 w-full animate-pulse rounded bg-[#E5E4E1]" />
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-[#E5E4E1] px-5 py-3.5 last:border-b-0">
            <div className="h-4 w-12 animate-pulse rounded bg-[#F0F0EE]" />
            <div className="h-4 flex-1 animate-pulse rounded bg-[#E5E4E1]" />
            <div className="h-4 w-16 animate-pulse rounded bg-[#F0F0EE]" />
            <div className="h-4 w-20 animate-pulse rounded bg-[#F0F0EE]" />
          </div>
        ))}
      </div>
    </div>
  )
}
