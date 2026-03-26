interface TrustStatItem {
  icon: string
  iconBgColor: string
  label: string
  value: string
}

interface TrustStatsProps {
  items: TrustStatItem[]
}

export function TrustStats({ items }: TrustStatsProps) {
  if (!items || items.length === 0) return null

  return (
    <section className="border-b border-[#E5E4E1] bg-white">
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-around gap-4 px-6 py-7 lg:px-10">
        {items.map((stat, i) => (
          <div key={stat.label} className="flex items-center gap-4">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-2xl shadow-sm"
              style={{ backgroundColor: stat.iconBgColor || '#e8f5e9' }}
            >
              <span className="text-xl">{stat.icon}</span>
            </div>
            <div>
              <p className="text-[13px] text-[#6D6C6A]">{stat.label}</p>
              <p className="text-lg font-bold text-[#1A1918]">{stat.value}</p>
            </div>
            {i < items.length - 1 && <div className="ml-6 hidden h-10 w-px bg-[#E5E4E1] lg:block" />}
          </div>
        ))}
      </div>
    </section>
  )
}
