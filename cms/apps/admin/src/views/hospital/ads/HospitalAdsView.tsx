'use client'

import { useState } from 'react'
import { CreditCard, Image, Megaphone, ChevronDown, ChevronUp } from 'lucide-react'
import {
  useAdCredit,
  useAdCreatives,
  useCreateCreative,
  useAdCampaigns,
  useCreateCampaign,
  useCampaignReport,
  useToggleCampaignPause,
} from '@/features/hospital-ads/queries'
import type { AdCampaign, AdCreative } from '@/features/hospital-ads/api'

// -------------------------
// Tab type
// -------------------------
type Tab = 'creatives' | 'campaigns'

// -------------------------
// Status filter for campaigns
// -------------------------
type CampaignStatusFilter = '' | 'active' | 'paused' | 'ended'

const CAMPAIGN_STATUS_FILTERS: { label: string; value: CampaignStatusFilter }[] = [
  { label: '전체', value: '' },
  { label: '진행중', value: 'active' },
  { label: '일시정지', value: 'paused' },
  { label: '종료', value: 'ended' },
]

// -------------------------
// Status badge helpers
// -------------------------
const reviewStatusBadge: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-600',
}

const reviewStatusLabel: Record<string, string> = {
  pending: '심사중',
  approved: '승인',
  rejected: '거부',
}

const campaignStatusBadge: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  paused: 'bg-yellow-100 text-yellow-700',
  ended: 'bg-gray-100 text-gray-500',
}

const campaignStatusLabel: Record<string, string> = {
  active: '진행중',
  paused: '일시정지',
  ended: '종료',
}

// -------------------------
// Credit Card (HAD-01)
// -------------------------
function AdCreditCard() {
  const { data: credit, isLoading } = useAdCredit()

  return (
    <div className="rounded-lg border bg-card p-5 flex items-center gap-4">
      <div className="rounded-full bg-blue-100 p-3">
        <CreditCard className="h-5 w-5 text-blue-600" />
      </div>
      <div>
        <p className="text-sm text-muted-foreground">광고 크레딧 잔액</p>
        {isLoading ? (
          <p className="text-2xl font-bold text-muted-foreground">로딩중...</p>
        ) : (
          <p className="text-2xl font-bold">
            {(credit?.balance ?? 0).toLocaleString('ko-KR')}원
          </p>
        )}
      </div>
      <p className="ml-auto text-xs text-muted-foreground">30초마다 자동 갱신</p>
    </div>
  )
}

// -------------------------
// Creative Form (HAD-02)
// -------------------------
function CreativeForm({ onClose }: { onClose: () => void }) {
  const [imageUrl, setImageUrl] = useState('')
  const [headline, setHeadline] = useState('')
  const mutation = useCreateCreative()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!imageUrl || !headline) return
    mutation.mutate(
      { imageUrl, headline },
      {
        onSuccess: () => {
          setImageUrl('')
          setHeadline('')
          onClose()
        },
      },
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 rounded-lg border bg-muted/30 p-4 space-y-3"
    >
      <h3 className="text-sm font-semibold">크리에이티브 등록</h3>
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">이미지 URL</label>
        <input
          type="url"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://example.com/image.jpg"
          className="w-full rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          required
        />
      </div>
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">
          헤드라인 <span className="text-xs">({headline.length}/60자)</span>
        </label>
        <input
          type="text"
          value={headline}
          onChange={(e) => setHeadline(e.target.value.slice(0, 60))}
          placeholder="광고 헤드라인을 입력하세요 (60자 이내)"
          maxLength={60}
          className="w-full rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          required
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={mutation.isPending}
          className="rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-60"
        >
          {mutation.isPending ? '등록중...' : '등록'}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md border px-4 py-1.5 text-sm font-medium"
        >
          취소
        </button>
      </div>
      {mutation.isError && (
        <p className="text-xs text-red-600">
          {(mutation.error as Error)?.message ?? '등록에 실패했습니다.'}
        </p>
      )}
    </form>
  )
}

