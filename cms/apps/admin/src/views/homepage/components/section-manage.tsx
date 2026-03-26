'use client'

import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Card,
  CardContent,
  Button,
  Badge,
  Switch,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Input,
  Label,
} from '@letmein/ui'
import {
  ImageIcon,
  BarChart3,
  Grid3x3,
  Newspaper,
  Stethoscope,
  GripVertical,
  Pencil,
  Trash2,
  Eye,
  Plus,
  FileText,
  TrendingUp,
  Columns3,
  Megaphone,
  Code,
  RotateCcw,
  Wand2,
  LayoutDashboard,
  LayoutGrid,
  LayoutList,
} from 'lucide-react'
import {
  HOMEPAGE_SECTION_LABELS,
  HOMEPAGE_SECTION_TYPES,
} from '@letmein/types'
import type { HomepageSectionType, HomepageSection } from '@letmein/types'
import {
  useHomepageSections,
  useCreateHomepageSection,
  useUpdateHomepageSection,
  useDeleteHomepageSection,
  useReorderHomepageSections,
} from '@/features/homepage-manage/hooks'
import { BEAUTY_CATEGORY_PRESETS, TRUST_STAT_PRESETS } from '@/shared/lib/icon-sets'
import { HeroBannerEditor } from './section-editors/hero-banner-editor'
import { TrustStatsEditor } from './section-editors/trust-stats-editor'
import { CategoryEditor } from './section-editors/category-editor'
import { DoctorEditor } from './section-editors/doctor-editor'
import { LatestPostsEditor } from './section-editors/latest-posts-editor'
import { BoardPreviewEditor } from './section-editors/board-preview-editor'
import { CtaBannerEditor } from './section-editors/cta-banner-editor'
import { HtmlBlockEditor } from './section-editors/html-block-editor'
import { BlogFeedEditor } from './section-editors/blog-feed-editor'

const sectionIcons: Record<HomepageSectionType, React.ElementType> = {
  hero_banner: ImageIcon,
  trust_stats: BarChart3,
  category: Grid3x3,
  main_content: Newspaper,
  doctor: Stethoscope,
  latest_posts: FileText,
  popular_posts: TrendingUp,
  board_preview: Columns3,
  cta_banner: Megaphone,
  html_block: Code,
  blog_magazine: LayoutDashboard,
  blog_grid: LayoutGrid,
  blog_full: LayoutList,
}

const DEFAULT_CONFIGS: Record<string, Record<string, unknown>> = {
  hero_banner: {
    badge: 'NEW OPEN',
    title: '나에게 맞는\n성형 정보를 찾아보세요',
    description: '검증된 전문의 상담부터 실제 후기까지\n뷰티톡에서 한번에 확인하세요.',
    buttonText: '후기 보러가기',
    buttonHref: '/community/reviews',
    imageUrl: '',
  },
  trust_stats: {
    items: TRUST_STAT_PRESETS.map((p, i) => ({
      id: `stat-${i}`,
      icon: p.icon,
      iconBgColor: p.iconBgColor,
      label: p.label,
      value: p.value,
      sortOrder: i + 1,
    })),
  },
  category: {
    title: '시술 카테고리',
    moreHref: '/categories',
    items: BEAUTY_CATEGORY_PRESETS.map((p, i) => ({
      id: `cat-${i}`,
      icon: p.icon,
      iconBgColor: p.iconBgColor,
      label: p.label,
      href: p.href,
      sortOrder: i + 1,
    })),
  },
  doctor: {
    title: '전문 의료진',
    moreHref: '/doctors',
    items: [
      { id: 'doc-1', name: '김민수 원장', specialty: '안면윤곽 전문의', description: '서울대학교 의과대학 졸업\n성형외과 전문의 15년 경력', imageUrl: '', sortOrder: 1 },
      { id: 'doc-2', name: '이지현 원장', specialty: '피부과 전문의', description: '연세대학교 의과대학 졸업\n피부레이저 시술 전문', imageUrl: '', sortOrder: 2 },
    ],
  },
  latest_posts: { title: '최신 게시글', moreHref: '/', limit: 5, skin: 'list' },
  popular_posts: { title: '인기 게시글', moreHref: '/', limit: 4, period: 'week', skin: 'card' },
  board_preview: { title: '게시판 미리보기', boards: [], columns: 2 },
  cta_banner: {
    title: '지금 가입하고 무료 상담 받아보세요',
    description: '회원가입 시 100포인트 즉시 지급!',
    buttonText: '무료 가입하기',
    buttonHref: '/signup',
    bgColor: '#2563EB',
    textColor: '#ffffff',
    icon: '🎁',
  },
  html_block: { html: '<div style="padding:2rem;text-align:center;color:#71717A;">여기에 자유롭게 HTML을 작성하세요.</div>' },
  blog_magazine: { title: '뷰티 매거진', moreHref: '/blog', limit: 5 },
  blog_grid: { title: '시술 후기', moreHref: '/reviews', limit: 6 },
  blog_full: { title: '전문가 칼럼', moreHref: '/column', limit: 4 },
  main_content: {},
}

