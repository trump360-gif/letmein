'use client'

import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button, Input, Label } from '@letmein/ui'
import { Loader2 } from 'lucide-react'
import { useSettings, useUpdateSettings } from '@/features/settings'

const environmentSchema = z.object({
  defaultLanguage: z.string().min(1, '기본 언어를 선택해주세요'),
  timezone: z.string().min(1, '타임존을 선택해주세요'),
  dateFormat: z.string().min(1, '날짜 표기 형식을 선택해주세요'),
  maintenanceMode: z.boolean(),
  maintenanceMessage: z.string().optional().or(z.literal('')),
  maintenanceScheduledAt: z.string().optional().or(z.literal('')),
  maintenanceScheduledEnd: z.string().optional().or(z.literal('')),
})

type EnvironmentForm = z.infer<typeof environmentSchema>

const ENV_KEYS = [
  'defaultLanguage',
  'timezone',
  'dateFormat',
  'maintenanceMode',
  'maintenanceMessage',
  'maintenanceScheduledAt',
  'maintenanceScheduledEnd',
] as const

const LANGUAGES = [
  { value: 'ko', label: '한국어' },
  { value: 'en', label: 'English' },
  { value: 'ja', label: '日本語' },
]

const TIMEZONES = [
  { value: 'Asia/Seoul', label: 'Asia/Seoul (KST, UTC+9)' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo (JST, UTC+9)' },
  { value: 'America/New_York', label: 'America/New_York (EST, UTC-5)' },
  { value: 'Europe/London', label: 'Europe/London (GMT, UTC+0)' },
  { value: 'UTC', label: 'UTC' },
]

const DATE_FORMATS = [
  { value: 'yyyy-MM-dd', label: '2024-01-01' },
  { value: 'yyyy.MM.dd', label: '2024.01.01' },
  { value: 'yyyy/MM/dd', label: '2024/01/01' },
  { value: 'MM/dd/yyyy', label: '01/01/2024' },
  { value: 'dd/MM/yyyy', label: '01/01/2024 (EU)' },
]

export function EnvironmentTab() {
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
    setValue,
    formState: { errors, isDirty },
  } = useForm<EnvironmentForm>({
    resolver: zodResolver(environmentSchema),
    defaultValues: {
      defaultLanguage: 'ko',
      timezone: 'Asia/Seoul',
      dateFormat: 'yyyy-MM-dd',
      maintenanceMode: false,
      maintenanceMessage: '',
      maintenanceScheduledAt: '',
      maintenanceScheduledEnd: '',
    },
  })

  const maintenanceMode = watch('maintenanceMode')

  useEffect(() => {
    if (Object.keys(settingsMap).length > 0) {
      reset({
        defaultLanguage: settingsMap.defaultLanguage || 'ko',
        timezone: settingsMap.timezone || 'Asia/Seoul',
        dateFormat: settingsMap.dateFormat || 'yyyy-MM-dd',
        maintenanceMode: settingsMap.maintenanceMode === 'true',
        maintenanceMessage: settingsMap.maintenanceMessage || '',
        maintenanceScheduledAt: settingsMap.maintenanceScheduledAt || '',
        maintenanceScheduledEnd: settingsMap.maintenanceScheduledEnd || '',
      })
    }
  }, [settingsMap, reset])

  const onSubmit = (formData: EnvironmentForm) => {
    const settings = ENV_KEYS.map((key) => ({
      key,
      value: String(formData[key]),
    }))

    updateMutation.mutate(
      { settings },
      {
        onSuccess: () => alert('환경 설정이 저장되었습니다.'),
        onError: () => alert('저장에 실패했습니다.'),
      },
    )
  }

  const handleClearCache = () => {
    if (confirm('캐시를 초기화하시겠습니까?')) {
      // In a real implementation, this would call a cache clear API
      alert('캐시가 초기화되었습니다.')
    }
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
      <h3 className="text-lg font-semibold">환경 설정</h3>

      {/* Language & Region */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-muted-foreground">언어 및 지역</h4>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>기본 언어</Label>
            <div className="flex flex-wrap gap-1.5">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.value}
                  type="button"
                  onClick={() => setValue('defaultLanguage', lang.value, { shouldDirty: true })}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    watch('defaultLanguage') === lang.value
                      ? 'bg-foreground text-background'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>타임존</Label>
            <div className="flex flex-wrap gap-1.5">
              {TIMEZONES.map((tz) => (
                <button
                  key={tz.value}
                  type="button"
                  onClick={() => setValue('timezone', tz.value, { shouldDirty: true })}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    watch('timezone') === tz.value
                      ? 'bg-foreground text-background'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                  }`}
                >
                  {tz.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>날짜 표기</Label>
            <div className="flex flex-wrap gap-1.5">
              {DATE_FORMATS.map((fmt) => (
                <button
                  key={fmt.value}
                  type="button"
                  onClick={() => setValue('dateFormat', fmt.value, { shouldDirty: true })}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    watch('dateFormat') === fmt.value
                      ? 'bg-foreground text-background'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                  }`}
                >
                  {fmt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Cache */}
      <div className="space-y-4 border-t pt-4">
        <h4 className="text-sm font-medium text-muted-foreground">캐시</h4>
        <div className="flex items-center gap-4">
          <Button type="button" variant="outline" onClick={handleClearCache}>
            캐시 초기화
          </Button>
          <p className="text-xs text-muted-foreground">
            사이트 캐시를 초기화합니다. 일시적으로 응답 속도가 느려질 수 있습니다.
          </p>
        </div>
      </div>

      {/* Maintenance Mode */}
      <div className="space-y-4 border-t pt-4">
        <h4 className="text-sm font-medium text-muted-foreground">점검 모드</h4>

        <div className="flex items-center gap-2">
          <input
            id="maintenanceMode"
            type="checkbox"
            {...register('maintenanceMode')}
            className="h-4 w-4 rounded border-input"
          />
          <Label htmlFor="maintenanceMode">점검 모드 활성화</Label>
        </div>

        {maintenanceMode && (
          <div className="space-y-4 rounded-md border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-950">
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              점검 모드가 활성화되면 일반 사용자는 사이트에 접근할 수 없습니다.
            </p>

            <div className="space-y-2">
              <Label htmlFor="maintenanceMessage">점검 안내 메시지</Label>
              <textarea
                id="maintenanceMessage"
                {...register('maintenanceMessage')}
                rows={3}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="시스템 점검 중입니다. 잠시 후 다시 이용해주세요."
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="maintenanceScheduledAt">점검 시작 예약</Label>
                <Input
                  id="maintenanceScheduledAt"
                  type="datetime-local"
                  {...register('maintenanceScheduledAt')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maintenanceScheduledEnd">점검 종료 예약</Label>
                <Input
                  id="maintenanceScheduledEnd"
                  type="datetime-local"
                  {...register('maintenanceScheduledEnd')}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end border-t pt-4">
        <Button type="submit" disabled={!isDirty || updateMutation.isPending}>
          {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          환경 설정 저장
        </Button>
      </div>
    </form>
  )
}
