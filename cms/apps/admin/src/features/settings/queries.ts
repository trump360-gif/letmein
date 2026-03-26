import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchSettings,
  updateSettings,
  fetchTerms,
  fetchTermsById,
  createTerms,
  fetchTranslations,
  createTranslation,
  updateTranslation,
} from './api'
import type {
  SiteSettingsUpdatePayload,
  TermsCreatePayload,
  TranslationCreatePayload,
  TranslationUpdatePayload,
} from '@letmein/types'

// ==================== Settings ====================

export const settingsKeys = {
  all: ['settings'] as const,
  list: () => [...settingsKeys.all, 'list'] as const,
}

export function useSettings() {
  return useQuery({
    queryKey: settingsKeys.list(),
    queryFn: fetchSettings,
    staleTime: 60 * 1000,
  })
}

export function useUpdateSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: SiteSettingsUpdatePayload) => updateSettings(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.all })
    },
  })
}

// ==================== Terms ====================

export const termsKeys = {
  all: ['terms'] as const,
  list: (type?: string) => [...termsKeys.all, 'list', type] as const,
  detail: (id: string) => [...termsKeys.all, 'detail', id] as const,
}

export function useTerms(type?: string) {
  return useQuery({
    queryKey: termsKeys.list(type),
    queryFn: () => fetchTerms(type),
    staleTime: 60 * 1000,
  })
}

export function useTermsDetail(id: string | null) {
  return useQuery({
    queryKey: termsKeys.detail(id!),
    queryFn: () => fetchTermsById(id!),
    enabled: !!id,
    staleTime: 60 * 1000,
  })
}

export function useCreateTerms() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: TermsCreatePayload) => createTerms(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: termsKeys.all })
    },
  })
}

// ==================== Translations ====================

export const translationKeys = {
  all: ['translations'] as const,
  list: (params?: { search?: string; page?: number }) =>
    [...translationKeys.all, 'list', params] as const,
}

export function useTranslations(params?: { search?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: translationKeys.list(params),
    queryFn: () => fetchTranslations(params),
    staleTime: 60 * 1000,
  })
}

export function useCreateTranslation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: TranslationCreatePayload) => createTranslation(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: translationKeys.all })
    },
  })
}

export function useUpdateTranslation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: TranslationUpdatePayload) => updateTranslation(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: translationKeys.all })
    },
  })
}
