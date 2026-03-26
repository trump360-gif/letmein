'use client'

import { useState, useMemo } from 'react'
import { Input, Button } from '@letmein/ui'
import { Search } from 'lucide-react'
import { cn } from '@letmein/utils'
import {
  BEAUTY_ICONS,
  ICON_CATEGORIES,
  ICON_BG_COLORS,
  type IconOption,
} from '@/shared/lib/icon-sets'

// ==================== 아이콘 피커 ====================

interface IconPickerProps {
  value: string
  bgColor?: string
  onSelect: (icon: string) => void
  onBgColorChange?: (color: string) => void
}

export function IconPicker({ value, bgColor, onSelect, onBgColorChange }: IconPickerProps) {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  const filteredIcons = useMemo(() => {
    let icons: IconOption[] = BEAUTY_ICONS
    if (activeCategory) {
      icons = icons.filter((i) => i.category === activeCategory)
    }
    if (search) {
      const q = search.toLowerCase()
      icons = icons.filter(
        (i) => i.label.toLowerCase().includes(q) || i.value.includes(q),
      )
    }
    return icons
  }, [search, activeCategory])

  return (
    <div className="space-y-3">
      {/* 현재 선택 + 미리보기 */}
      <div className="flex items-center gap-3">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-xl text-xl"
          style={{ backgroundColor: bgColor || '#EFF6FF' }}
        >
          {value || '?'}
        </div>
        <div className="text-sm text-muted-foreground">
          {value ? `선택: ${value}` : '아이콘을 선택하세요'}
        </div>
      </div>

      {/* 검색 */}
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="아이콘 검색 (예: 주사, 피부)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-9 text-sm"
        />
      </div>

      {/* 카테고리 탭 */}
      <div className="flex flex-wrap gap-1.5">
        <Button
          type="button"
          variant={activeCategory === null ? 'default' : 'outline'}
          size="sm"
          className="h-7 text-xs"
          onClick={() => setActiveCategory(null)}
        >
          전체
        </Button>
        {ICON_CATEGORIES.map((cat) => (
          <Button
            key={cat}
            type="button"
            variant={activeCategory === cat ? 'default' : 'outline'}
            size="sm"
            className="h-7 text-xs"
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </Button>
        ))}
      </div>

      {/* 아이콘 그리드 */}
      <div className="grid grid-cols-8 gap-1.5 rounded-lg border p-2 max-h-[200px] overflow-y-auto">
        {filteredIcons.map((icon) => (
          <button
            key={icon.value + icon.label}
            type="button"
            className={cn(
              'flex h-9 w-full items-center justify-center rounded-md text-lg transition-colors hover:bg-accent',
              value === icon.value && 'bg-primary/10 ring-1 ring-primary',
            )}
            onClick={() => onSelect(icon.value)}
            title={icon.label}
          >
            {icon.value}
          </button>
        ))}
        {filteredIcons.length === 0 && (
          <div className="col-span-8 py-4 text-center text-sm text-muted-foreground">
            검색 결과가 없습니다
          </div>
        )}
      </div>

      {/* 직접 입력 */}
      <div className="flex items-center gap-2">
        <Input
          placeholder="직접 입력 (이모지/텍스트)"
          value={value}
          onChange={(e) => onSelect(e.target.value)}
          className="h-8 text-sm flex-1"
        />
      </div>

      {/* 배경색 선택 */}
      {onBgColorChange && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">배경색</p>
          <div className="flex flex-wrap gap-1.5">
            {ICON_BG_COLORS.map((color) => (
              <button
                key={color.value}
                type="button"
                className={cn(
                  'h-7 w-7 rounded-md border transition-all',
                  bgColor === color.value && 'ring-2 ring-primary ring-offset-1',
                )}
                style={{ backgroundColor: color.value }}
                onClick={() => onBgColorChange(color.value)}
                title={color.label}
              />
            ))}
            <input
              type="color"
              className="h-7 w-7 cursor-pointer rounded-md border"
              value={bgColor || '#EFF6FF'}
              onChange={(e) => onBgColorChange(e.target.value)}
              title="직접 선택"
            />
          </div>
        </div>
      )}
    </div>
  )
}

// ==================== 인라인 아이콘 선택 (간소화 버전) ====================

interface InlineIconPickerProps {
  value: string
  bgColor?: string
  onSelect: (icon: string) => void
  onBgColorChange?: (color: string) => void
}

export function InlineIconPicker({ value, bgColor, onSelect, onBgColorChange }: InlineIconPickerProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        type="button"
        className="flex h-10 w-10 items-center justify-center rounded-lg border text-lg hover:bg-accent transition-colors"
        style={{ backgroundColor: bgColor || '#EFF6FF' }}
        onClick={() => setOpen(!open)}
      >
        {value || '?'}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-12 z-50 w-[360px] rounded-lg border bg-popover p-3 shadow-lg">
            <IconPicker
              value={value}
              bgColor={bgColor}
              onSelect={(v) => {
                onSelect(v)
                setOpen(false)
              }}
              onBgColorChange={onBgColorChange}
            />
          </div>
        </>
      )}
    </div>
  )
}
