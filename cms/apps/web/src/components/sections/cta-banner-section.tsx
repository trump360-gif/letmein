import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

interface CtaBannerSectionProps {
  title: string
  description: string
  buttonText: string
  buttonHref: string
  bgColor: string
  textColor: string
}

export function CtaBannerSection({ title, description, buttonText, buttonHref, bgColor, textColor }: CtaBannerSectionProps) {
  return (
    <section className="mx-auto max-w-[1200px] px-6 py-10 lg:px-10">
      <div
        className="flex flex-col items-center gap-4 rounded-2xl px-8 py-10 text-center shadow-sm"
        style={{ backgroundColor: bgColor, color: textColor }}
      >
        <p className="text-xl font-bold leading-snug lg:text-2xl">{title}</p>
        <p className="max-w-[480px] text-[14px] leading-relaxed opacity-80">{description}</p>
        {buttonText && buttonHref && (
          <Link
            href={buttonHref}
            className="mt-2 flex items-center gap-2 rounded-xl px-8 py-3 text-sm font-bold shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5"
            style={{ backgroundColor: textColor, color: bgColor }}
          >
            {buttonText}
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
    </section>
  )
}
