import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchReports,
  fetchReportDetail,
  processReport,
  fetchSanctions,
  createSanction,
  liftSanction,
  fetchBannedWords,
  createBannedWord,
  deleteBannedWord,
  testBannedWords,
  type ReportsParams,
  type SanctionsParams,
  type BannedWordsParams,
} from './api'
import type {
  ReportProcessRequest,
  SanctionCreateRequest,
  BannedWordCreateRequest,
  BannedWordTestRequest,
} from '@letmein/types'

// ==================== Reports ====================

export const reportKeys = {
  all: ['reports'] as const,
  lists: () => [...reportKeys.all, 'list'] as const,
  list: (params: ReportsParams) => [...reportKeys.lists(), params] as const,
  details: () => [...reportKeys.all, 'detail'] as const,
  detail: (id: string) => [...reportKeys.details(), id] as const,
}

export function useReports(params: ReportsParams = {}) {
  return useQuery({
    queryKey: reportKeys.list(params),
    queryFn: () => fetchReports(params),
  })
}

export function useReportDetail(id: string) {
  return useQuery({
    queryKey: reportKeys.detail(id),
    queryFn: () => fetchReportDetail(id),
    enabled: !!id,
  })
}

export function useProcessReport() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ReportProcessRequest }) =>
      processReport(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reportKeys.all })
    },
  })
}

// ==================== Sanctions ====================

export const sanctionKeys = {
  all: ['sanctions'] as const,
  lists: () => [...sanctionKeys.all, 'list'] as const,
  list: (params: SanctionsParams) => [...sanctionKeys.lists(), params] as const,
}

export function useSanctions(params: SanctionsParams = {}) {
  return useQuery({
    queryKey: sanctionKeys.list(params),
    queryFn: () => fetchSanctions(params),
  })
}

export function useCreateSanction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: SanctionCreateRequest) => createSanction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sanctionKeys.all })
    },
  })
}

export function useLiftSanction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => liftSanction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sanctionKeys.all })
    },
  })
}

// ==================== Banned Words ====================

export const bannedWordKeys = {
  all: ['banned-words'] as const,
  lists: () => [...bannedWordKeys.all, 'list'] as const,
  list: (params: BannedWordsParams) => [...bannedWordKeys.lists(), params] as const,
}

export function useBannedWords(params: BannedWordsParams = {}) {
  return useQuery({
    queryKey: bannedWordKeys.list(params),
    queryFn: () => fetchBannedWords(params),
  })
}

export function useCreateBannedWord() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: BannedWordCreateRequest) => createBannedWord(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bannedWordKeys.all })
    },
  })
}

export function useDeleteBannedWord() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteBannedWord(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bannedWordKeys.all })
    },
  })
}

export function useTestBannedWords() {
  return useMutation({
    mutationFn: (data: BannedWordTestRequest) => testBannedWords(data),
  })
}
