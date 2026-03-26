import { api } from '@/shared/api/client'
import type {
  PopupItem,
  PopupCreateInput,
  PopupUpdateInput,
  PopupListResponse,
} from '@letmein/types'

export async function fetchPopups(params?: {
  isActive?: string
  page?: number
  limit?: number
}): Promise<PopupListResponse> {
  const searchParams: Record<string, string> = {}
  if (params?.isActive !== undefined) searchParams.isActive = params.isActive
  if (params?.page) searchParams.page = params.page.toString()
  if (params?.limit) searchParams.limit = params.limit.toString()

  const res = await api
    .get('admin/popups', { searchParams })
    .json<{ success: boolean; data: PopupListResponse }>()
  return res.data
}

export async function createPopup(payload: PopupCreateInput): Promise<PopupItem> {
  const res = await api
    .post('admin/popups', { json: payload })
    .json<{ success: boolean; data: PopupItem }>()
  return res.data
}

export async function updatePopup(id: string, payload: PopupUpdateInput): Promise<PopupItem> {
  const res = await api
    .patch(`admin/popups/${id}`, { json: payload })
    .json<{ success: boolean; data: PopupItem }>()
  return res.data
}

export async function deletePopup(id: string): Promise<void> {
  await api.delete(`admin/popups/${id}`).json()
}

export async function togglePopup(id: string): Promise<{ id: string; isActive: boolean }> {
  const res = await api
    .patch(`admin/popups/${id}/toggle`)
    .json<{ success: boolean; data: { id: string; isActive: boolean } }>()
  return res.data
}
