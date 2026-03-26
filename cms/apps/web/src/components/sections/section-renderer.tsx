import { Suspense } from 'react'
import { HeroBanner } from './hero-banner'
import { TrustStats } from './trust-stats'
import { CategoryGrid } from './category-grid'
import { DoctorSection } from './doctor-section'
import { LatestPostsSection } from './latest-posts-section'
import { PopularPostsSection } from './popular-posts-section'
import { BoardPreviewSection } from './board-preview-section'
import { CtaBannerSection } from './cta-banner-section'
import { HtmlBlockSection } from './html-block-section'
import { BlogMagazineSection } from './blog-magazine-section'
import { BlogGridSection } from './blog-grid-section'
import { BlogFullSection } from './blog-full-section'

interface Section {
  id: string
  type: string
  title: string
  config: Record<string, unknown>
  isActive: boolean
  sortOrder: number
}

interface SectionRendererProps {
  section: Section
}

function SectionLoading() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600" />
    </div>
  )
}

export function SectionRenderer({ section }: SectionRendererProps) {
  const config = section.config

  switch (section.type) {
    case 'hero_banner':
      return (
        <HeroBanner
          badge={config.badge as string}
          title={(config.title as string) || ''}
          description={(config.description as string) || ''}
          buttonText={config.buttonText as string}
          buttonHref={config.buttonHref as string}
          imageUrl={config.imageUrl as string}
        />
      )

    case 'trust_stats':
      return (
        <TrustStats
          items={(config.items as Array<{ icon: string; iconBgColor: string; label: string; value: string }>) || []}
        />
      )

    case 'category':
      return (
        <CategoryGrid
          title={(config.title as string) || ''}
          moreHref={(config.moreHref as string) || '/'}
          items={(config.items as Array<{ icon: string; iconBgColor: string; label: string; href: string }>) || []}
        />
      )

    case 'doctor':
      return (
        <DoctorSection
          title={(config.title as string) || ''}
          moreHref={(config.moreHref as string) || '/'}
          items={(config.items as Array<{ name: string; specialty: string; description: string; imageUrl?: string }>) || []}
        />
      )

    case 'latest_posts':
      return (
        <Suspense fallback={<SectionLoading />}>
          <LatestPostsSection
            title={(config.title as string) || '최신 게시글'}
            moreHref={(config.moreHref as string) || '/'}
            boardId={config.boardId as string | undefined}
            limit={(config.limit as number) || 5}
            skin={(config.skin as 'list' | 'card') || 'list'}
          />
        </Suspense>
      )

    case 'popular_posts':
      return (
        <Suspense fallback={<SectionLoading />}>
          <PopularPostsSection
            title={(config.title as string) || '인기 게시글'}
            moreHref={(config.moreHref as string) || '/'}
            limit={(config.limit as number) || 4}
            period={(config.period as 'day' | 'week' | 'month' | 'all') || 'week'}
            skin={(config.skin as 'list' | 'card') || 'card'}
          />
        </Suspense>
      )

    case 'board_preview':
      return (
        <Suspense fallback={<SectionLoading />}>
          <BoardPreviewSection
            title={(config.title as string) || '게시판'}
            boards={(config.boards as Array<{ boardId: string; limit: number }>) || []}
            columns={(config.columns as number) || 2}
          />
        </Suspense>
      )

    case 'cta_banner':
      return (
        <CtaBannerSection
          title={(config.title as string) || ''}
          description={(config.description as string) || ''}
          buttonText={(config.buttonText as string) || ''}
          buttonHref={(config.buttonHref as string) || ''}
          bgColor={(config.bgColor as string) || '#2563EB'}
          textColor={(config.textColor as string) || '#ffffff'}
        />
      )

    case 'html_block':
      return (
        <HtmlBlockSection html={(config.html as string) || ''} />
      )

    case 'blog_magazine':
      return (
        <Suspense fallback={<SectionLoading />}>
          <BlogMagazineSection
            title={(config.title as string) || '매거진'}
            moreHref={(config.moreHref as string) || '/'}
            boardId={config.boardId as string | undefined}
            limit={(config.limit as number) || 5}
          />
        </Suspense>
      )

    case 'blog_grid':
      return (
        <Suspense fallback={<SectionLoading />}>
          <BlogGridSection
            title={(config.title as string) || '블로그'}
            moreHref={(config.moreHref as string) || '/'}
            boardId={config.boardId as string | undefined}
            limit={(config.limit as number) || 6}
          />
        </Suspense>
      )

    case 'blog_full':
      return (
        <Suspense fallback={<SectionLoading />}>
          <BlogFullSection
            title={(config.title as string) || '블로그'}
            moreHref={(config.moreHref as string) || '/'}
            boardId={config.boardId as string | undefined}
            limit={(config.limit as number) || 4}
          />
        </Suspense>
      )

    default:
      return null
  }
}
