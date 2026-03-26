'use client'

import { useRef, useCallback } from 'react'
import { Upload, Loader2 } from 'lucide-react'
import { Button } from '@letmein/ui'
import { useUploadMedia } from '@/features/media'

export function MediaActions() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadMutation = useUploadMedia()

  const handleUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (!files) return
      for (const file of Array.from(files)) {
        await uploadMutation.mutateAsync({
          file,
          options: {},
        })
      }
      if (fileInputRef.current) fileInputRef.current.value = ''
    },
    [uploadMutation],
  )

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*,.pdf,.doc,.docx"
        onChange={handleUpload}
        className="hidden"
      />
      <Button
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploadMutation.isPending}
      >
        {uploadMutation.isPending ? (
          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
        ) : (
          <Upload className="mr-1.5 h-3.5 w-3.5" />
        )}
        업로드
      </Button>
    </>
  )
}
