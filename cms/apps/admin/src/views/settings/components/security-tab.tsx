'use client'

import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button, Input, Label } from '@letmein/ui'
import { Loader2 } from 'lucide-react'
import { useSettings, useUpdateSettings } from '@/features/settings'

const securitySchema = z.object({
  loginAttemptLimit: z.coerce.number().min(1).max(100),
  loginLockDurationMinutes: z.coerce.number().min(1).max(1440),
  ipBlockEnabled: z.boolean(),
  blockedIps: z.string().optional().or(z.literal('')),
  admin2faEnabled: z.boolean(),
  registrationEnabled: z.boolean(),
  emailVerificationRequired: z.boolean(),
})

type SecurityForm = z.infer<typeof securitySchema>

const SECURITY_KEYS = [
  'loginAttemptLimit',
  'loginLockDurationMinutes',
  'ipBlockEnabled',
  'blockedIps',
  'admin2faEnabled',
  'registrationEnabled',
  'emailVerificationRequired',
] as const

export function SecurityTab() {
  const { data, isLoading } = useSettings()
  const updateMutation = useUpdateSettings()

  const settingsMap = useMemo(() => {
    if (!data?.settings) return {}
    const map: Record<string, string> = {}
    for (const s of data.settings) {
      map[s.key] = s.value || ''
    }
    return map
  }, [data])

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<SecurityForm>({
    resolver: zodResolver(securitySchema),
    defaultValues: {
      loginAttemptLimit: 5,
      loginLockDurationMinutes: 30,
      ipBlockEnabled: false,
      blockedIps: '',
      admin2faEnabled: false,
      registrationEnabled: true,
      emailVerificationRequired: false,
    },
  })

  const ipBlockEnabled = watch('ipBlockEnabled')

  useEffect(() => {
    if (Object.keys(settingsMap).length > 0) {
      reset({
        loginAttemptLimit: parseInt(settingsMap.loginAttemptLimit || '5', 10),
        loginLockDurationMinutes: parseInt(settingsMap.loginLockDurationMinutes || '30', 10),
        ipBlockEnabled: settingsMap.ipBlockEnabled === 'true',
        blockedIps: settingsMap.blockedIps || '',
        admin2faEnabled: settingsMap.admin2faEnabled === 'true',
        registrationEnabled: settingsMap.registrationEnabled !== 'false',
        emailVerificationRequired: settingsMap.emailVerificationRequired === 'true',
      })
    }
  }, [settingsMap, reset])

  const onSubmit = (formData: SecurityForm) => {
    const settings = SECURITY_KEYS.map((key) => ({
      key,
      value: String(formData[key]),
    }))

    updateMutation.mutate(
      { settings },
      {
        onSuccess: () => alert('보안 설정이 저장되었습니다.'),
        onError: () => alert('저장에 실패했습니다.'),
      },
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center rounded-lg border bg-card p-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 rounded-lg border bg-card p-6">
      <h3 className="text-lg font-semibold">보안 설정</h3>

      {/* Login Security */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-muted-foreground">로그인 보안</h4>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="loginAttemptLimit">로그인 시도 제한 (회)</Label>
            <Input
              id="loginAttemptLimit"
              type="number"
              min={1}
              max={100}
              {...register('loginAttemptLimit')}
            />
            {errors.loginAttemptLimit && (
              <p className="text-sm text-destructive">{errors.loginAttemptLimit.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="loginLockDurationMinutes">잠금 시간 (분)</Label>
            <Input
              id="loginLockDurationMinutes"
              type="number"
              min={1}
              max={1440}
              {...register('loginLockDurationMinutes')}
            />
            {errors.loginLockDurationMinutes && (
              <p className="text-sm text-destructive">{errors.loginLockDurationMinutes.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* IP Block */}
      <div className="space-y-4 border-t pt-4">
        <h4 className="text-sm font-medium text-muted-foreground">IP 차단</h4>
        <div className="flex items-center gap-2">
          <input
            id="ipBlockEnabled"
            type="checkbox"
            {...register('ipBlockEnabled')}
            className="h-4 w-4 rounded border-input"
          />
          <Label htmlFor="ipBlockEnabled">IP 차단 기능 활성화</Label>
        </div>

        {ipBlockEnabled && (
          <div className="space-y-2">
            <Label htmlFor="blockedIps">차단 IP 목록</Label>
            <textarea
              id="blockedIps"
              {...register('blockedIps')}
              rows={4}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="IP를 한 줄에 하나씩 입력하세요&#10;192.168.1.1&#10;10.0.0.0/24"
            />
            <p className="text-xs text-muted-foreground">IP 주소 또는 CIDR 형식으로 입력 (줄바꿈 구분)</p>
          </div>
        )}
      </div>

      {/* Admin 2FA */}
      <div className="space-y-4 border-t pt-4">
        <h4 className="text-sm font-medium text-muted-foreground">관리자 보안</h4>
        <div className="flex items-center gap-2">
          <input
            id="admin2faEnabled"
            type="checkbox"
            {...register('admin2faEnabled')}
            className="h-4 w-4 rounded border-input"
          />
          <Label htmlFor="admin2faEnabled">어드민 2FA 필수</Label>
        </div>
      </div>

      {/* Registration */}
      <div className="space-y-4 border-t pt-4">
        <h4 className="text-sm font-medium text-muted-foreground">회원가입</h4>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              id="registrationEnabled"
              type="checkbox"
              {...register('registrationEnabled')}
              className="h-4 w-4 rounded border-input"
            />
            <Label htmlFor="registrationEnabled">회원가입 허용</Label>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="emailVerificationRequired"
              type="checkbox"
              {...register('emailVerificationRequired')}
              className="h-4 w-4 rounded border-input"
            />
            <Label htmlFor="emailVerificationRequired">이메일 인증 필수</Label>
          </div>
        </div>
      </div>

      <div className="flex justify-end border-t pt-4">
        <Button type="submit" disabled={!isDirty || updateMutation.isPending}>
          {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          보안 설정 저장
        </Button>
      </div>
    </form>
  )
}
