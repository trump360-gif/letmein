'use client'

import { HeartHandshake, MessageSquare, TrendingUp, Star } from 'lucide-react'

interface DashboardStats {
  newMatches: number
  activeChats: number
  responseRate: number
  avgRating: number
}

interface RecentConsultation {
  id: string
  requestId: string
  category: string
  description: string
  status: string
  matchedAt: string
}

interface RecentReview {
  id: string
  rating: number
  content: string
  createdAt: string
}

interface HospitalDashboardViewProps {
  stats: DashboardStats
  recentConsultations: RecentConsultation[]
  recentReviews: RecentReview[]
}

const statusLabel: Record<string, string> = {
  active: '진행중',
  matched: '매칭됨',
  expired: '만료',
  cancelled: '취소',
}

const statusClass: Record<string, string> = {
  active: 'bg-blue-100 text-blue-700',
  matched: 'bg-green-100 text-green-700',
  expired: 'bg-gray-100 text-gray-500',
  cancelled: 'bg-red-100 text-red-600',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
  })
}

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`}
        />
      ))}
    </span>
  )
}

export function HospitalDashboardView({
  stats,
  recentConsultations,
  recentReviews,
}: HospitalDashboardViewProps) {
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">대시보드</h1>

      {/* 통계 카드 4개 */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-card p-5 space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <HeartHandshake className="h-4 w-4" />
            <span>신규 매칭</span>
          </div>
          <p className="text-2xl font-bold">{stats.newMatches}건</p>
          <p className="text-xs text-muted-foreground">최근 30일</p>
        </div>

        <div className="rounded-lg border bg-card p-5 space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <MessageSquare className="h-4 w-4" />
            <span>활성 채팅</span>
          </div>
          <p className="text-2xl font-bold">{stats.activeChats}건</p>
          <p className="text-xs text-muted-foreground">현재 진행중</p>
        </div>

        <div className="rounded-lg border bg-card p-5 space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <TrendingUp className="h-4 w-4" />
            <span>평균 응답률</span>
          </div>
          <p className="text-2xl font-bold">{stats.responseRate}%</p>
          <p className="text-xs text-muted-foreground">전체 매칭 기준</p>
        </div>

        <div className="rounded-lg border bg-card p-5 space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Star className="h-4 w-4" />
            <span>평점</span>
          </div>
          <p className="text-2xl font-bold">
            {stats.avgRating > 0 ? `★ ${stats.avgRating.toFixed(1)}` : '-'}
          </p>
          <p className="text-xs text-muted-foreground">누적 리뷰 평균</p>
        </div>
      </div>

      {/* 최근 상담 요청 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">최근 상담 요청</h2>
          <a
            href="/hospital/consultations"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            전체 보기 →
          </a>
        </div>

        {recentConsultations.length === 0 ? (
          <p className="rounded-lg border bg-card p-6 text-center text-sm text-muted-foreground">
            최근 상담 요청이 없습니다.
          </p>
        ) : (
          <div className="space-y-3">
            {recentConsultations.map((c) => (
              <div key={c.id} className="rounded-lg border bg-card p-4 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="rounded-full bg-emerald-100 text-emerald-700 px-2.5 py-0.5 text-xs font-medium">
                    {c.category}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      statusClass[c.status] ?? 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {statusLabel[c.status] ?? c.status}
                  </span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {formatDate(c.matchedAt)}
                  </span>
                </div>
                <p className="text-sm text-foreground line-clamp-2">{c.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 최근 리뷰 */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">최근 리뷰</h2>

        {recentReviews.length === 0 ? (
          <p className="rounded-lg border bg-card p-6 text-center text-sm text-muted-foreground">
            최근 리뷰가 없습니다.
          </p>
        ) : (
          <div className="space-y-3">
            {recentReviews.map((r) => (
              <div key={r.id} className="rounded-lg border bg-card p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <StarRating rating={r.rating} />
                  <span className="text-xs text-muted-foreground">
                    {formatDate(r.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-foreground line-clamp-2">{r.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
