import Link from 'next/link'

interface CategoryItem {
  icon: string
  iconBgColor: string
  label: string
  href: string
}

interface CategoryGridProps {
  title: string
  moreHref: string
  items: CategoryItem[]
}

export function CategoryGrid({ title, moreHref, items }: CategoryGridProps) {
  if (!items || items.length === 0) return null

  return (
    <section className="mx-auto max-w-[1200px] px-6 py-10 lg:px-10">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-6 w-1 rounded-full bg-[#3D8A5A]" />
          <h2 className="text-xl font-bold text-[#1A1918]">{title}</h2>
        </div>
        <Link href={moreHref} className="text-[13px] font-semibold text-[#3D8A5A] hover:underline">
          전체보기 →
        </Link>
      </div>
      <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
        {items.map((cat) => (
          <Link
            key={cat.label}
            href={cat.href}
            className="group flex w-[120px] flex-col items-center gap-3 rounded-2xl p-4 transition-all hover:bg-white hover:shadow-md sm:w-[140px]"
          >
            <div
              className="flex h-14 w-14 items-center justify-center rounded-2xl shadow-sm transition-transform group-hover:scale-110"
              style={{ backgroundColor: cat.iconBgColor || '#e8f5e9' }}
            >
              <span className="text-2xl">{cat.icon}</span>
            </div>
            <span className="text-[13px] font-medium text-[#3F3F46]">{cat.label}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
