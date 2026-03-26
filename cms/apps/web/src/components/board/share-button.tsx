'use client'

import { useState } from 'react'
import { Share2, Check } from 'lucide-react'

export function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false)

  async function handleShare() {
    const url = window.location.href
    if (navigator.share) {
      await navigator.share({ title, url }).catch(() => {})
    } else {
      await navigator.clipboard.writeText(url).catch(() => {})
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-2 rounded-xl border border-[#E8E7E4] px-5 py-2.5 text-[13.5px] text-[#6D6C6A] transition-colors hover:border-[#3D8A5A] hover:text-[#3D8A5A]"
    >
      {copied ? <Check className="h-4 w-4 text-[#3D8A5A]" /> : <Share2 className="h-4 w-4" />}
      {copied ? '복사됨' : '공유'}
    </button>
  )
}
