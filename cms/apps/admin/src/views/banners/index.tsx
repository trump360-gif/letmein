'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Badge, Switch, Card, CardContent } from '@letmein/ui'
import {
  Pencil,
  Trash2,
  BarChart3,
  ImageIcon,
} from 'lucide-react'
import {
  BANNER_POSITION_VALUES,
  BANNER_POSITION_LABELS,
} from '@letmein/types'
import type { BannerPosition } from '@letmein/types'
import { useBanners, useToggleBanner, useDeleteBanner } from '@/features/banner-editor'

export function BannersPage() {
  const router = useRouter()
  const [positionFilter, setPositionFilter] = useState<string>('')
  const [activeFilter, setActiveFilter] = useState<string>('')

  const { data, isLoading } = useBanners({
    position: positionFilter || undefined,
    isActive: activeFilter || undefined,
  })
  const toggleBanner = useToggleBanner()
  const deleteBanner = useDeleteBanner()

  function handleDelete(id: string, name: string) {
    if (confirm(`"${name}" 배너를 삭제하시겠습니까?`)) {
      deleteBanner.mutate(id)
    }
  }

  const banners = data?.banners ?? []

  return (
    <div className="space-y-6">
      {data && (
        <span className="text-sm text-muted-foreground">총 {data.total}개</span>
      )}

      {/* 필터 */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground shrink-0">위치</span>
          <div className="flex flex-wrap gap-1">
            <button
              type="button"
              onClick={() => setPositionFilter('')}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                positionFilter === ''
                  ? 'bg-foreground text-background'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
              }`}
            >
              전체
            </button>
            {BANNER_POSITION_VALUES.map((pos) => (
              <button
                key={pos}
                type="button"
                onClick={() => setPositionFilter(pos)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  positionFilter === pos
                    ? 'bg-foreground text-background'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                }`}
              >
                {BANNER_POSITION_LABELS[pos]}
              </button>
            ))}
          </div>
        </div>
        <div className="h-6 w-px bg-border" />
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground shrink-0">상태</span>
          <div className="flex flex-wrap gap-1">
            {[
              { value: '', label: '전체' },
              { value: 'true', label: '활성' },
              { value: 'false', label: '비활성' },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setActiveFilter(opt.value)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  activeFilter === opt.value
                    ? 'bg-foreground text-background'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 배너 목록 */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : banners.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ImageIcon className="mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">등록된 배너가 없습니다.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {banners.map((banner) => {
            const isScheduled = banner.startsAt || banner.endsAt
            const now = new Date()
            const isExpired = banner.endsAt && new Date(banner.endsAt) < now
            const isUpcoming = banner.startsAt && new Date(banner.startsAt) > now

            return (
              <Card key={banner.id} className={`${!banner.isActive ? 'opacity-60' : ''}`}>
                <CardContent className="flex items-center gap-4 p-4">
                  {/* 이미지 썸네일 placeholder */}
                  <div className="flex h-16 w-24 shrink-0 items-center justify-center rounded-md bg-muted">
                    <ImageIcon className="h-6 w-6 text-muted-foreground" />
                  </div>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{banner.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {BANNER_POSITION_LABELS[banner.position as BannerPosition]}
                      </Badge>
                      {banner.abGroup && (
                        <Badge variant="secondary" className="text-xs">
                          A/B {banner.abGroup}
                        </Badge>
                      )}
                      {isExpired && (
                        <Badge variant="destructive" className="text-xs">
                          만료됨
                        </Badge>
                      )}
                      {isUpcoming && (
                        <Badge className="text-xs bg-yellow-100 text-yellow-800">
                          예약됨
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {banner.group && <span>그룹: {banner.group.name}</span>}
                      {isScheduled && (
                        <span>
                          {banner.startsAt?.split('T')[0] ?? '~'} ~ {banner.endsAt?.split('T')[0] ?? '~'}
                        </span>
                      )}
                      <span>순서: {banner.sortOrder}</span>
                    </div>
                  </div>

                  <Switch
                    checked={banner.isActive}
                    onCheckedChange={() => toggleBanner.mutate(banner.id)}
                  />

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(`/operations/banners/${banner.id}`)}
                    title="통계"
                  >
                    <BarChart3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(`/operations/banners/${banner.id}`)}
                    title="수정"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(banner.id, banner.name)}
                    title="삭제"
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

    </div>
  )
}
