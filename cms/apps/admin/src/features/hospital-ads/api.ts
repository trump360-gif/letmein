// -------------------------
// Types
// -------------------------

export interface AdCredit {
  id: number
  hospital_id: number
  balance: number
  updated_at: string
}

export interface AdCreative {
  id: number
  hospital_id: number
  imageUrl: string
  headline: string
  reviewStatus: 'pending' | 'approved' | 'rejected'
  createdAt: string
}

export interface AdCampaign {
  id: number
  hospital_id: number
  creativeId: number
  startDate: string
  endDate: string
  dailyBudget: number
  status: 'active' | 'paused' | 'ended'
  createdAt: string
  totalImpressions?: number
  totalClicks?: number
  totalSpent?: number
}

export interface AdImpressionDaily {
  date: string
  impressions: number
  clicks: number
  spend: number
}

export interface AdPerformanceReport {
  campaignId: number
  totalImpressions: number
  totalClicks: number
  totalSpend: number
  ctr: number
  daily: AdImpressionDaily[]
}

// -------------------------
// API Functions
// -------------------------

export async function fetchCredit(): Promise<AdCredit> {
  const res = await fetch('/api/v1/hospital/ads/credit')
  if (!res.ok) throw new Error('Failed to fetch ad credit')
  const data = await res.json() as { credit: AdCredit }
  return data.credit
}

export async function fetchCreatives(params?: {
  page?: number
  limit?: number
}): Promise<{ creatives: AdCreative[]; total: number }> {
  const sp = new URLSearchParams()
  if (params?.page) sp.set('page', String(params.page))
  if (params?.limit) sp.set('limit', String(params.limit))

  const res = await fetch(`/api/v1/hospital/ads/creatives?${sp.toString()}`)
  if (!res.ok) throw new Error('Failed to fetch creatives')
  return res.json() as Promise<{ creatives: AdCreative[]; total: number }>
}

export async function createCreative(
  imageUrl: string,
  headline: string,
): Promise<AdCreative> {
  const res = await fetch('/api/v1/hospital/ads/creatives', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageUrl, headline }),
  })
  if (!res.ok) {
    const err = await res.json() as { error?: string }
    throw new Error(err.error ?? 'Failed to create creative')
  }
  const data = await res.json() as { creative: AdCreative }
  return data.creative
}

export async function fetchCampaigns(params?: {
  page?: number
  limit?: number
  status?: string
}): Promise<{ campaigns: AdCampaign[]; total: number }> {
  const sp = new URLSearchParams()
  if (params?.page) sp.set('page', String(params.page))
  if (params?.limit) sp.set('limit', String(params.limit))
  if (params?.status) sp.set('status', params.status)

  const res = await fetch(`/api/v1/hospital/ads/campaigns?${sp.toString()}`)
  if (!res.ok) throw new Error('Failed to fetch campaigns')
  return res.json() as Promise<{ campaigns: AdCampaign[]; total: number }>
}

export async function createCampaign(data: {
  creativeId: number
  startDate: string
  endDate: string
  dailyBudget: number
}): Promise<AdCampaign> {
  const res = await fetch('/api/v1/hospital/ads/campaigns', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json() as { error?: string }
    throw new Error(err.error ?? 'Failed to create campaign')
  }
  const result = await res.json() as { campaign: AdCampaign }
  return result.campaign
}

export async function fetchCampaignReport(id: number): Promise<AdPerformanceReport> {
  const res = await fetch(`/api/v1/hospital/ads/campaigns/${id}/report`)
  if (!res.ok) throw new Error('Failed to fetch campaign report')
  const data = await res.json() as { report: AdPerformanceReport }
  return data.report
}

export async function toggleCampaignPause(id: number): Promise<AdCampaign> {
  const res = await fetch(`/api/v1/hospital/ads/campaigns/${id}/pause`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  })
  if (!res.ok) {
    const err = await res.json() as { error?: string }
    throw new Error(err.error ?? 'Failed to toggle campaign pause')
  }
  const data = await res.json() as { campaign: AdCampaign }
  return data.campaign
}
