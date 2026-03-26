'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Shield } from 'lucide-react'
import { Button, Input, Label } from '@letmein/ui'
import { api } from '@/shared/api/client'
import { useAuthStore } from '@/shared/store/auth.store'

const loginSchema = z.object({
  email: z.string().min(1, '이메일을 입력해주세요').email('올바른 이메일 형식이 아닙니다'),
  password: z.string().min(1, '비밀번호를 입력해주세요'),
})

type LoginForm = z.infer<typeof loginSchema>

export function LoginPage() {
  const router = useRouter()
  const setAdmin = useAuthStore((s) => s.setAdmin)
  const [error, setError] = useState<string | null>(null)
  const [devLoading, setDevLoading] = useState(false)

  const handleDevLogin = async () => {
    setDevLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/v1/admin/auth/dev-login', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        setAdmin(data.data.admin)
        router.replace('/')
      }
    } catch {
      setError('빠른 로그인 실패')
    } finally {
      setDevLoading(false)
    }
  }

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
      const res = await api
        .post('admin/auth/signin', { json: values })
        .json<{ success: boolean; data: { admin: any; accessToken: string } }>()

      setAdmin(res.data.admin)
      router.replace('/')
    } catch (err: any) {
      setError(err?.message ?? '로그인에 실패했습니다. 다시 시도해주세요.')
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left: Brand Panel */}
      <div className="hidden lg:flex flex-col justify-center bg-gradient-to-br from-violet-600 to-indigo-700 p-12 text-white">
        <div className="mx-auto max-w-md space-y-6">
          <div className="flex items-center gap-3">
            <Shield className="h-10 w-10" />
            <h1 className="text-3xl font-bold tracking-tight">Black Label CMS</h1>
          </div>
          <p className="text-lg leading-relaxed text-white/80">
            커뮤니티 관리를 위한 통합 어드민 시스템입니다.
            회원 관리, 콘텐츠 모니터링, 통계 분석 등 모든 관리 기능을 한곳에서 처리하세요.
          </p>
          <div className="space-y-3 pt-4 text-sm text-white/60">
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-white/60" />
              <span>실시간 대시보드 및 통계</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-white/60" />
              <span>회원 및 콘텐츠 관리</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-white/60" />
              <span>신고 처리 및 모니터링</span>
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
              <Shield className="h-6 w-6 text-violet-600" />
              <span className="text-lg font-bold text-violet-600">Black Label CMS</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight">로그인</h2>
            <p className="text-sm text-muted-foreground">
              관리자 계정으로 로그인하세요
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
                placeholder="admin@example.com"
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

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">개발 전용</span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={handleDevLogin}
            disabled={devLoading}
          >
            {devLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            ⚡ 빠른 로그인 (Admin)
          </Button>
        </div>
      </div>
    </div>
  )
}
