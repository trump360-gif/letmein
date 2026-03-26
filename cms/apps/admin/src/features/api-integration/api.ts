import { api } from '@/shared/api/client'
import type {
  ApiKeyListResponse,
  ApiKeyUpdateRequest,
  ApiKeyUpdateResponse,
  ApiKeyTestResponse,
  ApiResponse,
} from '@letmein/types'

const BASE = 'admin/settings/api-keys'

export async function fetchApiKeys(): Promise<ApiKeyListResponse> {
  const res = await api.get(BASE).json<ApiResponse<ApiKeyListResponse>>()
  return res.data
}

export async function updateApiKey(
  service: string,
  data: ApiKeyUpdateRequest,
): Promise<ApiKeyUpdateResponse> {
  const res = await api
    .patch(`${BASE}/${encodeURIComponent(service)}`, { json: data })
    .json<ApiResponse<ApiKeyUpdateResponse>>()
  return res.data
}

export async function testApiKey(service: string): Promise<ApiKeyTestResponse> {
  const res = await api
    .post(`${BASE}/${encodeURIComponent(service)}/test`)
    .json<ApiResponse<ApiKeyTestResponse>>()
  return res.data
}
