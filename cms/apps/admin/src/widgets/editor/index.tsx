'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import { Table, TableRow, TableCell, TableHeader } from '@tiptap/extension-table'
import Placeholder from '@tiptap/extension-placeholder'
import { useCallback, useEffect, useState } from 'react'
import { EditorToolbar } from './toolbar'
import { ImageUpload } from './extensions/image-upload'
import { MediaCenterDialog } from '@/widgets/media-center'
import { uploadMedia } from '@/features/media'
import { SeoPanel } from './seo-panel'

interface TipTapEditorProps {
  content?: string
  onChange?: (html: string) => void
  placeholder?: string
  editable?: boolean
  className?: string
  showSeoPanel?: boolean
  title?: string
}

export function TipTapEditor({
  content = '',
  onChange,
  placeholder = '내용을 입력하세요...',
  editable = true,
  className = '',
  showSeoPanel = false,
  title,
}: TipTapEditorProps) {
  const [mediaOpen, setMediaOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const handleImageUpload = useCallback(async (file: File) => {
    const result = await uploadMedia(file)
    if (result.success) {
      return { url: result.data.fullUrl, id: result.data.id }
    }
    throw new Error('Upload failed')
  }, [])

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Image.configure({
        HTMLAttributes: { class: 'rounded-lg max-w-full h-auto' },
        allowBase64: false,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'text-primary underline' },
      }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      Placeholder.configure({ placeholder }),
      ImageUpload.configure({
        onUpload: handleImageUpload,
      }),
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose max-w-none focus:outline-none min-h-[300px] px-4 py-3',
      },
    },
  })

  const handleMediaSelect = useCallback(
    (items: Array<{ id: string; fullUrl: string; originalName: string }>) => {
      if (!editor) return
      items.forEach((item) => {
        editor.chain().focus().setImage({
          src: item.fullUrl,
          alt: item.originalName,
        }).run()
      })
      setMediaOpen(false)
    },
    [editor],
  )

  return (
    <div className={`flex gap-4 ${className}`}>
      <div className="min-w-0 flex-1 rounded-lg border bg-card">
        <EditorToolbar
          editor={editor}
          onImageInsert={() => setMediaOpen(true)}
          isMobile={isMobile}
        />
        <EditorContent editor={editor} />
        <MediaCenterDialog
          open={mediaOpen}
          onOpenChange={setMediaOpen}
          onSelect={handleMediaSelect}
          multiple
        />
      </div>
      {showSeoPanel && editable && (
        <div className="w-64 shrink-0">
          <SeoPanel
            getTitle={() => title ?? ''}
            getContent={() => editor?.getHTML() ?? ''}
          />
        </div>
      )}
    </div>
  )
}

// Table, TableRow, TableCell, TableHeader are all exported from @tiptap/extension-table
