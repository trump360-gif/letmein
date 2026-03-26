'use client'

import { useState, useEffect } from 'react'
import { ThumbsUp } from 'lucide-react'

interface LikeButtonProps {
  postId: string
  initialCount: number
  enabled: boolean
}

export function LikeButton({ postId, initialCount, enabled }: LikeButtonProps) {
  const [count, setCount] = useState(initialCount)
  const [liked, setLiked] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLiked(localStorage.getItem(`liked_post_${postId}`) === '1')
  }, [postId])

  if (!enabled) return null

  async function handleLike() {
    if (loading) return
    setLoading(true)
    try {
      const method = liked ? 'DELETE' : 'POST'
      const res = await fetch(`/api/posts/${postId}/like`, { method })
      if (res.ok) {
        const data = await res.json()
        setCount(data.likeCount)
        const next = !liked
        setLiked(next)
        if (next) {
          localStorage.setItem(`liked_post_${postId}`, '1')
        } else {
          localStorage.removeItem(`liked_post_${postId}`)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleLike}
      disabled={loading}
      className={`flex items-center gap-2 rounded-xl border px-5 py-2.5 text-[13.5px] transition-colors ${
        liked
          ? 'border-[#3D8A5A] bg-[#EDF6F1] text-[#3D8A5A]'
          : 'border-[#E8E7E4] text-[#6D6C6A] hover:border-[#3D8A5A] hover:text-[#3D8A5A]'
      } disabled:cursor-default`}
    >
      <ThumbsUp className={`h-4 w-4 ${liked ? 'fill-[#3D8A5A]' : ''}`} />
      좋아요 {count > 0 && count}
    </button>
  )
}
