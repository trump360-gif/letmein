'use client'

import { useState, useCallback, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Input,
} from '@letmein/ui'
import {
  Upload,
  Folder,
  ArrowLeft,
  Search,
  Check,
  Trash2,
  Image as ImageIcon,
  File as FileIcon,
  Film,
  X,
  Grid3X3,
  Loader2,
} from 'lucide-react'
import { useMediaList, useUploadMedia, useDeleteMedia } from '@/features/media'
import type { MediaItem, MediaFolderItem } from '@letmein/types'

interface MediaCenterDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect?: (items: Array<{ id: string; fullUrl: string; originalName: string }>) => void
  multiple?: boolean
  fileType?: string
}

export function MediaCenterDialog({
  open,
  onOpenChange,
  onSelect,
  multiple = false,
  fileType,
}: MediaCenterDialogProps) {
  const [folderId, setFolderId] = useState<string | null>(null)
  const [folderPath, setFolderPath] = useState<Array<{ id: string | null; name: string }>>([
    { id: null, name: '전체 미디어' },
  ])
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data, isLoading, refetch } = useMediaList({
    folderId: folderId ?? 'root',
    fileType,
    search: search || undefined,
    limit: 60,
  })

  const uploadMutation = useUploadMedia()
  const deleteMutation = useDeleteMedia()

  const mediaItems = data?.success ? data.data.media : []
  const folders = data?.success ? data.data.folders : []

  const handleFolderClick = useCallback(
    (folder: MediaFolderItem) => {
      setFolderId(folder.id)
      setFolderPath((prev) => [...prev, { id: folder.id, name: folder.name }])
      setSelectedIds(new Set())
    },
    [],
  )

  const handleBack = useCallback(() => {
    if (folderPath.length <= 1) return
    const newPath = folderPath.slice(0, -1)
    setFolderPath(newPath)
    setFolderId(newPath[newPath.length - 1]?.id ?? null)
    setSelectedIds(new Set())
  }, [folderPath])

  const handleBreadcrumb = useCallback(
    (index: number) => {
      const newPath = folderPath.slice(0, index + 1)
      setFolderPath(newPath)
      setFolderId(newPath[newPath.length - 1]?.id ?? null)
      setSelectedIds(new Set())
    },
    [folderPath],
  )

  const toggleSelect = useCallback(
    (item: MediaItem) => {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        if (next.has(item.id)) {
          next.delete(item.id)
        } else {
          if (!multiple) next.clear()
          next.add(item.id)
        }
        return next
      })
    },
    [multiple],
  )

  const handleUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (!files) return
      for (const file of Array.from(files)) {
        await uploadMutation.mutateAsync({
          file,
          options: { folderId: folderId ?? undefined },
        })
      }
      refetch()
      if (fileInputRef.current) fileInputRef.current.value = ''
    },
    [folderId, uploadMutation, refetch],
  )

  const handleDelete = useCallback(
    async (id: string) => {
      if (!confirm('이 미디어를 삭제하시겠습니까?')) return
      await deleteMutation.mutateAsync(id)
      setSelectedIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      refetch()
    },
    [deleteMutation, refetch],
  )

  const handleConfirmSelect = useCallback(() => {
    if (!onSelect) return
    const selected = mediaItems
      .filter((m) => selectedIds.has(m.id))
      .map((m) => ({ id: m.id, fullUrl: m.fullUrl, originalName: m.originalName }))
    onSelect(selected)
    setSelectedIds(new Set())
  }, [onSelect, mediaItems, selectedIds])

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Grid3X3 className="h-5 w-5" />
            미디어 센터
          </DialogTitle>
        </DialogHeader>

        {/* Toolbar */}
        <div className="flex items-center gap-2 border-b pb-3">
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
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="검색..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-48 pl-8"
            />
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*,.pdf,.doc,.docx"
            onChange={handleUpload}
            className="hidden"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadMutation.isPending}
          >
            {uploadMutation.isPending ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-1.5 h-4 w-4" />
            )}
            업로드
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto min-h-[400px]">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 p-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
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

              {/* Media items */}
              {mediaItems.map((item) => {
                const isSelected = selectedIds.has(item.id)
                const Icon = getFileIcon(item)

                return (
                  <div
                    key={item.id}
                    className={`group relative flex flex-col rounded-lg border transition-all cursor-pointer ${
                      isSelected ? 'border-primary ring-2 ring-primary/30' : 'hover:border-primary/50'
                    }`}
                    onClick={() => toggleSelect(item)}
                  >
                    {/* Thumbnail */}
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

                      {/* Selection indicator */}
                      {isSelected && (
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                          <div className="rounded-full bg-primary p-1">
                            <Check className="h-4 w-4 text-primary-foreground" />
                          </div>
                        </div>
                      )}

                      {/* Delete button */}
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

                    {/* Info */}
                    <div className="p-2">
                      <p className="truncate text-xs font-medium">{item.originalName}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatSize(item.sizeBytes)}
                        {item.width && item.height && ` - ${item.width}x${item.height}`}
                      </p>
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
        </div>

        {/* Footer */}
        <DialogFooter className="border-t pt-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {selectedIds.size > 0 && <span>{selectedIds.size}개 선택됨</span>}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              닫기
            </Button>
            {onSelect && (
              <Button onClick={handleConfirmSelect} disabled={selectedIds.size === 0}>
                선택 ({selectedIds.size})
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