// -------------------------
// Creatives Tab (HAD-02)
// -------------------------
function CreativesTab() {
  const { data, isLoading } = useAdCreatives()
  const [showForm, setShowForm] = useState(false)

  const creatives = data?.creatives ?? []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          총 {data?.total ?? 0}개의 크리에이티브
        </p>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
        >
          {showForm ? '닫기' : '+ 크리에이티브 등록'}
        </button>
      </div>

      {showForm && <CreativeForm onClose={() => setShowForm(false)} />}

      {isLoading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">불러오는 중...</p>
      ) : creatives.length === 0 ? (
        <p className="rounded-lg border bg-card py-8 text-center text-sm text-muted-foreground">
          등록된 크리에이티브가 없습니다.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {creatives.map((c: AdCreative) => (
            <div key={c.id} className="rounded-lg border bg-card overflow-hidden">
              {/* Thumbnail */}
              <div className="aspect-video bg-muted flex items-center justify-center overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={c.imageUrl}
                  alt={c.headline}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    ;(e.currentTarget as HTMLImageElement).src = ''
                    ;(e.currentTarget as HTMLImageElement).style.display = 'none'
                  }}
                />
              </div>
              <div className="p-3 space-y-1.5">
                <p className="text-sm font-medium line-clamp-2">{c.headline}</p>
                <div className="flex items-center justify-between">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      reviewStatusBadge[c.reviewStatus] ?? 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {reviewStatusLabel[c.reviewStatus] ?? c.reviewStatus}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(c.createdAt).toLocaleDateString('ko-KR')}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// -------------------------
// Campaign Report (HAD-04)
// -------------------------
function CampaignReport({ campaignId }: { campaignId: number }) {
  const { data, isLoading } = useCampaignReport(campaignId, true)

  if (isLoading) {
    return (
      <div className="mt-2 rounded-md bg-muted/30 p-3 text-sm text-muted-foreground">
        리포트 로딩 중...
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="mt-2 rounded-md bg-muted/30 p-3 space-y-2">
      <div className="grid grid-cols-3 gap-3 text-center">
        <div>
          <p className="text-xs text-muted-foreground">총 노출수</p>
          <p className="text-base font-bold">
            {data.totalImpressions.toLocaleString('ko-KR')}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">총 클릭수</p>
          <p className="text-base font-bold">
            {data.totalClicks.toLocaleString('ko-KR')}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">총 소비 금액</p>
          <p className="text-base font-bold">
            {data.totalSpend.toLocaleString('ko-KR')}원
          </p>
        </div>
      </div>
      <p className="text-center text-xs text-muted-foreground">
        CTR: {data.ctr.toFixed(2)}%
      </p>
    </div>
  )
}

// -------------------------
// Campaign Row (HAD-03, HAD-04, HAD-05)
// -------------------------
function CampaignRow({ campaign }: { campaign: AdCampaign }) {
  const [showReport, setShowReport] = useState(false)
  const togglePause = useToggleCampaignPause()

  return (
    <div className="rounded-lg border bg-card p-4 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
            campaignStatusBadge[campaign.status] ?? 'bg-gray-100 text-gray-500'
          }`}
        >
          {campaignStatusLabel[campaign.status] ?? campaign.status}
        </span>
        <span className="text-sm text-foreground">
          {campaign.startDate} ~ {campaign.endDate}
        </span>
        <span className="text-sm text-muted-foreground">
          일 예산: {campaign.dailyBudget.toLocaleString('ko-KR')}원
        </span>
        <div className="ml-auto flex items-center gap-2">
          {/* HAD-05: 일시정지/재개 버튼 */}
          {campaign.status !== 'ended' && (
            <button
              onClick={() => togglePause.mutate(campaign.id)}
              disabled={togglePause.isPending}
              className={`rounded-md px-3 py-1 text-xs font-medium ${
                campaign.status === 'active'
                  ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              } disabled:opacity-60`}
            >
              {campaign.status === 'active' ? '일시정지' : '재개'}
            </button>
          )}
          {/* HAD-04: 리포트 보기 버튼 */}
          <button
            onClick={() => setShowReport((v) => !v)}
            className="flex items-center gap-1 rounded-md border px-3 py-1 text-xs font-medium hover:bg-muted"
          >
            리포트
            {showReport ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </button>
        </div>
      </div>

      {/* HAD-04: Inline report */}
      {showReport && <CampaignReport campaignId={campaign.id} />}
    </div>
  )
}

// -------------------------
// Campaign Creation Form (HAD-03)
// -------------------------
function CampaignForm({ onClose }: { onClose: () => void }) {
  const { data: creativesData } = useAdCreatives()
  const mutation = useCreateCampaign()

  const [selectedCreativeId, setSelectedCreativeId] = useState<number | null>(null)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [dailyBudget, setDailyBudget] = useState('')

  const approvedCreatives = (creativesData?.creatives ?? []).filter(
    (c: AdCreative) => c.reviewStatus === 'approved',
  )

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedCreativeId || !startDate || !endDate || !dailyBudget) return
    mutation.mutate(
      {
        creativeId: selectedCreativeId,
        startDate,
        endDate,
        dailyBudget: parseInt(dailyBudget, 10),
      },
      {
        onSuccess: () => {
          onClose()
        },
      },
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 rounded-lg border bg-muted/30 p-4 space-y-4"
    >
      <h3 className="text-sm font-semibold">캠페인 생성</h3>

      {/* Creative selection — radio button cards (no dropdown) */}
      <div>
        <label className="text-xs text-muted-foreground mb-2 block">
          크리에이티브 선택 (승인된 소재만 표시)
        </label>
        {approvedCreatives.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            승인된 크리에이티브가 없습니다. 먼저 크리에이티브를 등록하고 승인 대기하세요.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {approvedCreatives.map((c: AdCreative) => (
              <label
                key={c.id}
                className={`cursor-pointer rounded-md border p-2 flex items-center gap-2 ${
                  selectedCreativeId === c.id
                    ? 'border-primary bg-primary/5'
                    : 'hover:bg-muted/50'
                }`}
              >
                <input
                  type="radio"
                  name="creativeId"
                  value={c.id}
                  checked={selectedCreativeId === c.id}
                  onChange={() => setSelectedCreativeId(c.id)}
                  className="shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{c.headline}</p>
                  <p className="text-xs text-muted-foreground truncate">{c.imageUrl}</p>
                </div>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">시작일</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            required
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">종료일</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            min={startDate}
            className="w-full rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            required
          />
        </div>
      </div>

      <div>
        <label className="text-xs text-muted-foreground mb-1 block">
          일 예산 (원)
        </label>
        <input
          type="number"
          value={dailyBudget}
          onChange={(e) => setDailyBudget(e.target.value)}
          placeholder="예: 10000"
          min={1000}
          step={1000}
          className="w-full rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          required
        />
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={mutation.isPending || !selectedCreativeId}
          className="rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-60"
        >
          {mutation.isPending ? '생성중...' : '캠페인 생성'}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md border px-4 py-1.5 text-sm font-medium"
        >
          취소
        </button>
      </div>

      {mutation.isError && (
        <p className="text-xs text-red-600">
          {(mutation.error as Error)?.message ?? '캠페인 생성에 실패했습니다.'}
        </p>
      )}
    </form>
  )
}

// -------------------------
// Campaigns Tab (HAD-03, HAD-04, HAD-05)
// -------------------------
function CampaignsTab() {
  const [statusFilter, setStatusFilter] = useState<CampaignStatusFilter>('')
  const [showForm, setShowForm] = useState(false)
  const { data, isLoading } = useAdCampaigns(statusFilter || undefined)

  const campaigns = data?.campaigns ?? []

  return (
    <div className="space-y-4">
      {/* Status filter chips */}
      <div className="flex flex-wrap items-center gap-2">
        {CAMPAIGN_STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
              statusFilter === f.value
                ? 'bg-primary text-primary-foreground'
                : 'border hover:bg-muted'
            }`}
          >
            {f.label}
          </button>
        ))}
        <div className="ml-auto">
          <button
            onClick={() => setShowForm((v) => !v)}
            className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
          >
            {showForm ? '닫기' : '+ 캠페인 생성'}
          </button>
        </div>
      </div>

      {showForm && <CampaignForm onClose={() => setShowForm(false)} />}

      {isLoading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">불러오는 중...</p>
      ) : campaigns.length === 0 ? (
        <p className="rounded-lg border bg-card py-8 text-center text-sm text-muted-foreground">
          {statusFilter
            ? `${campaignStatusLabel[statusFilter] ?? statusFilter} 상태의 캠페인이 없습니다.`
            : '등록된 캠페인이 없습니다.'}
        </p>
      ) : (
        <div className="space-y-3">
          {campaigns.map((c: AdCampaign) => (
            <CampaignRow key={c.id} campaign={c} />
          ))}
        </div>
      )}

      {data && data.total > campaigns.length && (
        <p className="text-center text-xs text-muted-foreground">
          총 {data.total}개 중 {campaigns.length}개 표시
        </p>
      )}
    </div>
  )
}

// -------------------------
// Main View
// -------------------------
export function HospitalAdsView() {
  const [activeTab, setActiveTab] = useState<Tab>('creatives')

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">광고 관리</h1>

      {/* HAD-01: Credit card */}
      <AdCreditCard />

      {/* Tab navigation */}
      <div className="flex gap-1 border-b">
        <button
          onClick={() => setActiveTab('creatives')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
            activeTab === 'creatives'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Image className="h-4 w-4" />
          크리에이티브
        </button>
        <button
          onClick={() => setActiveTab('campaigns')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
            activeTab === 'campaigns'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Megaphone className="h-4 w-4" />
          캠페인
        </button>
      </div>

      {/* Tab content */}
      {activeTab === 'creatives' && <CreativesTab />}
      {activeTab === 'campaigns' && <CampaignsTab />}
    </div>
  )
}
