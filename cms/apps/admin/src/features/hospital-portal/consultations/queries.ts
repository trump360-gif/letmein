import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchConsultations,
  respondToConsultation,
  type ConsultationStatus,
  type RespondData,
} from './api'

export const consultationKeys = {
  all: ['hospital', 'consultations'] as const,
  list: (status: ConsultationStatus) =>
    [...consultationKeys.all, status] as const,
}

export function useConsultationsQuery(status: ConsultationStatus) {
  return useQuery({
    queryKey: consultationKeys.list(status),
    queryFn: () => fetchConsultations(status),
  })
}

export function useRespondToConsultationMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      requestId,
      data,
    }: {
      requestId: number | string
      data: RespondData
    }) => respondToConsultation(requestId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: consultationKeys.all })
    },
  })
}
