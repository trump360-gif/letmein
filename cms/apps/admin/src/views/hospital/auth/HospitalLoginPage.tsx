'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { Loader2, Building2 } from 'lucide-react'
import { Button, Input, Label } from '@letmein/ui'

const loginSchema = z.object({
  email: z.string().min(1, '이메일을 입력해주세요').email('올바른 이메일 형식이 아닙니다'),
  password: z.string().min(1, '비밀번호를 입력해주세요'),
})

type LoginForm = z.infer<typeof loginSchema>

export function HospitalLoginPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = async (values: LoginForm) => {
    setError(null)
    try {
      const res = await fetch('/api/v1/hospital/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      const data = await res.json()
      if (!data.success) {
        setError(data.error?.message ?? '로그인에 실패했습니다.')
        return
      }
      router.replace('/hospital/dashboard')
    } catch {
      setError('로그인에 실패했습니다. 다시 시도해주세요.')
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left: Brand Panel */}
      <div className="hidden lg:flex flex-col justify-center bg-gradient-to-br from-emerald-600 to-teal-700 p-12 text-white">
        <div className="mx-auto max-w-md space-y-6">
          <div className="flex items-center gap-3">
            <Building2 className="h-10 w-10" />
            <h1 className="text-3xl font-bold tracking-tight">LetMeIn 병원 포탈</h1>
          </div>
          <p className="text-lg leading-relaxed text-white/80">
            병원 전용 관리 포탈입니다.
            상담 요청 확인, 채팅 관리, 프리미엄 서비스 등을 이용하세요.
          </p>
          <div className="space-y-3 pt-4 text-sm text-white/60">
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-white/60" />
              <span>상담 요청 및 매칭 관리</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-white/60" />
              <span>실시간 채팅 상담</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-white/60" />
              <span>병원 통계 및 리뷰 관리</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Login Form */}
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-sm space-y-8">
          {/* Mobile brand header */}
          <div className="space-y-2 text-center lg:text-left">
            <div className="flex items-center justify-center gap-2 lg:hidden">
              <Building2 className="h-6 w-6 text-emerald-600" />
              <span className="text-lg font-bold text-emerald-600">LetMeIn 병원 포탈</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight">병원 포탈 로그인</h2>
            <p className="text-sm text-muted-foreground">
              병원 계정으로 로그인하세요
            </p>
          </div>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/50 dark:text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                placeholder="hospital@example.com"
                autoComplete="email"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                placeholder="비밀번호를 입력하세요"
                autoComplete="current-password"
                {...register('password')}
              />
              {errors.password && (
                <p className="text-xs text-red-500">{errors.password.message}</p>
              )}
            </div>
            <Button className="w-full" type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              로그인
            </Button>
          </form>

          <div className="text-center text-sm text-muted-foreground">
            <Link href="/login" className="hover:text-foreground underline underline-offset-4">
              관리자 로그인 →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