/** 기본 섹션 구성 (빈 상태에서 일괄 생성용) */
const DEFAULT_SECTION_SET: { type: HomepageSectionType; title: string }[] = [
  { type: 'hero_banner', title: '히어로 배너' },
  { type: 'trust_stats', title: '신뢰 통계' },
  { type: 'category', title: '시술 카테고리' },
  { type: 'blog_magazine', title: '뷰티 매거진' },
  { type: 'blog_grid', title: '시술 후기' },
  { type: 'blog_full', title: '전문가 칼럼' },
  { type: 'cta_banner', title: 'CTA 배너' },
]

// ==================== Sortable Section Card ====================

function SortableSectionCard({
  section,
  onEdit,
  onToggle,
  onRestore,
  onDelete,
}: {
  section: HomepageSection
  onEdit: () => void
  onToggle: () => void
  onRestore: () => void
  onDelete: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const Icon = sectionIcons[section.type] ?? Newspaper

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`${!section.isActive ? 'opacity-60' : ''} ${isDragging ? 'shadow-lg z-10' : ''}`}
    >
      <CardContent className="flex items-center gap-4 p-4">
        <button
          type="button"
          className="shrink-0 cursor-grab touch-none text-muted-foreground hover:text-foreground"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-5 w-5" />
        </button>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>

        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{section.title}</span>
            <Badge variant="outline" className="text-xs">
              {HOMEPAGE_SECTION_LABELS[section.type]}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            순서: {section.sortOrder + 1}
          </p>
        </div>

        <Switch
          checked={section.isActive}
          onCheckedChange={onToggle}
        />

        <Button variant="ghost" size="sm" onClick={onRestore} title="기본값 복원">
          <RotateCcw className="h-4 w-4" />
        </Button>

        <Button variant="ghost" size="sm" onClick={onEdit} title="편집">
          <Pencil className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          title="삭제"
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  )
}

// ==================== Main Component ====================

