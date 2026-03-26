import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  SiteHeaderUpdateInput,
  SiteFooterUpdateInput,
  HomepageSectionCreateInput,
  HomepageSectionUpdateInput,
} from '@letmein/types'
import {
  fetchHomepageConfig,
  fetchSiteHeader,
  updateSiteHeader,
  fetchSiteFooter,
  updateSiteFooter,
  fetchHomepageSections,
  fetchHomepageSection,
  createHomepageSection,
  updateHomepageSection,
  deleteHomepageSection,
  reorderHomepageSections,
} from './api'

export const homepageKeys = {
  all: ['homepage'] as const,
  config: ['homepage', 'config'] as const,
  header: ['homepage', 'header'] as const,
  footer: ['homepage', 'footer'] as const,
  sections: ['homepage', 'sections'] as const,
  section: (id: string) => ['homepage', 'sections', id] as const,
}

// ==================== Homepage Config ====================

export function useHomepageConfig() {
  return useQuery({
    queryKey: homepageKeys.config,
    queryFn: fetchHomepageConfig,
  })
}

// ==================== Header ====================

export function useSiteHeader() {
  return useQuery({
    queryKey: homepageKeys.header,
    queryFn: fetchSiteHeader,
  })
}

export function useUpdateSiteHeader() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: SiteHeaderUpdateInput) => updateSiteHeader(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: homepageKeys.header })
      queryClient.invalidateQueries({ queryKey: homepageKeys.config })
    },
  })
}

// ==================== Footer ====================

export function useSiteFooter() {
  return useQuery({
    queryKey: homepageKeys.footer,
    queryFn: fetchSiteFooter,
  })
}

export function useUpdateSiteFooter() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: SiteFooterUpdateInput) => updateSiteFooter(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: homepageKeys.footer })
      queryClient.invalidateQueries({ queryKey: homepageKeys.config })
    },
  })
}

// ==================== Sections ====================

export function useHomepageSections() {
  return useQuery({
    queryKey: homepageKeys.sections,
    queryFn: fetchHomepageSections,
  })
}

export function useHomepageSection(id: string) {
  return useQuery({
    queryKey: homepageKeys.section(id),
    queryFn: () => fetchHomepageSection(id),
    enabled: !!id,
  })
}

export function useCreateHomepageSection() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: HomepageSectionCreateInput) => createHomepageSection(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: homepageKeys.sections })
      queryClient.invalidateQueries({ queryKey: homepageKeys.config })
    },
  })
}

export function useUpdateHomepageSection() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: HomepageSectionUpdateInput }) =>
      updateHomepageSection(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: homepageKeys.section(id) })
      queryClient.invalidateQueries({ queryKey: homepageKeys.sections })
      queryClient.invalidateQueries({ queryKey: homepageKeys.config })
    },
  })
}

export function useDeleteHomepageSection() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteHomepageSection(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: homepageKeys.sections })
      queryClient.invalidateQueries({ queryKey: homepageKeys.config })
    },
  })
}

export function useReorderHomepageSections() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (sectionIds: string[]) => reorderHomepageSections(sectionIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: homepageKeys.sections })
    },
  })
}
