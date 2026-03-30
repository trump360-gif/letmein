export type ConsultationStatus = 'all' | 'pending' | 'responded'

export interface ConsultationItem {
  matchId: string
  requestId: string
  status: 'pending' | 'responded'
  createdAt: string
  category: { id: number; name: string }
  description: string
  preferredPeriod: string | null
  photoPublic: boolean
  details: { id: number; name: string }[]
  coordinatorNote: string | null
  response: { id: string; status: string; created_at: string | null } | null
}

export interface ConsultationsResponse {
  consultations: ConsultationItem[]
}

export interface RespondData {
  intro?: string
  experience?: string
  message: string
}

export async function fetchConsultations(
  status: ConsultationStatus = 'all',
): Promise<ConsultationsResponse> {
  const params = new URLSearchParams()
  if (status !== 'all') params.set('status', status)
  const query = params.toString() ? `?${params.toString()}` : ''
  const res = await fetch(`/api/v1/hospital/consultations${query}`)
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error ?? '상담 목록을 불러오지 못했습니다')
  }
  return res.json()
}

export async function respondToConsultation(
  requestId: number | string,
  data: RespondData,
): Promise<void> {
  const res = await fetch(`/api/v1/hospital/consultations/${requestId}/respond`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error ?? '응답 발송에 실패했습니다')
  }
}
