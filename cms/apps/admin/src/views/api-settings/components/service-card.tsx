'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Button,
  Input,
  Label,
  Switch,
  Badge,
} from '@letmein/ui'
import { cn } from '@letmein/utils'
import {
  Eye,
  EyeOff,
  FlaskConical,
  Save,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertTriangle,
} from 'lucide-react'
import { useUpdateApiKey, useTestApiKey } from '@/features/api-integration'
import type { ApiKeyConfig, EnvironmentMode } from '@letmein/types'

interface ServiceCardProps {
  config: ApiKeyConfig
}

export function ServiceCard({ config }: ServiceCardProps) {
  const [visibleFields, setVisibleFields] = useState<Set<string>>(new Set())
  const updateMutation = useUpdateApiKey()
  const testMutation = useTestApiKey()

  // Build a dynamic Zod schema from field definitions
  const schemaShape: Record<string, z.ZodTypeAny> = {}
  for (const field of config.fields) {
    schemaShape[field.key] = field.required
      ? z.string().optional() // We allow empty on edit if masked value exists
      : z.string().optional()
  }
  const formSchema = z.object(schemaShape)
  type FormValues = z.infer<typeof formSchema>

  const {
    register,
    handleSubmit,
    formState: { isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: config.fields.reduce(
      (acc, field) => {
        // Don't prefill masked values — user must re-enter
        acc[field.key] = field.masked ? '' : (config.values[field.key] ?? '')
        return acc
      },
      {} as Record<string, string>,
    ),
  })

  const toggleVisibility = (key: string) => {
    setVisibleFields((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  const handleToggleEnabled = () => {
    updateMutation.mutate({
      service: config.service,
      data: { enabled: !config.enabled },
    })
  }

  const handleModeToggle = () => {
    const newMode: EnvironmentMode = config.mode === 'test' ? 'production' : 'test'
    updateMutation.mutate({
      service: config.service,
      data: { mode: newMode },
    })
  }

  const onSubmit = (data: FormValues) => {
    // Filter out empty values (don't overwrite existing encrypted values)
    const values: Record<string, string> = {}
    for (const [key, val] of Object.entries(data)) {
      if (val && val.trim()) {
        values[key] = val.trim()
      }
    }
    if (Object.keys(values).length === 0) return
    updateMutation.mutate({
      service: config.service,
      data: { values },
    })
  }

  const handleTest = () => {
    testMutation.mutate(config.service)
  }

  const statusBadge = () => {
    switch (config.status) {
      case 'active':
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            연결됨
          </Badge>
        )
      case 'error':
        return (
          <Badge variant="destructive">
            <XCircle className="mr-1 h-3 w-3" />
            오류
          </Badge>
        )
      default:
        return (
          <Badge variant="secondary">
            비활성
          </Badge>
        )
    }
  }

  return (
    <Card className={cn(!config.enabled && 'opacity-60')}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-base">{config.displayName}</CardTitle>
            {statusBadge()}
          </div>
          <Switch
            checked={config.enabled}
            onCheckedChange={handleToggleEnabled}
            disabled={updateMutation.isPending}
          />
        </div>
        {config.enabled && (
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleModeToggle}
              disabled={updateMutation.isPending}
              className={cn(
                'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors cursor-pointer',
                config.mode === 'test'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-blue-100 text-blue-800',
              )}
            >
              {config.mode === 'test' ? '테스트 모드' : '운영 모드'}
            </button>
            {config.lastTestedAt && (
              <CardDescription className="text-xs">
                마지막 테스트: {new Date(config.lastTestedAt).toLocaleString('ko-KR')}
              </CardDescription>
            )}
          </div>
        )}
      </CardHeader>

      {config.enabled && (
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-3">
            {config.fields.map((field) => {
              const isVisible = visibleFields.has(field.key)
              const maskedValue = config.values[field.key] || ''

              return (
                <div key={field.key} className="space-y-1.5">
                  <Label htmlFor={`${config.service}-${field.key}`} className="text-sm">
                    {field.label}
                    {field.required && <span className="ml-0.5 text-destructive">*</span>}
                  </Label>
                  <div className="relative">
                    <Input
                      id={`${config.service}-${field.key}`}
                      type={field.masked && !isVisible ? 'password' : 'text'}
                      placeholder={maskedValue || (field.masked ? '새 값을 입력하세요' : '')}
                      {...register(field.key)}
                      className="pr-10"
                    />
                    {field.masked && (
                      <button
                        type="button"
                        onClick={() => toggleVisibility(field.key)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        tabIndex={-1}
                      >
                        {isVisible ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </CardContent>

          <CardFooter className="flex gap-2">
            <Button
              type="submit"
              size="sm"
              disabled={!isDirty || updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-1 h-4 w-4" />
              )}
              저장
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleTest}
              disabled={testMutation.isPending}
            >
              {testMutation.isPending ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <FlaskConical className="mr-1 h-4 w-4" />
              )}
              연동 테스트
            </Button>
          </CardFooter>

          {/* Test result feedback */}
          {testMutation.data && testMutation.variables === config.service && (
            <div
              className={cn(
                'mx-6 mb-4 flex items-center gap-2 rounded-md px-3 py-2 text-sm',
                testMutation.data.success
                  ? 'bg-green-50 text-green-800'
                  : 'bg-red-50 text-red-800',
              )}
            >
              {testMutation.data.success ? (
                <CheckCircle2 className="h-4 w-4 shrink-0" />
              ) : (
                <AlertTriangle className="h-4 w-4 shrink-0" />
              )}
              {testMutation.data.message}
            </div>
          )}

          {/* Update result feedback */}
          {updateMutation.isError && (
            <div className="mx-6 mb-4 flex items-center gap-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
              <XCircle className="h-4 w-4 shrink-0" />
              {updateMutation.error?.message || '저장에 실패했습니다.'}
            </div>
          )}
        </form>
      )}

      {/* Warning when enabled without keys */}
      {config.enabled &&
        config.fields.some((f) => f.required && !config.values[f.key]) && (
          <div className="mx-6 mb-4 flex items-center gap-2 rounded-md bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            필수 API 키가 설정되지 않았습니다.
          </div>
        )}
    </Card>
  )
}
