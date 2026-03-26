import Link from 'next/link'
import { UserCircle } from 'lucide-react'

interface DoctorItem {
  name: string
  specialty: string
  description: string
  imageUrl?: string
}

interface DoctorSectionProps {
  title: string
  moreHref: string
  items: DoctorItem[]
}

export function DoctorSection({ title, moreHref, items }: DoctorSectionProps) {
  if (!items || items.length === 0) return null

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-[1200px] px-6 py-10 lg:px-10">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-6 w-1 rounded-full bg-[#3D8A5A]" />
            <h2 className="text-xl font-bold text-[#1A1918]">{title}</h2>
          </div>
          <Link href={moreHref} className="text-[13px] font-semibold text-[#3D8A5A] hover:underline">
            전체보기 →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((doc) => (
            <div
              key={doc.name}
              className="group flex flex-col items-center gap-4 rounded-2xl bg-[#F5F4F1] p-6 transition-all hover:bg-white hover:shadow-lg hover:ring-1 hover:ring-black/5"
            >
              {doc.imageUrl ? (
                <img
                  src={doc.imageUrl}
                  alt={doc.name}
                  className="h-20 w-20 rounded-full object-cover shadow-md ring-4 ring-white"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#e8f5e9] ring-4 ring-white">
                  <UserCircle className="h-12 w-12 text-[#3D8A5A]/40" />
                </div>
              )}
              <div className="text-center">
                <p className="text-[15px] font-bold text-[#1A1918]">{doc.name}</p>
                <p className="mt-0.5 text-xs font-medium text-[#3D8A5A]">{doc.specialty}</p>
              </div>
              <p className="whitespace-pre-line text-center text-[12px] leading-relaxed text-[#6D6C6A]">
                {doc.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
