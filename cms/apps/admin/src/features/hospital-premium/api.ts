export interface HospitalSubscription {
  id: number
  hospitalId: number
  tier: 'basic' | 'premium' | 'vip'
  startDate: string
  endDate: string
  isActive: boolean
  createdAt: string
}

export interface PremiumStatusResponse {
  subscription: HospitalSubscription | null
}

export async function fetchPremiumStatus(): Promise<PremiumStatusResponse> {
  const res = await fetch('/api/v1/hospital/premium/status', {
    cache: 'no-store',
  })
  if (!res.ok) {
    throw new Error(`Failed to fetch premium status: ${res.status}`)
  }
  const json = await res.json()
  return json.data as PremiumStatusResponse
}
