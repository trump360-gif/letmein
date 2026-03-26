'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!data.success) {
        setError(data.error)
        return
      }
      router.push('/')
      router.refresh()
    } catch {
      setError('로그인 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-[400px]">
      <div className="mb-8 text-center">
        <Link href="/" className="text-[22px] font-semibold tracking-[0.15em] text-[#0A0A0A]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
          BEAUTI
        </Link>
        <p className="mt-2 text-sm text-gray-500">뷰티 커뮤니티에 로그인하세요</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            placeholder="example@email.com"
            className="w-full rounded-md border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#0A0A0A] transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            placeholder="비밀번호 입력"
            className="w-full rounded-md border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#0A0A0A] transition-colors"
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-[#0A0A0A] py-3 text-sm font-medium text-white hover:bg-[#222] disabled:opacity-50 transition-colors"
        >
          {loading ? '로그인 중...' : '로그인'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        아직 계정이 없으신가요?{' '}
        <Link href="/signup" className="font-medium text-[#0A0A0A] hover:underline">
          회원가입
        </Link>
      </p>
    </div>
  )
}
