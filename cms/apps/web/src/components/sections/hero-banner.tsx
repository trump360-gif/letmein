import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

interface HeroBannerProps {
  badge?: string
  title: string
  description: string
  buttonText?: string
  buttonHref?: string
  imageUrl?: string
}

export function HeroBanner({ badge, title, description, buttonText, buttonHref, imageUrl }: HeroBannerProps) {
  return (
    <section className="relative flex min-h-[400px] overflow-hidden lg:min-h-[440px]">
      {imageUrl ? (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${imageUrl})` }}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[#2d6a4f] via-[#3D8A5A] to-[#52b788]" />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />
      <div className="relative z-10 mx-auto flex w-full max-w-[1200px] items-center px-6 py-16 lg:px-10">
        <div className="flex max-w-[520px] flex-col gap-5">
          {badge && (
            <span className="w-fit rounded-full bg-white/20 px-4 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
              {badge}
            </span>
          )}
          <h1 className="whitespace-pre-line text-3xl font-extrabold leading-tight text-white lg:text-4xl">
            {title}
          </h1>
          <p className="whitespace-pre-line text-[15px] leading-relaxed text-white/80">
            {description}
          </p>
          {buttonText && buttonHref && (
            <Link
              href={buttonHref}
              className="flex w-fit items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-sm font-bold text-[#3D8A5A] shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5"
            >
              {buttonText}
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>
    </section>
  )
}
