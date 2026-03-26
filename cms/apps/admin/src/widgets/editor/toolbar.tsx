'use client'

import { type Editor } from '@tiptap/react'
import { Button } from '@letmein/ui'
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Minus,
  Undo,
  Redo,
  Link as LinkIcon,
  Image as ImageIcon,
  Table as TableIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Code2,
} from 'lucide-react'
import { useCallback, useState } from 'react'

interface ToolbarProps {
  editor: Editor | null
  onImageInsert?: () => void
  isMobile?: boolean
}

export function EditorToolbar({ editor, onImageInsert, isMobile = false }: ToolbarProps) {
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')

  const setLink = useCallback(() => {
    if (!editor) return
    if (linkUrl === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run()
    }
    setShowLinkInput(false)
    setLinkUrl('')
  }, [editor, linkUrl])

  if (!editor) return null

  const toolbarItems = [
    {
      group: 'history',
      items: [
        { icon: Undo, action: () => editor.chain().focus().undo().run(), active: false, title: '실행 취소' },
        { icon: Redo, action: () => editor.chain().focus().redo().run(), active: false, title: '다시 실행' },
      ],
    },
    {
      group: 'heading',
      items: [
        {
          icon: Heading1,
          action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
          active: editor.isActive('heading', { level: 1 }),
          title: '제목 1',
        },
        {
          icon: Heading2,
          action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
          active: editor.isActive('heading', { level: 2 }),
          title: '제목 2',
        },
        {
          icon: Heading3,
          action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
          active: editor.isActive('heading', { level: 3 }),
          title: '제목 3',
        },
      ],
    },
    {
      group: 'marks',
      items: [
        {
          icon: Bold,
          action: () => editor.chain().focus().toggleBold().run(),
          active: editor.isActive('bold'),
          title: '굵게',
        },
        {
          icon: Italic,
          action: () => editor.chain().focus().toggleItalic().run(),
          active: editor.isActive('italic'),
          title: '기울임',
        },
        {
          icon: Strikethrough,
          action: () => editor.chain().focus().toggleStrike().run(),
          active: editor.isActive('strike'),
          title: '취소선',
        },
        {
          icon: Code,
          action: () => editor.chain().focus().toggleCode().run(),
          active: editor.isActive('code'),
          title: '인라인 코드',
        },
      ],
    },
    {
      group: 'blocks',
      items: [
        {
          icon: List,
          action: () => editor.chain().focus().toggleBulletList().run(),
          active: editor.isActive('bulletList'),
          title: '글머리 목록',
        },
        {
          icon: ListOrdered,
          action: () => editor.chain().focus().toggleOrderedList().run(),
          active: editor.isActive('orderedList'),
          title: '번호 목록',
        },
        {
          icon: Quote,
          action: () => editor.chain().focus().toggleBlockquote().run(),
          active: editor.isActive('blockquote'),
          title: '인용',
        },
        {
          icon: Code2,
          action: () => editor.chain().focus().toggleCodeBlock().run(),
          active: editor.isActive('codeBlock'),
          title: '코드 블록',
        },
        {
          icon: Minus,
          action: () => editor.chain().focus().setHorizontalRule().run(),
          active: false,
          title: '구분선',
        },
      ],
    },
    {
      group: 'insert',
      items: [
        {
          icon: LinkIcon,
          action: () => setShowLinkInput(!showLinkInput),
          active: editor.isActive('link'),
          title: '링크',
        },
        {
          icon: ImageIcon,
          action: () => onImageInsert?.(),
          active: false,
          title: '이미지',
        },
        {
          icon: TableIcon,
          action: () => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
          active: editor.isActive('table'),
          title: '표',
        },
      ],
    },
  ]

  // Mobile toolbar: single scrollable row
  if (isMobile) {
    const allItems = toolbarItems.flatMap((g) => g.items)
    return (
      <div className="sticky top-0 z-10 border-b bg-background">
        <div className="flex gap-0.5 overflow-x-auto p-1">
          {allItems.map((item, idx) => (
            <Button
              key={idx}
              type="button"
              variant="ghost"
              size="sm"
              onClick={item.action}
              className={`h-8 w-8 shrink-0 p-0 ${item.active ? 'bg-accent text-accent-foreground' : ''}`}
              title={item.title}
            >
              <item.icon className="h-4 w-4" />
            </Button>
          ))}
        </div>
        {showLinkInput && (
          <div className="flex gap-1 border-t p-1">
            <input
              type="url"
              placeholder="URL 입력..."
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && setLink()}
              className="flex-1 rounded border px-2 py-1 text-sm"
            />
            <Button type="button" variant="ghost" size="sm" onClick={setLink}>
              확인
            </Button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="sticky top-0 z-10 border-b bg-background">
      <div className="flex flex-wrap gap-0.5 p-1">
        {toolbarItems.map((group, gIdx) => (
          <div key={gIdx} className="flex items-center gap-0.5">
            {gIdx > 0 && <div className="mx-1 h-6 w-px bg-border" />}
            {group.items.map((item, idx) => (
              <Button
                key={idx}
                type="button"
                variant="ghost"
                size="sm"
                onClick={item.action}
                className={`h-8 w-8 p-0 ${item.active ? 'bg-accent text-accent-foreground' : ''}`}
                title={item.title}
              >
                <item.icon className="h-4 w-4" />
              </Button>
            ))}
          </div>
        ))}
      </div>
      {showLinkInput && (
        <div className="flex gap-2 border-t p-2">
          <input
            type="url"
            placeholder="URL을 입력하세요..."
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && setLink()}
            className="flex-1 rounded border px-3 py-1.5 text-sm"
          />
          <Button type="button" variant="ghost" size="sm" onClick={setLink}>
            확인
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => setShowLinkInput(false)}>
            취소
          </Button>
        </div>
      )}
    </div>
  )
}
