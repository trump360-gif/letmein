'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Button,
  Input,
  Label,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@letmein/ui'
import { Loader2, Plus, Eye } from 'lucide-react'
import { useTerms, useTermsDetail, useCreateTerms } from '@/features/settings'

const termsCreateSchema = z.object({
  type: z.string().min(1, '약관 유형을 선택해주세요'),
  version: z.string().min(1, '버전을 입력해주세요'),
  title: z.string().min(1, '제목을 입력해주세요'),
  content: z.string().min(1, '내용을 입력해주세요'),
  isRequired: z.boolean(),
  enforcedAt: z.string().min(1, '시행일자를 입력해주세요'),
})

type TermsCreateForm = z.infer<typeof termsCreateSchema>

const TERM_TYPES = [
  { value: 'terms_of_service', label: '이용약관' },
  { value: 'privacy_policy', label: '개인정보처리방침' },
  { value: 'marketing_consent', label: '마케팅 수신 동의' },
]

export function TermsTab() {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [viewId, setViewId] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<string>('')

  const { data, isLoading } = useTerms(filterType || undefined)
  const { data: termDetail } = useTermsDetail(viewId)
  const createMutation = useCreateTerms()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TermsCreateForm>({
    resolver: zodResolver(termsCreateSchema),
    defaultValues: {
      type: 'terms_of_service',
      version: '',
      title: '',
      content: '',
      isRequired: true,
      enforcedAt: '',
    },
  })

  const onSubmit = (formData: TermsCreateForm) => {
    createMutation.mutate(formData, {
      onSuccess: () => {
        alert('약관이 등록되었습니다.')
        setIsCreateOpen(false)
        reset()
      },
      onError: () => alert('약관 등록에 실패했습니다.'),
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center rounded-lg border bg-card p-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4 rounded-lg border bg-card p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">약관 관리</h3>
        <Button size="sm" onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          약관 등록
        </Button>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground shrink-0">유형</span>
        <div className="flex flex-wrap gap-1">
          {[{ value: '', label: '전체' }, ...TERM_TYPES].map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setFilterType(opt.value)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                filterType === opt.value
                  ? 'bg-foreground text-background'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Terms List */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">유형</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">버전</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">제목</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">필수</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">시행일</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">등록일</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">작업</th>
            </tr>
          </thead>
          <tbody>
            {data?.terms && data.terms.length > 0 ? (
              data.terms.map((term) => (
                <tr key={term.id} className="border-b last:border-0 hover:bg-muted/50">
                  <td className="px-4 py-3">
                    <span className="rounded-md bg-secondary px-2 py-0.5 text-xs">
                      {TERM_TYPES.find((t) => t.value === term.type)?.label || term.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{term.version}</td>
                  <td className="px-4 py-3">{term.title}</td>
                  <td className="px-4 py-3">
                    {term.isRequired ? (
                      <span className="text-xs text-green-600">필수</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">선택</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(term.enforcedAt).toLocaleDateString('ko-KR')}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(term.createdAt).toLocaleDateString('ko-KR')}
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setViewId(term.id)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  등록된 약관이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>약관 등록</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>약관 유형 *</Label>
                <div className="flex flex-wrap gap-1.5">
                  {TERM_TYPES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setValue('type', t.value, { shouldDirty: true })}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                        watch('type') === t.value
                          ? 'bg-foreground text-background'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
                {errors.type && (
                  <p className="text-sm text-destructive">{errors.type.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="version">버전 *</Label>
                <Input id="version" {...register('version')} placeholder="1.0.0" />
                {errors.version && (
                  <p className="text-sm text-destructive">{errors.version.message}</p>
                )}
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="title">제목 *</Label>
                <Input id="title" {...register('title')} placeholder="이용약관 v1.0" />
                {errors.title && (
                  <p className="text-sm text-destructive">{errors.title.message}</p>
                )}
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="content">내용 *</Label>
                <textarea
                  id="content"
                  {...register('content')}
                  rows={8}
                  className="flex min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="약관 내용을 입력하세요"
                />
                {errors.content && (
                  <p className="text-sm text-destructive">{errors.content.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="enforcedAt">시행일자 *</Label>
                <Input id="enforcedAt" type="date" {...register('enforcedAt')} />
                {errors.enforcedAt && (
                  <p className="text-sm text-destructive">{errors.enforcedAt.message}</p>
                )}
              </div>

              <div className="flex items-center gap-2 pt-6">
                <input
                  id="isRequired"
                  type="checkbox"
                  {...register('isRequired')}
                  className="h-4 w-4 rounded border-input"
                />
                <Label htmlFor="isRequired">필수 동의 약관</Label>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                취소
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                등록
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={!!viewId} onOpenChange={() => setViewId(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>약관 상세</DialogTitle>
          </DialogHeader>
          {termDetail ? (
            <div className="space-y-4">
              <div className="grid gap-2 text-sm sm:grid-cols-2">
                <div>
                  <span className="font-medium text-muted-foreground">유형: </span>
                  {TERM_TYPES.find((t) => t.value === termDetail.type)?.label || termDetail.type}
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">버전: </span>
                  {termDetail.version}
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">시행일: </span>
                  {new Date(termDetail.enforcedAt).toLocaleDateString('ko-KR')}
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">동의 수: </span>
                  {termDetail.agreementCount}명
                </div>
              </div>
              <div className="border-t pt-4">
                <h4 className="mb-2 font-medium">{termDetail.title}</h4>
                <div className="max-h-[400px] overflow-y-auto whitespace-pre-wrap rounded-md border bg-muted/50 p-4 text-sm">
                  {termDetail.content}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
