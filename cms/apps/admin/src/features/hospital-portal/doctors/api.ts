export interface Doctor {
  id: string
  hospitalId: string
  name: string
  title: string | null
  experience: string | null
  profileImage: string | null
  sortOrder: number | null
  createdAt: string | null
}

export interface DoctorsResponse {
  doctors: Doctor[]
}

export interface CreateDoctorData {
  name: string
  title?: string
  experience?: string
  profileImage?: string
}

export interface UpdateDoctorData {
  name?: string
  title?: string | null
  experience?: string | null
  profileImage?: string | null
}

export interface OrderItem {
  id: number
  sortOrder: number
}

export async function fetchDoctors(): Promise<DoctorsResponse> {
  const res = await fetch('/api/v1/hospital/doctors')
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error ?? '의료진 목록을 불러오지 못했습니다')
  }
  return res.json()
}

export async function createDoctor(data: CreateDoctorData): Promise<Doctor> {
  const res = await fetch('/api/v1/hospital/doctors', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error ?? '의료진 추가에 실패했습니다')
  }
  const json = await res.json()
  return json.doctor
}

export async function updateDoctor(id: string, data: UpdateDoctorData): Promise<Doctor> {
  const res = await fetch(`/api/v1/hospital/doctors/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error ?? '의료진 수정에 실패했습니다')
  }
  const json = await res.json()
  return json.doctor
}

export async function deleteDoctor(id: string): Promise<void> {
  const res = await fetch(`/api/v1/hospital/doctors/${id}`, {
    method: 'DELETE',
  })
  if (!res.ok && res.status !== 204) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error ?? '의료진 삭제에 실패했습니다')
  }
}

export async function updateDoctorOrder(orders: OrderItem[]): Promise<void> {
  const res = await fetch('/api/v1/hospital/doctors/order', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orders }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error ?? '순서 저장에 실패했습니다')
  }
}
