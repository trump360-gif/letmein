'use client'

import { useState, useCallback } from 'react'
import { Button, Input } from '@letmein/ui'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@letmein/ui'
import {
  Image as ImageIcon,
  Trash2,
  Search,
  Folder,
  ArrowLeft,
  Film,
  File as FileIcon,
  ChevronLeft,
  ChevronRight,
  X,
  Download,
  Info,
} from 'lucide-react'
import { useMediaList, useDeleteMedia } from '@/features/media'
import type { MediaItem, MediaFolderItem } from '@letmein/types'
import { format } from 'date-fns'

export function MediaPage() {
  const [page, setPage] = useState(1)
  const [folderId, setFolderId] = useState<string | null>(null)
  const [folderPath, setFolderPath] = useState<Array<{ id: string | null; name: string }>>([
    { id: null, name: '전체 미디어' },
  ])
  const [search, setSearch] = useState('')
  const [fileType, setFileType] = useState('')
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null)

  const { data, isLoading, refetch } = useMediaList({
    page,
    limit: 30,
    folderId: folderId ?? 'root',
    fileType: fileType || undefined,
    search: search || undefined,
  })

  const deleteMutation = useDeleteMedia()

  const mediaItems = data?.success ? data.data.media : []
  const folders = data?.success ? data.data.folders : []
  const meta = data?.meta

  const handleFolderClick = useCallback((folder: MediaFolderItem) => {
    setFolderId(folder.id)
    setFolderPath((prev) => [...prev, { id: folder.id, name: folder.name }])
    setPage(1)
  }, [])

  const handleBack = useCallback(() => {
    if (folderPath.length <= 1) return
    const newPath = folderPath.slice(0, -1)
    setFolderPath(newPath)
    setFolderId(newPath[newPath.length - 1]?.id ?? null)
    setPage(1)
  }, [folderPath])

  const handleBreadcrumb = useCallback(
    (index: number) => {
      const newPath = folderPath.slice(0, index + 1)
      setFolderPath(newPath)
      setFolderId(newPath[newPath.length - 1]?.id ?? null)
      setPage(1)
    },
    [folderPath],
  )

  const handleDelete = useCallback(
    async (id: string) => {
      if (!confirm('이 미디어를 삭제하시겠습니까?')) return
      await deleteMutation.mutateAsync(id)
      if (selectedItem?.id === id) setSelectedItem(null)
      refetch()
    },
    [deleteMutation, refetch, selectedItem],
  )

  const getFileIcon = (item: MediaItem) => {
    if (item.fileType === 'image') return ImageIcon
    if (item.fileType === 'video') return Film
    return FileIcon
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 border-b p-4">
          {folderPath.length > 1 && (
            <Button variant="ghost" size="sm" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            {folderPath.map((p, idx) => (
              <span key={idx} className="flex items-center gap-1">
                {idx > 0 && <span>/</span>}
                <button
                  type="button"
                  onClick={() => handleBreadcrumb(idx)}
                  className={`hover:text-foreground ${idx === folderPath.length - 1 ? 'text-foreground font-medium' : ''}`}
                >
                  {p.name}
                </button>
              </span>
            ))}
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground shrink-0">유형</span>
            <div className="flex flex-wrap gap-1">
              {[
                { value: '', label: '전체' },
                { value: 'image', label: '이미지' },
                { value: 'video', label: '동영상' },
                { value: 'document', label: '문서' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setFileType(opt.value)
                    setPage(1)
                  }}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    fileType === opt.value
                      ? 'bg-foreground text-background'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="파일명 검색..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="h-9 w-48 pl-8"
            />
          </div>
          {(search || fileType) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch('')
                setFileType('')
                setPage(1)
              }}
            >
              <X className="mr-1 h-4 w-4" />
              초기화
            </Button>
          )}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {/* Folders */}
            {folders.map((folder) => (
              <button
                key={`folder-${folder.id}`}
                type="button"
                className="group flex flex-col items-center gap-2 rounded-lg border p-3 transition-colors hover:bg-accent"
                onClick={() => handleFolderClick(folder)}
              >
                <Folder className="h-10 w-10 text-amber-500" />
                <span className="text-xs font-medium truncate w-full text-center">{folder.name}</span>
                <span className="text-xs text-muted-foreground">{folder.mediaCount}개</span>
              </button>
            ))}

            {/* Media */}
            {mediaItems.map((item) => {
              const Icon = getFileIcon(item)
              return (
                <div
                  key={item.id}
                  className="group relative flex flex-col rounded-lg border transition-all cursor-pointer hover:border-primary/50"
                  onClick={() => setSelectedItem(item)}
                >
                  <div className="relative aspect-square overflow-hidden rounded-t-lg bg-muted">
                    {item.fileType === 'image' ? (
                      <img
                        src={item.thumbUrl}
                        alt={item.altText ?? item.originalName}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Icon className="h-10 w-10 text-muted-foreground" />
                      </div>
                    )}
                    <button
                      type="button"
                      className="absolute right-1 top-1 hidden rounded-full bg-destructive p-1 text-destructive-foreground group-hover:block"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(item.id)
                      }}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="p-2">
                    <p className="truncate text-xs font-medium">{item.originalName}</p>
                    <p className="text-xs text-muted-foreground">{formatSize(item.sizeBytes)}</p>
                  </div>
                </div>
              )
            })}

            {mediaItems.length === 0 && folders.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-16 text-muted-foreground">
                <ImageIcon className="h-12 w-12 mb-3" />
                <p>미디어가 없습니다.</p>
                <p className="text-sm">파일을 업로드해 주세요.</p>
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        {meta && meta.total > 0 && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <span className="text-sm text-muted-foreground">
              {(page - 1) * 30 + 1} - {Math.min(page * 30, meta.total)} / {meta.total}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="px-3 text-sm">{page}</span>
              <Button
                variant="outline"
                size="sm"
                disabled={!meta.hasNext}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              미디어 상세
            </DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              {selectedItem.fileType === 'image' ? (
                <div className="overflow-hidden rounded-lg border">
                  <img
                    src={selectedItem.fullUrl}
                    alt={selectedItem.altText ?? selectedItem.originalName}
                    className="w-full"
                  />
                </div>
              ) : (
                <div className="flex h-48 items-center justify-center rounded-lg border bg-muted">
                  {selectedItem.fileType === 'video' ? (
                    <Film className="h-16 w-16 text-muted-foreground" />
                  ) : (
                    <FileIcon className="h-16 w-16 text-muted-foreground" />
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">파일명</span>
                  <p className="font-medium truncate">{selectedItem.originalName}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">파일 크기</span>
                  <p className="font-medium">{formatSize(selectedItem.sizeBytes)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">유형</span>
                  <p className="font-medium">{selectedItem.mimeType}</p>
                </div>
                {selectedItem.width && selectedItem.height && (
                  <div>
                    <span className="text-muted-foreground">해상도</span>
                    <p className="font-medium">
                      {selectedItem.width} x {selectedItem.height}
                    </p>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">업로드일</span>
                  <p className="font-medium">
                    {format(new Date(selectedItem.createdAt), 'yyyy-MM-dd HH:mm')}
                  </p>
                </div>
                {selectedItem.altText && (
                  <div>
                    <span className="text-muted-foreground">대체 텍스트</span>
                    <p className="font-medium">{selectedItem.altText}</p>
                  </div>
                )}
              </div>

              <div className="rounded border bg-muted/50 p-2">
                <span className="text-xs text-muted-foreground">URL</span>
                <p className="text-xs font-mono break-all">{selectedItem.fullUrl}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            {selectedItem && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(selectedItem.fullUrl, '_blank')}
                >
                  <Download className="mr-1.5 h-4 w-4" />
                  원본 보기
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    handleDelete(selectedItem.id)
                  }}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="mr-1.5 h-4 w-4" />
                  삭제
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
