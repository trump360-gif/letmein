export interface HospitalProfile {
  id: string
  name: string
  description: string | null
  address: string | null
  phone: string | null
  operatingHours: string | null
  profileImage: string | null
  detailedDescription: string | null
  galleryImages: string | null
}

export interface ProfileUpdateData {
  address?: string
  phone?: string
  operatingHours?: string
  profileImage?: string
  detailedDescription?: string
}

export interface SpecialtyCategory {
  id: number
  name: string
}

export interface HospitalSpecialty {
  id: string
  categoryId: number
  category: SpecialtyCategory
}

export interface SpecialtiesResponse {
  specialties: HospitalSpecialty[]
  allCategories: SpecialtyCategory[]
}

export async function fetchProfile(): Promise<HospitalProfile> {
  const res = await fetch('/api/v1/hospital/profile')
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error ?? '프로필을 불러오지 못했습니다')
  }
  return res.json()
}

export async function updateProfile(data: ProfileUpdateData): Promise<HospitalProfile> {
  const res = await fetch('/api/v1/hospital/profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error ?? '프로필 저장에 실패했습니다')
  }
  return res.json()
}

export async function fetchImages(): Promise<{ images: string[] }> {
  const res = await fetch('/api/v1/hospital/profile/images')
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error ?? '이미지를 불러오지 못했습니다')
  }
  return res.json()
}

export async function updateImages(images: string[]): Promise<{ images: string[] }> {
  const res = await fetch('/api/v1/hospital/profile/images', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ images }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error ?? '이미지 저장에 실패했습니다')
  }
  return res.json()
}

export async function fetchSpecialties(): Promise<SpecialtiesResponse> {
  const res = await fetch('/api/v1/hospital/profile/specialties')
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error ?? '전문분야를 불러오지 못했습니다')
  }
  return res.json()
}

export async function addSpecialty(categoryId: number): Promise<HospitalSpecialty> {
  const res = await fetch('/api/v1/hospital/profile/specialties', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ categoryId }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error ?? '전문분야 추가에 실패했습니다')
  }
  return res.json()
}

export async function removeSpecialty(categoryId: number): Promise<void> {
  const res = await fetch('/api/v1/hospital/profile/specialties', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ categoryId }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error ?? '전문분야 제거에 실패했습니다')
  }
}