export function SectionManage() {
  const { data: sections, isLoading } = useHomepageSections()
  const createSection = useCreateHomepageSection()
  const updateSection = useUpdateHomepageSection()
  const deleteSection = useDeleteHomepageSection()
  const reorderSections = useReorderHomepageSections()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [newSectionType, setNewSectionType] = useState<HomepageSectionType>('hero_banner')
  const [newSectionTitle, setNewSectionTitle] = useState('')
  const [isCreatingDefaults, setIsCreatingDefaults] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const sortedSections = [...(sections ?? [])].sort((a, b) => a.sortOrder - b.sortOrder)

  function handleToggle(section: HomepageSection) {
    updateSection.mutate({
      id: section.id,
      payload: { isActive: !section.isActive },
    })
  }

  function handleDelete(section: HomepageSection) {
    if (confirm(`"${section.title}" 섹션을 삭제하시겠습니까?`)) {
      deleteSection.mutate(section.id)
    }
  }

  function handleRestoreDefaults(section: HomepageSection) {
    const defaults = DEFAULT_CONFIGS[section.type]
    if (!defaults) return
    if (!confirm(`"${section.title}" 섹션의 설정을 기본값으로 복원하시겠습니까?`)) return
    updateSection.mutate({
      id: section.id,
      payload: { config: defaults },
    })
  }

  function handleAdd() {
    if (!newSectionTitle.trim()) return
    createSection.mutate(
      {
        type: newSectionType,
        title: newSectionTitle.trim(),
        config: DEFAULT_CONFIGS[newSectionType] ?? {},
      },
      {
        onSuccess: () => {
          setShowAddDialog(false)
          setNewSectionTitle('')
        },
      },
    )
  }

  async function handleCreateDefaults() {
    setIsCreatingDefaults(true)
    try {
      for (let i = 0; i < DEFAULT_SECTION_SET.length; i++) {
        const { type, title } = DEFAULT_SECTION_SET[i]
        await createSection.mutateAsync({
          type,
          title,
          config: DEFAULT_CONFIGS[type] ?? {},
        })
      }
    } finally {
      setIsCreatingDefaults(false)
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = sortedSections.findIndex((s) => s.id === active.id)
    const newIndex = sortedSections.findIndex((s) => s.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = arrayMove(sortedSections, oldIndex, newIndex)
    reorderSections.mutate(reordered.map((s) => s.id))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (editingId) {
    const section = sortedSections.find((s) => s.id === editingId)
    if (section) {
      return (
        <SectionEditorRouter
          section={section}
          onBack={() => setEditingId(null)}
        />
      )
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          드래그하여 섹션 순서를 변경할 수 있습니다.
        </p>
        <Button size="sm" onClick={() => setShowAddDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          섹션 추가
        </Button>
      </div>

      {sortedSections.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-4 py-12">
            <Eye className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">등록된 섹션이 없습니다.</p>
            <div className="flex gap-3">
              <Button size="sm" variant="outline" onClick={() => setShowAddDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                직접 추가
              </Button>
              <Button size="sm" onClick={handleCreateDefaults} disabled={isCreatingDefaults}>
                <Wand2 className="mr-2 h-4 w-4" />
                {isCreatingDefaults ? '생성 중...' : '기본 섹션 일괄 생성'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              히어로 배너, 신뢰 통계, 시술 카테고리, CTA 배너, 최신 게시글이 기본값과 함께 생성됩니다.
            </p>
          </CardContent>
        </Card>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sortedSections.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {sortedSections.map((section) => (
                <SortableSectionCard
                  key={section.id}
                  section={section}
                  onEdit={() => setEditingId(section.id)}
                  onToggle={() => handleToggle(section)}
                  onRestore={() => handleRestoreDefaults(section)}
                  onDelete={() => handleDelete(section)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>섹션 추가</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>섹션 유형</Label>
              <div className="grid grid-cols-2 gap-2">
                {HOMEPAGE_SECTION_TYPES.filter((t) => t !== 'main_content').map((type) => {
                  const Icon = sectionIcons[type] ?? Newspaper
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        setNewSectionType(type)
                        if (!newSectionTitle) setNewSectionTitle(HOMEPAGE_SECTION_LABELS[type])
                      }}
                      className={`flex items-center gap-2 rounded-lg border p-3 text-left text-sm transition-colors ${
                        newSectionType === type
                          ? 'border-primary bg-primary/5 font-medium'
                          : 'border-border hover:bg-muted'
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {HOMEPAGE_SECTION_LABELS[type]}
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="space-y-2">
              <Label>섹션 제목</Label>
              <Input
                value={newSectionTitle}
                onChange={(e) => setNewSectionTitle(e.target.value)}
                placeholder="예: 최신 게시글, 팀 소개..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              취소
            </Button>
            <Button onClick={handleAdd} disabled={!newSectionTitle.trim() || createSection.isPending}>
              {createSection.isPending ? '추가 중...' : '추가'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function SectionEditorRouter({
  section,
  onBack,
}: {
  section: HomepageSection
  onBack: () => void
}) {
  switch (section.type) {
    case 'hero_banner':
      return <HeroBannerEditor section={section} onBack={onBack} />
    case 'trust_stats':
      return <TrustStatsEditor section={section} onBack={onBack} />
    case 'category':
      return <CategoryEditor section={section} onBack={onBack} />
    case 'doctor':
      return <DoctorEditor section={section} onBack={onBack} />
    case 'latest_posts':
    case 'popular_posts':
      return <LatestPostsEditor section={section} onBack={onBack} />
    case 'board_preview':
      return <BoardPreviewEditor section={section} onBack={onBack} />
    case 'cta_banner':
      return <CtaBannerEditor section={section} onBack={onBack} />
    case 'html_block':
      return <HtmlBlockEditor section={section} onBack={onBack} />
    case 'blog_magazine':
    case 'blog_grid':
    case 'blog_full':
      return <BlogFeedEditor section={section} onBack={onBack} />
    default:
      return (
        <div className="space-y-4">
          <Button variant="ghost" onClick={onBack}>
            ← 목록으로
          </Button>
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              이 섹션 유형의 편집기가 아직 준비되지 않았습니다.
            </CardContent>
          </Card>
        </div>
      )
  }
}
