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
import { Loader2, Plus, Pencil, Search } from 'lucide-react'
import { useDebounce } from '@/shared/hooks/use-debounce'
import {
  useTranslations,
  useCreateTranslation,
  useUpdateTranslation,
} from '@/features/settings'
import type { TranslationItem } from '@letmein/types'

// ==================== Schemas ====================

const createSchema = z.object({
  key: z
    .string()
    .min(1, '키를 입력해주세요')
    .regex(/^[a-zA-Z0-9_.]+$/, '영문, 숫자, 밑줄, 점만 사용 가능합니다'),
  ko: z.string().min(1, '한국어 값을 입력해주세요'),
  ja: z.string().optional().or(z.literal('')),
  en: z.string().optional().or(z.literal('')),
})

type CreateForm = z.infer<typeof createSchema>

const editSchema = z.object({
  ko: z.string().min(1, '한국어 값을 입력해주세요'),
  ja: z.string().optional().or(z.literal('')),
  en: z.string().optional().or(z.literal('')),
})

type EditForm = z.infer<typeof editSchema>

export function TranslationsTab() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editItem, setEditItem] = useState<TranslationItem | null>(null)

  const debouncedSearch = useDebounce(search, 300)

  const { data, isLoading } = useTranslations({
    search: debouncedSearch,
    page,
    limit: 20,
  })
  const createMutation = useCreateTranslation()
  const updateMutation = useUpdateTranslation()

  // Create form
  const createForm = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: { key: '', ko: '', ja: '', en: '' },
  })

  // Edit form
  const editForm = useForm<EditForm>({
    resolver: zodResolver(editSchema),
    defaultValues: { ko: '', ja: '', en: '' },
  })

  const handleCreate = (formData: CreateForm) => {
    createMutation.mutate(
      {
        key: formData.key,
        ko: formData.ko,
        ja: formData.ja || null,
        en: formData.en || null,
      },
      {
        onSuccess: () => {
          alert('번역이 등록되었습니다.')
          setIsCreateOpen(false)
          createForm.reset()
        },
        onError: (error) => alert(error.message || '등록에 실패했습니다.'),
      },
    )
  }

  const handleEdit = (formData: EditForm) => {
    if (!editItem) return

    updateMutation.mutate(
      {
        id: editItem.id,
        ko: formData.ko,
        ja: formData.ja || null,
        en: formData.en || null,
      },
      {
        onSuccess: () => {
          alert('번역이 수정되었습니다.')
          setEditItem(null)
          editForm.reset()
        },
        onError: () => alert('수정에 실패했습니다.'),
      },
    )
  }

  const openEdit = (item: TranslationItem) => {
    setEditItem(item)
    editForm.reset({
      ko: item.ko,
      ja: item.ja || '',
      en: item.en || '',
    })
  }

  const totalPages = data ? Math.ceil(data.total / 20) : 0

  return (
    <div className="space-y-4 rounded-lg border bg-card p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">다국어 관리</h3>
        <Button size="sm" onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          번역 추가
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          placeholder="키 또는 값으로 검색..."
          className="pl-10"
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">키</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">한국어</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">일본어</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">영어</th>
                  <th className="w-16 px-4 py-3 text-left font-medium text-muted-foreground">편집</th>
                </tr>
              </thead>
              <tbody>
                {data?.translations && data.translations.length > 0 ? (
                  data.translations.map((item) => (
                    <tr key={item.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {item.key}
                      </td>
                      <td className="max-w-[200px] truncate px-4 py-3">{item.ko}</td>
                      <td className="max-w-[200px] truncate px-4 py-3 text-muted-foreground">
                        {item.ja || '-'}
                      </td>
                      <td className="max-w-[200px] truncate px-4 py-3 text-muted-foreground">
                        {item.en || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(item)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      {debouncedSearch
                        ? '검색 결과가 없습니다.'
                        : '등록된 번역이 없습니다.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t pt-4">
              <p className="text-sm text-muted-foreground">
                총 {data?.total}개 중 {(page - 1) * 20 + 1}-{Math.min(page * 20, data?.total || 0)}
              </p>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  이전
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  다음
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>번역 추가</DialogTitle>
          </DialogHeader>
          <form onSubmit={createForm.handleSubmit(handleCreate)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="create-key">키 *</Label>
              <Input
                id="create-key"
                {...createForm.register('key')}
                placeholder="common.button.save"
              />
              {createForm.formState.errors.key && (
                <p className="text-sm text-destructive">{createForm.formState.errors.key.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-ko">한국어 *</Label>
              <Input id="create-ko" {...createForm.register('ko')} placeholder="저장" />
              {createForm.formState.errors.ko && (
                <p className="text-sm text-destructive">{createForm.formState.errors.ko.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-ja">일본어</Label>
              <Input id="create-ja" {...createForm.register('ja')} placeholder="保存" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-en">영어</Label>
              <Input id="create-en" {...createForm.register('en')} placeholder="Save" />
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

      {/* Edit Dialog */}
      <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>번역 수정</DialogTitle>
          </DialogHeader>
          {editItem && (
            <form onSubmit={editForm.handleSubmit(handleEdit)} className="space-y-4">
              <div className="space-y-2">
                <Label>키</Label>
                <p className="rounded-md bg-muted px-3 py-2 font-mono text-sm">{editItem.key}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-ko">한국어 *</Label>
                <Input id="edit-ko" {...editForm.register('ko')} />
                {editForm.formState.errors.ko && (
                  <p className="text-sm text-destructive">{editForm.formState.errors.ko.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-ja">일본어</Label>
                <Input id="edit-ja" {...editForm.register('ja')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-en">영어</Label>
                <Input id="edit-en" {...editForm.register('en')} />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditItem(null)}>
                  취소
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  번역 저장
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
