export default function HomeLoading() {
  return (
    <div className="space-y-8">
      {/* Hero skeleton */}
      <div className="h-[400px] animate-pulse bg-gradient-to-br from-[#e8f5e9] to-[#c8e6c9]" />
      {/* Stats bar */}
      <div className="mx-auto flex max-w-[1200px] justify-around px-10 py-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-12 w-12 animate-pulse rounded-2xl bg-[#E5E4E1]" />
            <div className="space-y-1.5">
              <div className="h-3 w-16 animate-pulse rounded bg-[#E5E4E1]" />
              <div className="h-4 w-20 animate-pulse rounded bg-[#D1D0CD]" />
            </div>
          </div>
        ))}
      </div>
      {/* Cards */}
      <div className="mx-auto grid max-w-[1200px] grid-cols-3 gap-5 px-10">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
            <div className="h-[180px] animate-pulse bg-[#E5E4E1]" />
            <div className="space-y-2 p-5">
              <div className="h-4 w-3/4 animate-pulse rounded bg-[#E5E4E1]" />
              <div className="h-3 w-full animate-pulse rounded bg-[#F0F0EE]" />
              <div className="h-3 w-1/3 animate-pulse rounded bg-[#F0F0EE]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
