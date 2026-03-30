import { api } from '@/shared/api/client'
import type {
  SiteSettingsResponse,
  SiteSettingsUpdatePayload,
} from '@letmein/types'

export async function fetchSettings(): Promise<SiteSettingsResponse> {
  const res = await api.get('admin/settings').json<{ success: boolean; data: SiteSettingsResponse }>()
  return res.data
}

export async function updateSettings(payload: SiteSettingsUpdatePayload): Promise<SiteSettingsResponse> {
  const res = await api
    .patch('admin/settings', { json: payload })
    .json<{ success: boolean; data: SiteSettingsResponse }>()
  return res.data
}
