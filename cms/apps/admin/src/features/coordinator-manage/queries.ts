import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { ConsultationListParams, MatchPayload } from '@letmein/types'
import { fetchConsultations, fetchConsultationDetail, matchConsultation, updateConsultationStatus } from './api'

export const consultationKeys = {
  all: ['consultations'] as const,
  lists: () => [...consultationKeys.all, 'list'] as const,
  list: (params: ConsultationListParams) => [...consultationKeys.lists(), params] as const,
  details: () => [...consultationKeys.all, 'detail'] as const,
  detail: (id: number) => [...consultationKeys.details(), id] as const,
}

export function useConsultations(params: ConsultationListParams) {
  return useQuery({
    queryKey: consultationKeys.list(params),
    queryFn: () => fetchConsultations(params),
    placeholderData: (prev) => prev,
  })
}

export function useConsultationDetail(id: number) {
  return useQuery({
    queryKey: consultationKeys.detail(id),
    queryFn: () => fetchConsultationDetail(id),
    enabled: id > 0,
  })
}

export function useMatchConsultation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: MatchPayload }) => matchConsultation(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: consultationKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: consultationKeys.lists() })
    },
  })
}

export function useUpdateConsultationStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { status: string; note?: string } }) =>
      updateConsultationStatus(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: consultationKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: consultationKeys.lists() })
    },
  })
}
