'use client'

import { Crown, Check, CalendarDays, AlertCircle } from 'lucide-react'
import { usePremiumStatus } from '@/features/hospital-premium'
import type { HospitalSubscription } from '@/features/hospital-premium'

// ─── 혜택 데이터 ─────────────────────────────────────────────────────────────

interface TierBenefit {
  tier: 'basic' | 'premium' | 'vip'
  label: string
  benefits: string[]
}

const TIER_BENEFITS: TierBenefit[] = [
  {
    tier: 'basic',
    label: 'BASIC',
    benefits: [
      '의료진 프로필 최대 3명 등록',
      '검색 노출 기본',
    ],
  },
  {
    tier: 'premium',
    label: 'PREMIUM',
    benefits: [
      '의료진 최대 10명 등록',
      '검색 상단 노출',
      '광고 크레딧 월 10,000포인트 무료 지급',
    ],
  },
  {
    tier: 'vip',
    label: 'VIP',
    benefits: [
      '의료진 무제한 등록',
      '검색 최상단 노출',
      '광고 크레딧 월 30,000포인트',
      '전담 매니저 배정',
    ],
  },
]

// ─── 티어 색상 ────────────────────────────────────────────────────────────────

const tierBadgeClass: Record<string, string> = {
  basic: 'bg-gray-100 text-gray-600',
  premium: 'bg-blue-100 text-blue-700',
  vip: 'bg-yellow-100 text-yellow-700',
}

const tierCardBorderClass: Record<string, string> = {
  basic: 'border-gray-200',
  premium: 'border-blue-200',
  vip: 'border-yellow-300',
}

const tierIconClass: Record<string, string> = {
  basic: 'text-gray-400',
  premium: 'text-blue-500',
  vip: 'text-yellow-500',
}

// ─── 날짜 포맷 ────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const d = new Date(iso)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}.${mm}.${dd}`
}

// ─── 현재 구독 카드 ───────────────────────────────────────────────────────────

function SubscriptionStatusCard({ subscription }: { subscription: HospitalSubscription }) {
  const tierBenefits = TIER_BENEFITS.find((t) => t.tier === subscription.tier)

  return (
    <div className="space-y-6">
      {/* 구독 정보 카드 */}
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Crown className={`h-5 w-5 ${tierIconClass[subscription.tier] ?? 'text-gray-400'}`} />
          <h2 className="text-lg font-semibold">현재 구독 플랜</h2>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${
              tierBadgeClass[subscription.tier] ?? 'bg-gray-100 text-gray-600'
            }`}
          >
            {subscription.tier.toUpperCase()}
          </span>
          {!subscription.isActive && (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 text-red-600 px-3 py-1 text-sm font-medium">
              <AlertCircle className="h-3.5 w-3.5" />
              만료됨
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 pt-1">
          <div className="space-y-1">
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5" />
              구독 시작일
            </p>
            <p className="text-sm font-medium">{formatDate(subscription.startDate)}</p>
          </div>
          <div className="space-y-1">
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5" />
              만료일
            </p>
            <p className="text-sm font-medium">{formatDate(subscription.endDate)}</p>
          </div>
        </div>
      </div>

      {/* 현재 티어 혜택 안내 */}
      {tierBenefits && (
        <div className="space-y-3">
          <h3 className="text-base font-semibold">현재 플랜 혜택</h3>
          <div
            className={`rounded-lg border ${tierCardBorderClass[subscription.tier] ?? 'border-gray-200'} bg-card p-5`}
          >
            <div className="mb-3">
              <span
                className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  tierBadgeClass[subscription.tier] ?? 'bg-gray-100 text-gray-600'
                }`}
              >
                {tierBenefits.label}
              </span>
            </div>
            <ul className="space-y-2">
              {tierBenefits.benefits.map((benefit) => (
                <li key={benefit} className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── 미구독 혜택 안내 ─────────────────────────────────────────────────────────

function BenefitsGuide() {
  return (
    <div className="space-y-6">
      {/* 미구독 상태 텍스트 */}
      <div className="rounded-lg border bg-card p-6 text-center space-y-2">
        <Crown className="mx-auto h-8 w-8 text-gray-300" />
        <p className="text-base font-medium text-muted-foreground">
          현재 프리미엄 구독이 없습니다
        </p>
        <p className="text-sm text-muted-foreground">
          프리미엄 플랜을 통해 더 많은 혜택을 누려보세요.
        </p>
      </div>

      {/* 혜택 안내 카드 3개 */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold">플랜별 혜택 안내</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {TIER_BENEFITS.map((t) => (
            <div
              key={t.tier}
              className={`rounded-lg border ${tierCardBorderClass[t.tier]} bg-card p-5 space-y-3`}
            >
              <div className="flex items-center gap-2">
                <Crown className={`h-4 w-4 ${tierIconClass[t.tier]}`} />
                <span
                  className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${tierBadgeClass[t.tier]}`}
                >
                  {t.label}
                </span>
              </div>
              <ul className="space-y-2">
                {t.benefits.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* 구독 문의 안내 */}
      <div className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
        구독 업그레이드는 담당자에게 문의하세요.
      </div>
    </div>
  )
}

// ─── 스켈레톤 ─────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="rounded-lg border bg-card p-6 space-y-4 animate-pulse">
      <div className="h-5 w-32 rounded bg-muted" />
      <div className="h-7 w-24 rounded-full bg-muted" />
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="h-3 w-16 rounded bg-muted" />
          <div className="h-4 w-24 rounded bg-muted" />
        </div>
        <div className="space-y-2">
          <div className="h-3 w-16 rounded bg-muted" />
          <div className="h-4 w-24 rounded bg-muted" />
        </div>
      </div>
    </div>
  )
}

// ─── 메인 뷰 ─────────────────────────────────────────────────────────────────

export function HospitalPremiumView() {
  const { data, isLoading, isError } = usePremiumStatus()

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold">프리미엄</h1>

      {isLoading && <SkeletonCard />}

      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          구독 정보를 불러오는데 실패했습니다. 잠시 후 다시 시도해주세요.
        </div>
      )}

      {!isLoading && !isError && data && (
        data.subscription !== null
          ? <SubscriptionStatusCard subscription={data.subscription} />
          : <BenefitsGuide />
      )}
    </div>
  )
}
