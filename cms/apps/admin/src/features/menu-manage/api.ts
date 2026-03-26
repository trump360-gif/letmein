import { api } from '@/shared/api/client'
import type {
  MenuItem,
  MenuCreateInput,
  MenuUpdateInput,
  MenuReorderInput,
  MenuListResponse,
} from '@letmein/types'

export async function fetchMenus(location?: string): Promise<MenuListResponse> {
  const searchParams: Record<string, string> = {}
  if (location) searchParams.location = location
  const res = await api
    .get('admin/menus', { searchParams })
    .json<{ success: boolean; data: MenuListResponse }>()
  return res.data
}

export async function createMenu(payload: MenuCreateInput): Promise<MenuItem> {
  const res = await api
    .post('admin/menus', { json: payload })
    .json<{ success: boolean; data: MenuItem }>()
  return res.data
}

export async function updateMenu(id: string, payload: MenuUpdateInput): Promise<MenuItem> {
  const res = await api
    .patch(`admin/menus/${id}`, { json: payload })
    .json<{ success: boolean; data: MenuItem }>()
  return res.data
}

export async function deleteMenu(id: string): Promise<void> {
  await api.delete(`admin/menus/${id}`).json()
}

export async function reorderMenus(payload: MenuReorderInput): Promise<void> {
  await api.patch('admin/menus/reorder', { json: payload }).json()
}
