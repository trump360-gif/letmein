import { api } from '@/shared/api/client'
import type {
  BannerItem,
  BannerCreateInput,
  BannerUpdateInput,
  BannerListResponse,
  BannerGroupItem,
  BannerGroupCreateInput,
  BannerGroupListResponse,
  BannerStatsResponse,
} from '@letmein/types'

// ==================== Banners ====================

export async function fetchBanners(params?: {
  position?: string
  groupId?: string
  isActive?: string
  page?: number
  limit?: number
}): Promise<BannerListResponse> {
  const searchParams: Record<string, string> = {}
  if (params?.position) searchParams.position = params.position
  if (params?.groupId) searchParams.groupId = params.groupId
  if (params?.isActive !== undefined) searchParams.isActive = params.isActive
  if (params?.page) searchParams.page = params.page.toString()
  if (params?.limit) searchParams.limit = params.limit.toString()

  const res = await api
    .get('admin/banners', { searchParams })
    .json<{ success: boolean; data: BannerListResponse }>()
  return res.data
}

export async function fetchBanner(id: string): Promise<BannerItem> {
  const res = await api
    .get(`admin/banners/${id}`)
    .json<{ success: boolean; data: BannerItem }>()
  return res.data
}

export async function createBanner(payload: BannerCreateInput): Promise<BannerItem> {
  const res = await api
    .post('admin/banners', { json: payload })
    .json<{ success: boolean; data: BannerItem }>()
  return res.data
}

export async function updateBanner(id: string, payload: BannerUpdateInput): Promise<BannerItem> {
  const res = await api
    .patch(`admin/banners/${id}`, { json: payload })
    .json<{ success: boolean; data: BannerItem }>()
  return res.data
}

export async function deleteBanner(id: string): Promise<void> {
  await api.delete(`admin/banners/${id}`).json()
}

export async function toggleBanner(id: string): Promise<{ id: string; isActive: boolean }> {
  const res = await api
    .patch(`admin/banners/${id}/toggle`)
    .json<{ success: boolean; data: { id: string; isActive: boolean } }>()
  return res.data
}

export async function fetchBannerStats(id: string, days?: number): Promise<BannerStatsResponse> {
  const searchParams: Record<string, string> = {}
  if (days) searchParams.days = days.toString()
  const res = await api
    .get(`admin/banners/${id}/stats`, { searchParams })
    .json<{ success: boolean; data: BannerStatsResponse }>()
  return res.data
}

// ==================== Banner Groups ====================

export async function fetchBannerGroups(): Promise<BannerGroupListResponse> {
  const res = await api
    .get('admin/banner-groups')
    .json<{ success: boolean; data: BannerGroupListResponse }>()
  return res.data
}

export async function createBannerGroup(payload: BannerGroupCreateInput): Promise<BannerGroupItem> {
  const res = await api
    .post('admin/banner-groups', { json: payload })
    .json<{ success: boolean; data: BannerGroupItem }>()
  return res.data
}

export async function toggleBannerGroup(id: string): Promise<{ id: string; isActive: boolean }> {
  const res = await api
    .patch(`admin/banner-groups/${id}/toggle`)
    .json<{ success: boolean; data: { id: string; isActive: boolean } }>()
  return res.data
}
