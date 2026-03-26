import { api } from '@/shared/api/client'
import type {
  SiteSettingsResponse,
  SiteSettingsUpdatePayload,
  TermsListResponse,
  TermsItem,
  TermsCreatePayload,
  TranslationsListResponse,
  TranslationItem,
  TranslationCreatePayload,
  TranslationUpdatePayload,
} from '@letmein/types'

// ==================== Settings ====================

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

// ==================== Terms ====================

export async function fetchTerms(type?: string): Promise<TermsListResponse> {
  const searchParams = type ? { type } : undefined
  const res = await api
    .get('admin/terms', { searchParams })
    .json<{ success: boolean; data: TermsListResponse }>()
  return res.data
}

export async function fetchTermsById(id: string): Promise<TermsItem & { agreementCount: number }> {
  const res = await api
    .get(`admin/terms/${id}`)
    .json<{ success: boolean; data: TermsItem & { agreementCount: number } }>()
  return res.data
}

export async function createTerms(payload: TermsCreatePayload): Promise<TermsItem> {
  const res = await api
    .post('admin/terms', { json: payload })
    .json<{ success: boolean; data: TermsItem }>()
  return res.data
}

// ==================== Translations ====================

export async function fetchTranslations(params?: {
  search?: string
  page?: number
  limit?: number
}): Promise<TranslationsListResponse> {
  const searchParams: Record<string, string> = {}
  if (params?.search) searchParams.search = params.search
  if (params?.page) searchParams.page = params.page.toString()
  if (params?.limit) searchParams.limit = params.limit.toString()

  const res = await api
    .get('admin/translations', { searchParams })
    .json<{ success: boolean; data: TranslationsListResponse }>()
  return res.data
}

export async function createTranslation(payload: TranslationCreatePayload): Promise<TranslationItem> {
  const res = await api
    .post('admin/translations', { json: payload })
    .json<{ success: boolean; data: TranslationItem }>()
  return res.data
}

export async function updateTranslation(payload: TranslationUpdatePayload): Promise<TranslationItem> {
  const res = await api
    .patch('admin/translations', { json: payload })
    .json<{ success: boolean; data: TranslationItem }>()
  return res.data
}
