import { api } from '@/shared/api/client'
import type {
  HomepageConfig,
  SiteHeaderConfig,
  SiteHeaderUpdateInput,
  SiteFooterConfig,
  SiteFooterUpdateInput,
  HomepageSection,
  HomepageSectionCreateInput,
  HomepageSectionUpdateInput,
} from '@letmein/types'

// ==================== Homepage Config ====================

export async function fetchHomepageConfig(): Promise<HomepageConfig> {
  const res = await api
    .get('admin/homepage')
    .json<{ success: boolean; data: HomepageConfig }>()
  return res.data
}

// ==================== Header ====================

export async function fetchSiteHeader(): Promise<SiteHeaderConfig> {
  const res = await api
    .get('admin/homepage/header')
    .json<{ success: boolean; data: SiteHeaderConfig }>()
  return res.data
}

export async function updateSiteHeader(payload: SiteHeaderUpdateInput): Promise<SiteHeaderConfig> {
  const res = await api
    .patch('admin/homepage/header', { json: payload })
    .json<{ success: boolean; data: SiteHeaderConfig }>()
  return res.data
}

// ==================== Footer ====================

export async function fetchSiteFooter(): Promise<SiteFooterConfig> {
  const res = await api
    .get('admin/homepage/footer')
    .json<{ success: boolean; data: SiteFooterConfig }>()
  return res.data
}

export async function updateSiteFooter(payload: SiteFooterUpdateInput): Promise<SiteFooterConfig> {
  const res = await api
    .patch('admin/homepage/footer', { json: payload })
    .json<{ success: boolean; data: SiteFooterConfig }>()
  return res.data
}

// ==================== Sections ====================

export async function fetchHomepageSections(): Promise<HomepageSection[]> {
  const res = await api
    .get('admin/homepage/sections')
    .json<{ success: boolean; data: HomepageSection[] }>()
  return res.data
}

export async function fetchHomepageSection(id: string): Promise<HomepageSection> {
  const res = await api
    .get(`admin/homepage/sections/${id}`)
    .json<{ success: boolean; data: HomepageSection }>()
  return res.data
}

export async function createHomepageSection(
  payload: HomepageSectionCreateInput,
): Promise<HomepageSection> {
  const res = await api
    .post('admin/homepage/sections', { json: payload })
    .json<{ success: boolean; data: HomepageSection }>()
  return res.data
}

export async function updateHomepageSection(
  id: string,
  payload: HomepageSectionUpdateInput,
): Promise<HomepageSection> {
  const res = await api
    .patch(`admin/homepage/sections/${id}`, { json: payload })
    .json<{ success: boolean; data: HomepageSection }>()
  return res.data
}

export async function deleteHomepageSection(id: string): Promise<void> {
  await api.delete(`admin/homepage/sections/${id}`).json()
}

export async function reorderHomepageSections(
  sectionIds: string[],
): Promise<HomepageSection[]> {
  const res = await api
    .patch('admin/homepage/sections/reorder', { json: { sectionIds } })
    .json<{ success: boolean; data: HomepageSection[] }>()
  return res.data
}
