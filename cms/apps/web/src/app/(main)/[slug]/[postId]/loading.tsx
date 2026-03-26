export default function PostLoading() {
  return (
    <div className="mx-auto max-w-[960px] space-y-5 px-6 py-10">
      <div className="h-4 w-32 animate-pulse rounded bg-[#E5E4E1]" />
      <div className="overflow-hidden rounded-xl border border-[#E5E4E1] bg-white">
        <div className="space-y-3 border-b border-[#E5E4E1] px-7 py-5">
          <div className="h-6 w-3/4 animate-pulse rounded bg-[#E5E4E1]" />
          <div className="flex items-center gap-4">
            <div className="h-3 w-20 animate-pulse rounded bg-[#F0F0EE]" />
            <div className="h-3 w-28 animate-pulse rounded bg-[#F0F0EE]" />
            <div className="h-3 w-16 animate-pulse rounded bg-[#F0F0EE]" />
          </div>
        </div>
        <div className="space-y-3 px-8 py-10 sm:px-12">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="h-4 animate-pulse rounded bg-[#F0F0EE]"
              style={{ width: `${50 + Math.random() * 50}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
